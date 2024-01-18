use crate::bigquery::execute_bigquery_query;
use crate::models::{Table, TableColumn};
use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema};
use serde_json::Value;

/// Namespace for BigQuery related queries.
pub struct BigQuery;

#[Object]
impl BigQuery {
    /// Fetches a list of tables available in the database.
    async fn tables(&self) -> Vec<Table> {
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
    async fn execute_bigquery_query(&self, query: String) -> Result<Vec<Value>, anyhow::Error> {
        execute_bigquery_query(&query).await
    }
}

/// Root for GraphQL queries.
pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Access to BigQuery related queries.
    async fn bigquery(&self) -> BigQuery {
        BigQuery
    }
}

pub type MySchema = Schema<QueryRoot, EmptyMutation, EmptySubscription>;

/// Creates and returns a new GraphQL schema.
///
/// This function initializes the GraphQL schema with a QueryRoot, EmptyMutation, and EmptySubscription.
/// It's used to setup the GraphQL server with necessary query handling capabilities.
pub fn create_schema() -> MySchema {
    Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish()
}
