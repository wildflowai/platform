use anyhow::Result;
use async_graphql::{Context, EmptyMutation, EmptySubscription, Object, Schema, SimpleObject};
use gcp_bigquery_client::{model::query_request::QueryRequest, Client};

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

/// Executes an arbitrary SQL query on Google BigQuery.
async fn execute_bigquery_query(query: &str) -> Result<String> {
    let client = Client::from_service_account_key_file("bigquery-sa.json").await?;
    client
        .job()
        .query("wildflow-pelagic", QueryRequest::new(query.to_string()))
        .await?;

    Ok("Query executed successfully".to_string())
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

    /// Executes an arbitrary SQL query on Google BigQuery and returns a simple message.
    async fn execute_bigquery_query(&self, _ctx: &Context<'_>, query: String) -> Result<String> {
        execute_bigquery_query(&query).await
    }
}

pub type MySchema = Schema<QueryRoot, EmptyMutation, EmptySubscription>;

/// Creates and returns a new GraphQL schema.
pub fn create_schema() -> MySchema {
    Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish()
}
