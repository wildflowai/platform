use anyhow::Result;
use async_graphql::{Context, EmptyMutation, EmptySubscription, Object, Schema, SimpleObject};
use gcp_bigquery_client::{model::query_request::QueryRequest, Client};
use serde_json::Value;

/// A single column within a database table.
#[derive(SimpleObject)]
struct TableColumn {
    /// The name of the column.
    name: String,
}

/// Represents a database table with multiple columns.
#[derive(SimpleObject)]
struct Table {
    /// The name of the table.
    name: String,
    /// A list of columns in the table.
    columns: Vec<TableColumn>,
}

/// Executes an arbitrary SQL query on Google BigQuery and returns the results as JSON.
async fn execute_bigquery_query(query: &str) -> Result<Vec<Value>> {
    let client = Client::from_service_account_key_file("bigquery-sa.json").await?;
    let mut response = client
        .job()
        .query("wildflow-pelagic", QueryRequest::new(query.to_string()))
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

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Fetches a list of tables available in the database.
    async fn tables(&self, _ctx: &Context<'_>) -> Vec<Table> {
        vec![Table {
            name: "Table1".to_string(),
            columns: vec![
                TableColumn {
                    name: "Column1".to_string(),
                },
                TableColumn {
                    name: "Column2".to_string(),
                },
            ],
        }]
    }

    /// Executes an arbitrary SQL query on Google BigQuery and returns the results as JSON.
    async fn execute_bigquery_query(
        &self,
        _ctx: &Context<'_>,
        query: String,
    ) -> Result<Vec<Value>> {
        execute_bigquery_query(&query).await
    }
}

pub type MySchema = Schema<QueryRoot, EmptyMutation, EmptySubscription>;

/// Creates and returns a new GraphQL schema.
pub fn create_schema() -> MySchema {
    Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish()
}
