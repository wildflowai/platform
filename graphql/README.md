## GraphQL API

Our main microservice powering https://api.wildflow.ai/graphql (will be available soon). It talks to underlying resources like Google BigQuery, GCS buckets, Dataflow pipelines and Postgres (metadata).

It's in early development and being migrated from our [Firebase Functions API](/api/).

## Usage

For now it's running as a container on CloudRun.

Build:

```sh
cargo clean
gcloud builds submit --tag gcr.io/wildflow-demo/wildflow-graphql .
```

Deploy:

```
gcloud run deploy --image gcr.io/wildflow-demo/wildflow-graphql --platform managed --project wildflow-demo
```

Test:

```sh
curl -X POST -H "Content-Type: application/json" -d '{"query":"query { tables { name columns { name } } }"}' https://wildflow-graphql-giuzxofzpa-ew.a.run.app/graphql
```

Or:

```graphql
query {
  bigquery {
    executeBigqueryQuery(query: "SELECT * FROM raw.results LIMIT 2")
  }
}
```
