I want to create API to run R in the cloud, in particular to access big query.
Here's my artifacts and shell commands I run:

```Dockerfile
FROM rocker/r-ver:4.0.5

RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libsodium-dev

RUN Rscript -e "install.packages(c('sodium', 'bigrquery', 'dplyr', 'plumber', 'jsonlite', 'openssl'), dependencies=TRUE)"

COPY api.R /api.R

# Set environment variables
ENV BIGQUERY_TEST_PROJECT_ID=wildflow-pelagic
ENV BIGQUERY_AUTH=adc

EXPOSE 8080

CMD ["Rscript", "-e", "pr <- plumber::plumb('/api.R'); pr$run(port=8080, host='0.0.0.0')"]
```

api.R

```R
library(plumber)
library(bigrquery)
library(jsonlite)
library(openssl)
library(DBI)

project_id <- "wildflow-pelagic"

wfsql <- function(sql) {
  con <- dbConnect(
    bigrquery::bigquery(),
    project = project_id,
    billing = project_id
  )
  result <- dbGetQuery(con, sql)
  dbDisconnect(con)
  return(result)
}

wfread <- function(tableName, n = NULL) {
  sql <- paste0("SELECT * FROM ", tableName)
  if (!is.null(n)) {
    sql <- paste0(sql, " LIMIT ", n)
  }
  return(wfsql(sql))
}

wfwrite <- function(tableName, dataframe) {
  con <- dbConnect(
    bigrquery::bigquery(),
    project = project_id,
    billing = project_id
  )
  dbWriteTable(con, tableName, dataframe, overwrite = TRUE)
  dbDisconnect(con)
  return(TRUE)
}

#* @apiTitle R Execution API

#* @post /run
function(req, res) {
  # Decode the Base64 encoded R code
  code_raw <- req$postBody
  code_decoded <- rawToChar(openssl::base64_decode(code_raw))

  result <- tryCatch({
    # Evaluate the R code
    eval_result <- eval(parse(text = code_decoded))

    # If result is a data frame, convert it to a JSON string and then to Base64
    if (is.data.frame(eval_result)) {
      result_json <- toJSON(eval_result)
      result_base64 <- base64_encode(charToRaw(result_json))
      return(result_base64)
    }

    # If result is not a data frame, convert it to a character string
    result_char <- as.character(eval_result)

    # Encode the result as Base64
    result_base64 <- base64_encode(charToRaw(result_char))

    return(result_base64)

  }, error = function(e) {
    res$status <- 500
    error_message <- base64_encode(charToRaw(e$message))
    return(list(error = error_message))
  })

  return(result)
}
```

```R
library(bigrquery)
library(DBI)

# Set your BigQuery project ID
project_id <- "wildflow-demo"

# Construct the SQL query to retrieve the first 5 rows
query <- "
  SELECT *
  FROM `wildflow-pelagic.env.chlorophyll`
  LIMIT 5
"

# Run the query and store the result in a data frame
result <- dbGetQuery(
  bigrquery::dbConnect(
    bigrquery::bigquery(),
    project = project_id,
    dataset = "env",
    billing = project_id
  ),
  query
)

# Print the result
print(result)

```

First these commands:

```sh
$ gcloud config set project
$ docker build -t gcr.io/wildflow-demo/wildflow-r:v3 .

$ gcloud auth configure-docker
$ docker push gcr.io/wildflow-demo/wildflow-r:v3
```

Deployment:

```sh
gcloud run deploy wildflow-r \
  --image gcr.io/wildflow-demo/wildflow-r:v6 \
  --platform managed \
  --region us-central1 \
  --set-env-vars=BIGQUERY_TEST_PROJECT_ID=wildflow-pelagic,BIGQUERY_AUTH=adc
```

Here's how I test it:
Note: if I sent code "2 + 2", it returns me "[4]"

```sh
ID_TOKEN=$(gcloud auth print-identity-token)

curl -X POST \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  --data-raw 'MisyCg==' \
   https://wildflow-r-giuzxofzpa-uc.a.run.app/run


curl -X POST \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  --data-raw 'library(bigrquery)

# Construct the SQL query
query <- "
  SELECT *
  FROM `wildflow-pelagic.env.chlorophyll`
  LIMIT 5
"

# Run the query and store the result in a data frame
project_id <- "wildflow-pelagic"
df <- bq_project_query(project_id, query)

# Print the result
print(df)' \
  https://wildflow-r-giuzxofzpa-uc.a.run.app/run
```

````

gcloud config set project wildflow-demo
gcloud iam service-accounts create wildflow-r-sa --display-name "wildflow R service account"

---

```sh
gcloud config set project wildflow-pelagic

gcloud projects add-iam-policy-binding wildflow-pelagic \
 --member="serviceAccount:wildflow-r-sa@wildflow-demo.iam.gserviceaccount.com" \
 --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding wildflow-pelagic \
 --member="serviceAccount:wildflow-r-sa@wildflow-demo.iam.gserviceaccount.com" \
 --role="roles/bigquery.jobUser"
````

---

```sh
gcloud config set project wildflow-demo

gcloud iam service-accounts keys create wildflow-r-sa-key.json \
 --iam-account=wildflow-r-sa@wildflow-demo.iam.gserviceaccount.com
```

---

```sh
gcloud run services add-iam-policy-binding wildflow-r \
 --member="serviceAccount:94691833573-compute@developer.gserviceaccount.com" \
 --member="user:nozdrenkov@gmail.com" \
 --member="group:wildflow-pelagioskakunja-access@googlegroups.com" \
 --role="roles/run.invoker" \
 --project=wildflow-demo
```
