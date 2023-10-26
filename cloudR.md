I want to create API to run R in the cloud, in particular to access big query.
Here's my artifacts and shell commands I run:

```Dockerfile
FROM rocker/r-ver:4.0.5

RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev

RUN Rscript -e "install.packages(c('bigrquery', 'dplyr', 'plumber'), dependencies=TRUE)"

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

#* @apiTitle R Execution API

#* @post /run
function(req, res) {
  code <- req$postBody
  result <- NULL

  try({
    result <- eval(parse(text = code))
  }, silent = FALSE) # Set silent to FALSE to print errors to the console

  if (is.null(result)) {
    res$status <- 400
    return(list(error = "Failed to execute R code"))
  }

  return(result)
}
```

First these commands:

```sh
$ gcloud config set project
$ docker build -t gcr.io/wildflow-demo/wildflow-r:v2 .

$ gcloud auth configure-docker
$ docker push gcr.io/wildflow-demo/wildflow-r:v2
```

Deployment:

```sh
gcloud run deploy wildflow-r \
  --image gcr.io/wildflow-demo/wildflow-r:v2 \
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
