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
// use std::fs;
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
    let html = r#"
    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="robots" content="noindex" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="referrer" content="origin" />

            <title>GraphiQL IDE</title>

            <style>
            body {
                height: 100%;
                margin: 0;
                width: 100%;
                overflow: hidden;
            }

            #graphiql {
                height: 100vh;
            }
            </style>
            <script
            crossorigin
            src="https://unpkg.com/react@17/umd/react.development.js"
            ></script>
            <script
            crossorigin
            src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"
            ></script>
            <link rel="icon" href="https://graphql.org/favicon.ico" />
            <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
            <link
            rel="stylesheet"
            href="https://unpkg.com/@graphiql/plugin-explorer/dist/style.css"
            />
        </head>

        <body>
            <div id="graphiql">Loading...</div>
            <script
            src="https://unpkg.com/graphiql/graphiql.min.js"
            type="application/javascript"
            ></script>
            <script
            src="https://unpkg.com/@graphiql/plugin-explorer/dist/index.umd.js"
            crossorigin
            ></script>
            <script>
            customFetch = (url, opts = {}) => {
                return fetch(url, { ...opts, credentials: "include" });
            };

            createUrl = (endpoint, subscription = false) => {
                const url = new URL(endpoint, window.location.origin);
                if (subscription) {
                url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
                }
                return url.toString();
            };

            const plugins = [];
            plugins.push(GraphiQLPluginExplorer.explorerPlugin());

            ReactDOM.render(
                React.createElement(GraphiQL, {
                fetcher: GraphiQL.createFetcher({
                    url: createUrl("/graphql"),
                    fetch: customFetch,
                    subscriptionUrl: createUrl("/ws", true),
                    headers: {
                    Authorization: "Bearer [token]",
                    },
                }),
                defaultEditorToolsVisibility: true,
                plugins,
                }),
                document.getElementById("graphiql")
            );
            </script>
        </body>
        </html>
    "#;
    Html(html.to_string())
    // Html(fs::read_to_string("src/graphiql.html").unwrap())
}
