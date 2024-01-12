mod graphql;

use crate::graphql::{create_schema, MySchema};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{routing::post, Extension, Router};
use std::net::SocketAddr;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let schema = Arc::new(create_schema());
    let app = Router::new()
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
