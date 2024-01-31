use anyhow::{anyhow, Error, Result};
use async_graphql::SimpleObject;
use futures::stream::{self, StreamExt};
use gcp_bigquery_client::{
    dataset::ListOptions as DatasetListOptions, model::query_request::QueryRequest,
    table::ListOptions as TableListOptions, Client,
};
use log::info;
use reqwest;
use serde_json::{json, Map, Value};
use std::env;

const DEFAULT_LIMIT: u64 = 5;

pub async fn table_rows(dataset: &str, table: &str, limit: Option<u64>) -> Result<Vec<Value>> {
    execute_bigquery_query(&format!(
        "SELECT * FROM {}.{} LIMIT {}",
        dataset,
        table,
        limit.unwrap_or(DEFAULT_LIMIT)
    ))
    .await
}

pub async fn project_table_names(project: &str, limit: Option<u64>) -> Result<Vec<String>> {
    let sa_key_file = env::var("BIGQUERY_SA_KEY_FILE")?;
    let client = Client::from_service_account_key_file(&sa_key_file).await?;

    let datasets = client
        .dataset()
        .list(
            project,
            DatasetListOptions::default().max_results(limit.unwrap_or(DEFAULT_LIMIT)),
        )
        .await?
        .datasets
        .into_iter()
        .map(|dataset| dataset.dataset_reference.dataset_id)
        .collect::<Vec<_>>();

    let tables_stream = stream::iter(datasets.into_iter().map(|dataset| {
        let project_clone = project.to_string();
        async move { dataset_table_names(&project_clone, &dataset, limit).await }
    }));

    let tables = tables_stream
        .buffer_unordered(10)
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .collect::<Result<Vec<_>, _>>()?
        .into_iter()
        .flatten()
        .collect::<Vec<String>>();

    Ok(tables)
}

pub async fn dataset_table_names(
    project: &str,
    dataset: &str,
    limit: Option<u64>,
) -> Result<Vec<String>> {
    let sa_key_file = env::var("BIGQUERY_SA_KEY_FILE")?;
    let client = Client::from_service_account_key_file(&sa_key_file).await?;

    let response = client
        .table()
        .list(
            project,
            dataset,
            TableListOptions::default().max_results(limit.unwrap_or(DEFAULT_LIMIT)),
        )
        .await?;

    let table_names = response
        .tables
        .unwrap_or_default()
        .into_iter()
        .map(|table| table.table_reference.table_id)
        .collect();

    Ok(table_names)
}

/// Executes an arbitrary SQL query on Google BigQuery and returns the results as JSON.
pub async fn execute_bigquery_query(query: &str) -> Result<Vec<Value>> {
    let project_id = env::var("BIGQUERY_PROJECT_ID")?;
    let sa_key_file = env::var("BIGQUERY_SA_KEY_FILE")?;

    let client = Client::from_service_account_key_file(&sa_key_file).await?;
    let mut response = client
        .job()
        .query(&project_id, QueryRequest::new(query.to_string()))
        .await?;

    let results = (0..response.row_count())
        .filter_map(|_| {
            response.next_row().then(|| {
                response
                    .column_names()
                    .iter()
                    .map(|column_name| {
                        let column_value = response
                            .get_serde_by_name::<Value>(column_name)
                            .unwrap_or(None)
                            .unwrap_or(Value::Null);
                        (column_name.to_string(), column_value)
                    })
                    .collect::<serde_json::Map<_, _>>()
            })
        })
        .map(Value::Object)
        .collect();

    Ok(results)
}

#[derive(SimpleObject, PartialEq, Debug)]
pub struct TableInfo {
    pub table_name: String,
    pub dataset_name: String,
    pub created_millis: f64,
    pub total_rows: u64,
    pub total_logical_bytes: i64,
    pub total_physical_bytes: i64,
    pub last_modified_millis: f64,
}

// A macro for parsing fields
macro_rules! parse_field {
    ($row:expr, $field_name:expr, $type:ty) => {
        $row[$field_name]
            .as_str()
            .ok_or_else(|| anyhow!("Missing '{}'", $field_name))?
            .parse::<$type>()
            .map_err(|_| anyhow!("Invalid format for '{}'", $field_name))?
    };
}

pub async fn tables_info(
    token: &str,
    project: &str,
    query_filter: Option<&str>,
) -> Result<Vec<TableInfo>, Error> {
    let default_region = "region-us";
    let query = format!(
        r#"
        SELECT
            t.table_name,
            t.table_schema AS dataset_name,
            t.creation_time AS created_millis,
            t.total_rows,
            t.total_logical_bytes,
            t.total_physical_bytes,
            t.storage_last_modified_time AS last_modified_millis
        FROM `{}.{}.INFORMATION_SCHEMA.TABLE_STORAGE` t
        WHERE t.project_id = '{}' {}
        "#,
        project,
        default_region,
        project,
        query_filter.unwrap_or_default()
    );

    execute_bigquery_query_bearer(token, project, &query)
        .await?
        .into_iter()
        .map(|row| {
            let table_info = TableInfo {
                table_name: parse_field!(row, "table_name", String),
                dataset_name: parse_field!(row, "dataset_name", String),
                created_millis: parse_field!(row, "created_millis", f64),
                total_rows: parse_field!(row, "total_rows", u64),
                total_logical_bytes: parse_field!(row, "total_logical_bytes", i64),
                total_physical_bytes: parse_field!(row, "total_physical_bytes", i64),
                last_modified_millis: parse_field!(row, "last_modified_millis", f64),
            };
            Ok(table_info)
        })
        .collect()
}

