use crate::bigquery::{
    dataset_table_names, execute_bigquery_query, project_table_names, table_rows,
};
use crate::models::{Dataset, Table, TableColumn};
use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema};
use serde_json::Value;

/// Namespace for BigQuery related queries.
pub struct BigQuery;

#[Object]
impl BigQuery {
    /// Fetches a list of tables available in the database.
    async fn tables(
        &self,
        project: String,
        limit: Option<u64>,
    ) -> Result<Vec<Table>, anyhow::Error> {
        Ok(project_table_names(&project, limit)
            .await?
            .into_iter()
            .map(|name| Table { name })
            .collect())
    }
    /// Executes an arbitrary SQL query on Google BigQuery and returns the results as JSON.
    async fn execute_bigquery_query(&self, query: String) -> Result<Vec<Value>, anyhow::Error> {
        execute_bigquery_query(&query).await
    }
}

#[Object]
impl Table {
    async fn name(&self) -> &str {
        &self.name
    }

    async fn columns(&self) -> Vec<TableColumn> {
        fetch_columns_for_table(&self.name).await
    }

    async fn rows(&self, limit: Option<u64>) -> Result<Vec<Value>, anyhow::Error> {
        table_rows(&"raw".to_string(), &self.name, limit).await
    }
}

#[Object]
impl Dataset {
    async fn name(&self) -> &str {
        &self.name
    }

    async fn tables(&self) -> Vec<Table> {
        vec![
            Table {
                name: "table 1".to_string(),
            },
            Table {
                name: "table 2".to_string(),
            },
        ]
    }
}

async fn fetch_columns_for_table(_table_name: &str) -> Vec<TableColumn> {
    // Mock implementation. Replace with actual logic.
    vec![
        TableColumn {
            name: "Column1".to_string(),
        },
        TableColumn {
            name: "Column2".to_string(),
        },
    ]
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
