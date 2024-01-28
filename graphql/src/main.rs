mod bigquery;
mod graphql;
mod models;

use crate::graphql::{create_schema, MySchema};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::http::header::HeaderMap;
use axum::response::{Html, IntoResponse};
use axum::routing::{get, post};
use axum::{Extension, Router};
use dotenv::dotenv;
use std::fs;
use std::net::SocketAddr;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let schema = Arc::new(create_schema());
    let app = Router::new()
        .route("/graphql", post(graphql_handler))
        .route("/graphql", get(graphiql_query_explorer_handler))
        .route("/graphiql", get(graphiql_query_explorer_handler))
        .layer(Extension(schema));

    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let address = format!("0.0.0.0:{}", port);
    let socket_address = address
        .parse::<SocketAddr>()
        .expect("Invalid socket address");

    axum::Server::bind(&socket_address)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn graphql_handler(
    schema: Extension<Arc<MySchema>>,
    headers: HeaderMap,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let mut req = req.into_inner();
    req.data.insert(headers);
    schema.execute(req).await.into()
}

async fn graphiql_query_explorer_handler() -> impl IntoResponse {
    Html(fs::read_to_string("src/graphiql.html").unwrap())
}
