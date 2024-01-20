mod bigquery;
mod graphql;
mod models;

use crate::graphql::{create_schema, MySchema};
use async_graphql::http::GraphiQLSource;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::response::{Html, IntoResponse};
use axum::routing::{get, post};
use axum::{Extension, Router};
use dotenv::dotenv;
use std::net::SocketAddr;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let schema = Arc::new(create_schema());
    let app = Router::new()
        .route("/graphql/explore", get(graphiql_handler))
        .route("/graphql", post(graphql_handler))
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

async fn graphql_handler(schema: Extension<Arc<MySchema>>, req: GraphQLRequest) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

pub async fn graphiql_handler() -> impl IntoResponse {
    Html(GraphiQLSource::build().endpoint("/graphql").finish())
}
