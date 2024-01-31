use crate::bigquery::{execute_bigquery_query_bearer, table_rows, tables_info, TableInfo};
use crate::models::TableColumn;
use async_graphql::{Context, EmptyMutation, EmptySubscription, Object, Schema};
use http::header::HeaderMap;

use serde_json::Value;

/// Namespace for BigQuery related queries.
pub struct BigQuery;

#[Object]
impl BigQuery {
    /// Fetches a list of tables available in the database.
    async fn tables(
        &self,
        ctx: &Context<'_>,
        project: String,
        limit: Option<u64>,
    ) -> Result<Vec<TableInfo>, anyhow::Error> {
        let token = self
            .ctx_auth_token(ctx)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Authentication token is missing"))?;

        Ok(tables_info(&token, &project, Some(""), limit).await?)
    }

    async fn ctx_auth_token(&self, ctx: &Context<'_>) -> Result<Option<String>, anyhow::Error> {
        let headers = ctx
            .data_opt::<HeaderMap>()
            .ok_or_else(|| anyhow::anyhow!("No headers found in the context"))?;

        let auth_header_value = match headers.get(http::header::AUTHORIZATION) {
            Some(value) => value,
            None => return Ok(None),
        };

        let auth_header_str = auth_header_value
            .to_str()
            .map_err(|_| anyhow::anyhow!("Failed to convert the header value to a string"))?;

        Ok(auth_header_str
            .strip_prefix("Bearer ")
            .map(|s| s.trim().to_string()))
    }

    async fn execute_bigquery_query_bearer(
        &self,
        ctx: &Context<'_>,
        project: String,
        query: String,
    ) -> Result<Vec<Value>, anyhow::Error> {
        let token = self
            .ctx_auth_token(ctx)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Authentication token is missing"))?;
        execute_bigquery_query_bearer(&token, &project, &query).await
    }
}

#[Object]
impl TableInfo {
    async fn name(&self) -> &str {
        &self.table_name
    }

    async fn columns(&self) -> Vec<TableColumn> {
        fetch_columns_for_table(&self.table_name).await
    }

    async fn rows(
        &self,
        ctx: &Context<'_>,
        limit: Option<u64>,
    ) -> Result<Vec<Value>, anyhow::Error> {
        let token = self
            .ctx_auth_token(ctx)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Authentication token is missing"))?;
        table_rows(&token, "wildflow-pelagic", "raw", &self.table_name, limit).await
    }

    async fn ctx_auth_token(&self, ctx: &Context<'_>) -> Result<Option<String>, anyhow::Error> {
        let headers = ctx
            .data_opt::<HeaderMap>()
            .ok_or_else(|| anyhow::anyhow!("No headers found in the context"))?;

        let auth_header_value = match headers.get(http::header::AUTHORIZATION) {
            Some(value) => value,
            None => return Ok(None),
        };

        let auth_header_str = auth_header_value
            .to_str()
            .map_err(|_| anyhow::anyhow!("Failed to convert the header value to a string"))?;

        Ok(auth_header_str
            .strip_prefix("Bearer ")
            .map(|s| s.trim().to_string()))
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