/// Executes an arbitrary SQL query on Google BigQuery using Bearer token authentication and returns
/// the results as JSON.
pub async fn execute_bigquery_query_bearer(
    token: &str,
    project_id: &str,
    query: &str,
) -> Result<Vec<Value>, Error> {
    info!("Starting query execution...");
    let client = reqwest::Client::new();

    let response = client
        .post(&format!(
            "https://bigquery.googleapis.com/bigquery/v2/projects/{}/queries",
            project_id
        ))
        .bearer_auth(token)
        .json(&json!({
            "query": query,
            "useLegacySql": false
        }))
        .send()
        .await?;

    let status = response.status();
    let json_response = response.json::<serde_json::Value>().await?;

    if status.is_success() {
        parse_bigquery_response(json_response)
    } else if let Some(error) = json_response["error"].as_object() {
        let error_message = error
            .get("message")
            .and_then(Value::as_str)
            .unwrap_or("Unknown error")
            .to_string();
        Err(anyhow::anyhow!(error_message))
    } else {
        Err(anyhow::anyhow!("BigQuery API request failed"))
    }
}

fn parse_bigquery_response(json_response: serde_json::Value) -> Result<Vec<Value>> {
    let fields = json_response["schema"]["fields"]
        .as_array()
        .ok_or_else(|| anyhow::anyhow!("Invalid schema format"))?
        .iter()
        .map(|field| field["name"].as_str().unwrap_or_default().to_string())
        .collect::<Vec<String>>();

    let rows = json_response
        .get("rows")
        .and_then(Value::as_array)
        .map_or_else(|| vec![], |r| r.to_vec());

    let results = rows
        .iter()
        .map(|row| {
            let empty_row_values = Vec::new();
            let row_values = row["f"].as_array().unwrap_or(&empty_row_values);
            Value::Object(
                fields
                    .iter()
                    .zip(row_values.iter())
                    .map(|(field_name, value)| {
                        (
                            field_name.clone(),
                            value.get("v").cloned().unwrap_or(Value::Null),
                        )
                    })
                    .collect::<Map<String, Value>>(),
            )
        })
        .collect::<Vec<Value>>();

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tokio;

    #[tokio::test]
    async fn test_run_query_auth_basic_select_ok() {
        let expected = vec![json!({"numbers": "123", "letters": "abc"})];

        let tested = execute_bigquery_query_bearer(
            &token(),
            &project(),
            "select 123 as numbers, 'abc' as letters",
        )
        .await
        .expect("Query failed");

        assert_eq!(tested, expected);
    }

    #[tokio::test]
    async fn test_run_query_auth_create_table_empty_output() {
        let query = "
            create or replace table raw.test_table as (
                select 123 as numbers, 'abc' as letters
            );
            ";
        let expected: Vec<Value> = vec![];

        let tested = execute_bigquery_query_bearer(&token(), &project(), query)
            .await
            .expect("Query failed");

        assert_eq!(tested, expected);
    }

    #[tokio::test]
    async fn test_run_query_auth_incorrect_query_error() {
        let query = "some incorrect query";

        let result = execute_bigquery_query_bearer(&token(), &project(), query).await;

        match result {
            Ok(_) => panic!("Expected an error but query succeeded"),
            Err(e) => assert!(
                e.to_string()
                    .contains("Syntax error: Unexpected keyword SOME at [1:1]"),
                "Error message did not match expected value"
            ),
        }
    }

    #[tokio::test]
    async fn test_tables_info_returned() {
        let create_table_query = "
            create or replace table raw.test_table_info_table as (
                select 123 as numbers, 'abc' as letters
            );
            ";
        execute_bigquery_query_bearer(&token(), &project(), create_table_query)
            .await
            .expect("Query failed");

        let tested = tables_info(
            &token(),
            &project(),
            Some("and t.table_name = 'test_table_info_table'"),
        )
        .await
        .expect("Query failed");

        print!("{:?}", tested);

        assert_eq!(tested.len(), 1);
        let result = &tested[0];
        assert_eq!(result.table_name, "test_table_info_table");
        assert_eq!(result.dataset_name, "raw");
        assert_eq!(result.total_rows, 1);
        assert!(result.total_logical_bytes > 10);
        assert!(result.total_physical_bytes > 9000);
        assert!(result.created_millis.is_sign_positive());
        assert!(result.last_modified_millis.is_sign_positive());
    }

    fn project() -> String {
        std::env::var("WILDFLOW_BIGQUERY_TEST_PROJECT").unwrap()
    }

    fn token() -> String {
        std::env::var("GCP_ACCESS_TOKEN").expect("GCP_ACCESS_TOKEN not set")
    }
}
