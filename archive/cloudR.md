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
# library(plumber)
# r <- plumb("api.R")
# r$run(port = 8000)

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
    # Evaluate the R code and capture the output
    eval_result <- capture.output({
      eval(parse(text = code_decoded))
    })

    # Convert the output to a single string
    output_str <- paste(eval_result, collapse = "\n")

    # Encode the output as Base64
    output_base64 <- base64_encode(charToRaw(output_str))

    return(output_base64)

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

test.sh:

```sh
#!/bin/bash

# Function to send a request to the local environment
send_local_request() {
  local base64_request=$1
  response=$(curl -s -X POST -H "Content-Type: text/plain" --data-raw "$base64_request" http://127.0.0.1:8000/run)
  echo "$response"
}

# Function to send a request to the production environment
send_prod_request() {
  local base64_request=$1
  ID_TOKEN=$(gcloud auth print-identity-token)
  response=$(curl -s -X POST -H "Content-Type: text/plain" -H "Authorization: Bearer ${ID_TOKEN}" --data-raw "$base64_request" https://wildflow-r-giuzxofzpa-uc.a.run.app/run)
  echo "$response"
}

# Step 1: Check if request.R exists
if [ ! -f "request.R" ]; then
  echo "Error: request.R does not exist."
  exit 1
fi

# Read request.R file and create a base64 string
base64_request=$(base64 -w 0 request.R)
if [ $? -ne 0 ]; then
  echo "Error: Failed to encode request.R to base64."
  exit 1
fi

# Check if base64_request is empty
if [ -z "$base64_request" ]; then
  echo "Error: base64 encoding resulted in an empty string."
  exit 1
fi

# Step 2: Send POST request to R server
if [ "$1" = "prod" ]; then
  response=$(send_prod_request "$base64_request")
else
  response=$(send_local_request "$base64_request")
fi

if [ $? -ne 0 ]; then
  echo "Error: Curl command failed."
  exit 1
fi

# Check if response is empty
if [ -z "$response" ]; then
  echo "Error: Received an empty response from the server."
  exit 1
fi

# Print raw response
echo "Raw response from server:"
echo "$response"
echo ""

# Step 3: Decode the base64 response
# Check if the response is an error message
if echo "$response" | jq .error > /dev/null 2>&1; then
  # Extract and decode the error message
  error_message=$(echo $response | jq -r '.error[0]' | base64 --decode)
  echo "Error: $error_message"
else
  # Extract base64 string from JSON array and decode
  decoded_response=$(echo $response | jq -r '.[0]' | base64 --decode)
  if [ $? -ne 0 ]; then
    echo "Error: Failed to decode response from base64."
    exit 1
  fi

  echo "Decoded response:"
  echo "$decoded_response"
fi
```
