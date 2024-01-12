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
