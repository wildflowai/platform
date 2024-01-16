use anyhow::Result;
use gcp_bigquery_client::{model::query_request::QueryRequest, Client};
use serde_json::Value;
use std::env;

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
