import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as postgres from "postgres";
import * as dotenv from "dotenv";
import * as os from "os";
import { Storage } from "@google-cloud/storage";
import { BigQuery } from "@google-cloud/bigquery";
import * as cors from "cors";
import * as fs from "fs";
import * as path from "path";
import { generateSQLCode } from "./mergeTablesSqlGen";
import * as crypto from "crypto";
import * as stream from "stream";

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

dotenv.config();

const {
  PGHOST,
  PGDATABASE,
  PGUSER,
  PGPASSWORD,
  ENDPOINT_ID,
  MY_HASH_TOKEN,
  MY_GOOGLE_APPLICATION_CREDENTIALS,
} = process.env;

const corsHandler = cors({ origin: true });
const bigquery = new BigQuery();

const bigQueryClients: { [projectId: string]: BigQuery } = {};

function getBigQueryClient(projectId: string): BigQuery {
  if (!bigQueryClients[projectId]) {
    bigQueryClients[projectId] = new BigQuery({ projectId });
  }
  return bigQueryClients[projectId];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Byte";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const checkRequestToken = (req: any): boolean => {
  const token = req.body.token;
  return token && MY_HASH_TOKEN && hashToken(token) === MY_HASH_TOKEN;
};

export const downloadFile = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    // console.log(JSON.stringify(req, null, 2));
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    if (!checkRequestToken(req)) {
      return res.status(401).send("Unauthorized");
    }

    const bucketName = req.body.bucketName;
    const filePath = req.body.filePath;
    const projectId = req.body.projectId;

    if (!filePath || !bucketName || !projectId) {
      return res
        .status(400)
        .send("Bad Request: fileName, bucketName, projectId are required");
    }

    const options = {
      version: "v4" as const,
      action: "read" as const,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    try {
      const storage = new Storage({
        projectId: projectId,
        keyFilename: MY_GOOGLE_APPLICATION_CREDENTIALS,
      });
      const urlResponse = await storage
        .bucket(bucketName)
        .file(filePath)
        .getSignedUrl(options);

      const url = urlResponse[0];

      return res.status(200).json({ url });
    } catch (error) {
      console.error("Error creating signed URL:", error);
      return res.status(500).send("Internal Server Error");
    }
  });
});

export const mergeTablesMinDistance = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send({
        error: "Invalid request method. Only POST requests are allowed.",
      });
      return;
    }
    if (!checkRequestToken(req)) {
      res.status(401).send({
        error: "Invalid token",
      });
      return;
    }
    const projectId = req.body.projectId;
    const data = req.body.payload;
    const newTableName = req.body.newTableName;
    const code = generateSQLCode(projectId, newTableName, data);
    if (req.body.noRunOnlyCode) {
      return res.status(200).send(code);
    }

    const bqClient = getBigQueryClient(projectId);
    try {
      const [job] = await bqClient.createQueryJob({
        query: code,
        location: "US",
      });
      const monitoringUrl =
        `https://console.cloud.google.com/bigquery?project=` +
        `${projectId}&j=bq:${job.id}&page=queryresults`;
      return res.status(200).send({
        message: "Job started",
        jobID: job.id,
        monitoringUrl: monitoringUrl,
      });
    } catch (err: any) {
      return res
        .status(500)
        .send({ error: `Failed to start BigQuery job: ${err.message}` });
    }
  });
});

export const ingestCsvFromGcsToBigQuery = functions.https.onRequest(
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send({
          error: "Invalid request method. Only POST requests are allowed.",
        });
        return;
      }

      if (!checkRequestToken(req)) {
        res.status(401).send({
          error: "Invalid token",
        });
        return;
      }

      const projectId = req.body.projectId;
      const datasetId = req.body.datasetId;
      const tableId = req.body.tableId;
      const headers = req.body.headers;
      const hasHeader = req.body.hasHeader;
      const bucketName = req.body.bucketName;
      const filePath = req.body.filePath;

      const bqClient = getBigQueryClient(projectId);

      const storage = new Storage({
        projectId: projectId,
        keyFilename: MY_GOOGLE_APPLICATION_CREDENTIALS,
      });

      const file = storage.bucket(bucketName).file(filePath);
      const schema = headers.map((header: string) => ({
        name: header,
        type: "STRING",
      }));
      const options = {
        location: "US",
        skipLeadingRows: hasHeader ? 1 : 0,
        schema: {
          fields: schema,
        },
        sourceFormat: "CSV",
        autodetect: false,
      };

      try {
        const [job] = await bqClient
          .dataset(datasetId)
          .table(tableId)
          .load(file, options);

        return res.status(200).send({
          message: "Job started",
          jobID: job.id,
        });
      } catch (err: any) {
        console.error("Error while starting BigQuery job:", err.message || err);
        return res.status(500).send({
          error: `Failed to start BigQuery job: ${err.message || err}`,
        });
      }
    });
  }
);

export const generateUploadUrl = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send({
        error: "Invalid request method. Only POST requests are allowed.",
      });
      return;
    }
    if (!checkRequestToken(req)) {
      return res.status(401).send({ error: "Invalid token" });
    }

    const projectId = req.body.projectId;
    const bucketName = req.body.bucketName;
    const filePath = req.body.filePath;

    const options = {
      version: "v4" as const,
      action: "write" as const,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: "application/octet-stream" as const,
    };

    try {
      const storage = new Storage({
        projectId: projectId,
        keyFilename: MY_GOOGLE_APPLICATION_CREDENTIALS,
      });

      const urlResponse = await storage
        .bucket(bucketName)
        .file(filePath)
        .getSignedUrl(options);
      const url = urlResponse[0];
      return res.status(200).send({ url });
    } catch (err) {
      console.error("Error generating signed URL:", err);
      return res.status(500).send("Internal Server Error");
    }
  });
});

export const loadFileToGcs = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    upload.single("file")(req, res, async (err: any) => {
      if (err instanceof multer.MulterError) {
        return res.status(500).send({ error: err.message });
      } else if (err) {
        return res.status(500).send({ error: err.message });
      }

      // Now req.file is available
      const bucketName = req.body.bucketName;
      const destinationFileName =
        req.body.destinationFileName || "uploaded-file";

      try {
        const storage = new Storage();
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(destinationFileName);

        const bufferStream = new stream.PassThrough();
        bufferStream.end((req as any).files.file[0].buffer);
        const writeStream = file.createWriteStream();
        bufferStream.pipe(writeStream);

        writeStream.on("finish", () => {
          res.status(200).send({
            message: "File successfully uploaded to Google Cloud Storage",
          });
        });
      } catch (err: any) {
        console.error("Error uploading file to Google Cloud Storage:", err);
        return res.status(500).send({
          error: `Failed to upload file to Google Cloud Storage: ${err.message}`,
        });
      }
      return res.status(200).send({ message: "File successfully uploaded" });
    });
  });
});

export const createTableFromCSV = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send({
        error: "Invalid request method. Only POST requests are allowed.",
      });
      return;
    }
    if (!checkRequestToken(req)) {
      return res.status(401).send({ error: "Invalid token" });
    }

    const projectId = req.body.projectId;
    const tableName = req.body.tableName;
    const headers = req.body.headers;
    const rows = req.body.rows;

    const bqClient = getBigQueryClient(projectId);
    const [datasetId, tableId] = tableName.split(".");

    try {
      // Specify the table schema
      const schema = headers.map((header: string) => ({
        name: header,
        type: "STRING",
      }));
      console.log("Schema:", schema);

      // Construct the CSV data
      const csvData = [
        headers.join(","),
        ...rows.map((row: any) => row.join(",")),
      ].join("\n");
      console.log("CSV Data:", csvData);

      // Write CSV data to a temporary file
      const tempFilePath = path.join(
        os.tmpdir(),
        `${tableId}-${Date.now()}.csv`
      );
      fs.writeFileSync(tempFilePath, csvData);

      const metadata = {
        schema: {
          fields: schema,
        },
        skipLeadingRows: 1,
        sourceFormat: "CSV",
        createDisposition: "CREATE_IF_NEEDED",
        writeDisposition: "WRITE_TRUNCATE",
      };

      console.log(
        "Metadata for BigQuery Load Job:",
        JSON.stringify(metadata, null, 2)
      );
      const [job] = await bqClient
        .dataset(datasetId)
        .table(tableId)
        .createLoadJob(tempFilePath, metadata);

      // Delete the temporary file
      fs.unlinkSync(tempFilePath);

      return res.status(200).send({
        message: "Job started",
        jobID: job.id,
      });
    } catch (err: any) {
      console.error("Error creating table and loading data:", err);
      return res.status(500).send({
        error: `Failed to create table and load data: ${err.message}`,
      });
    }
  });
});

export const exportTableToCSV = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send({
        error: "Invalid request method. Only POST requests are allowed.",
      });
      return;
    }

    if (!checkRequestToken(req)) {
      res.status(401).send({
        error: "Invalid token",
      });
      return;
    }

    const projectId = req.body.projectId;
    const tableName = req.body.tableName;
    const bucketName = req.body.bucketName;
    const filePath = req.body.filePath;

    const bqClient = getBigQueryClient(projectId);
    const storage = new Storage(projectId);

    try {
      const [datasetId, tableId] = tableName.split(".");
      const destination = storage.bucket(bucketName).file(filePath);

      const [job] = await bqClient
        .dataset(datasetId)
        .table(tableId)
        .extract(destination, {
          format: "CSV",
        });

      res.status(200).send({
        message: "Export job started",
        jobID: job.id,
      });
    } catch (err: any) {
      console.error("Failed to start export job:", err);
      res
        .status(500)
        .send({ error: `Failed to start export job: ${err.message}` });
    }
  });
});

export const checkJobStatus = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send({
        error: "Invalid request method. Only POST requests are allowed.",
      });
      return;
    }
    if (!checkRequestToken(req)) {
      res.status(401).send({
        error: "Invalid token",
      });
      return;
    }

    const jobId = req.body.jobId;
    const projectId = req.body.projectId;

    if (!jobId || !projectId) {
      return res
        .status(400)
        .send({ error: "Job ID and Project ID are required." });
    }

    const bqClient = getBigQueryClient(projectId);
    const job = bqClient.job(jobId);

    try {
      const [metadata] = await job.getMetadata();
      const status = metadata.status;

      if (status.errorResult) {
        return res.status(500).send({ error: status.errorResult.message });
      }

      const progress = (status.progressRatio || 0) * 100;
      const creationTime = metadata.statistics.creationTime;
      const endTime = metadata.statistics.endTime; // <-- Job finish time

      // Additional interesting info for query jobs
      const totalRows = metadata.statistics.query?.totalRows;
      const totalBytesProcessed =
        metadata.statistics.query?.totalBytesProcessed;
      const cacheHit = metadata.statistics.query?.cacheHit;

      return res.status(200).send({
        status: status.state,
        progress,
        creationTime,
        endTime,
        totalRows,
        totalBytesProcessed,
        cacheHit,
      });
    } catch (err: any) {
      return res.status(500).send({ error: err.message });
    }
  });
});

export const cancelJob = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send({
        error: "Invalid request method. Only POST requests are allowed.",
      });
      return;
    }
    if (!checkRequestToken(req)) {
      res.status(401).send({
        error: "Invalid token",
      });
      return;
    }

    const jobId = req.body.jobId;
    const projectId = req.body.projectId;

    if (!jobId || !projectId) {
      return res
        .status(400)
        .send({ error: "Job ID and Project ID are required." });
    }

    const bqClient = getBigQueryClient(projectId);
    const job = bqClient.job(jobId);

    try {
      await job.cancel();
      const [metadata] = await job.getMetadata();
      const status = metadata.status;

      if (status.state === "DONE" && status.errorResult) {
        return res
          .status(200)
          .send({ message: "Job was cancelled successfully." });
      } else {
        return res.status(400).send({
          error: "Failed to cancel the job or the job had already completed.",
        });
      }
    } catch (err: any) {
      return res.status(500).send({ error: err.message });
    }
  });
});

export const getColumnsForTables = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send({
        error: "Invalid request method. Only POST requests are allowed.",
      });
      return;
    }
    if (!checkRequestToken(req)) {
      res.status(401).send({
        error: "Invalid token",
      });
      return;
    }

    const projectId = req.body.projectId;
    const tables = req.body.tables;

    if (!projectId || !tables || !Array.isArray(tables)) {
      res.status(400).send({
        error: "projectId and tables (as an array) are required.",
      });
      return;
    }

    const bigquery = getBigQueryClient(projectId);

    // Generate UNION ALL clauses for each table
    const unionQueries = tables
      .map((table, tableIndex) => {
        const [datasetId, tableName] = table.split(".");
        return `
        SELECT
          '${datasetId}.${tableName}' as table_ref,
          ${tableIndex} as table_index,
          column_name
        FROM \`${projectId}.${datasetId}.INFORMATION_SCHEMA.COLUMNS\`
        WHERE table_name = '${tableName}'
      `;
      })
      .join(" UNION ALL ");

    try {
      const [rows] = await bigquery.query(unionQueries);

      const groupedData = rows.reduce((acc, row) => {
        if (!acc[row.table_index]) {
          acc[row.table_index] = {
            index: row.table_index,
            table: row.table_ref,
            columns: [],
          };
        }
        acc[row.table_index].columns.push(row.column_name);
        return acc;
      }, {});

      const response = Object.values(groupedData);

      res.status(200).send(response);
    } catch (error) {
      console.error("Failed to get columns:", error);
      res.status(500).send({ error: "Failed to get columns from BigQuery." });
    }
  });
});

export const listDatasetsForProject = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send({
        error: "Invalid request method. Only GET requests are allowed.",
      });
      return;
    }
    if (!checkRequestToken(req)) {
      res.status(401).send({
        error: "Invalid token",
      });
      return;
    }

    const projectId = (req.body.projectId as string) || "default_project_id";

    const bigquery = getBigQueryClient(projectId);

    try {
      const [datasets] = await bigquery.getDatasets();
      const tableInfos: any[] = [];

      for (const dataset of datasets) {
        const [tables] = await dataset.getTables();

        for (const table of tables) {
          const [metadata] = await table.getMetadata();
          tableInfos.push({
            datasetId: metadata.tableReference.datasetId,
            id: table.id,
            name: metadata.tableReference.tableId,
            numRows: metadata.numRows,
            size: formatBytes(metadata.numBytes),
          });
        }
      }

      res.status(200).send(tableInfos);
    } catch (error) {
      console.error("Failed to get tables:", error);
      res.status(500).send({ error: "Failed to get tables from BigQuery." });
    }
  });
});

export const sampleBigQueryTable = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send({
        error: "Invalid request method. Only GET requests are allowed.",
      });
      return;
    }
    if (!checkRequestToken(req)) {
      res.status(401).send({
        error: "Invalid token",
      });
      return;
    }

    const projectId = req.body.projectId as string;
    const datasetId = req.body.datasetId as string;
    const tableId = req.body.tableId as string;

    if (!projectId || !datasetId || !tableId) {
      res.status(400).send({
        error:
          "projectId, datasetId, and tableId query parameters are required.",
      });
      return;
    }

    const bigquery = getBigQueryClient(projectId);

    try {
      const table = bigquery.dataset(datasetId).table(tableId);
      const options: any = {
        autoPaginate: false,
        maxResults: 10,
      };
      const [rows] = await table.getRows(options);
      res.status(200).send(rows);
    } catch (error) {
      console.error("Failed to read table:", error);
      res.status(500).send({ error: "Failed to read table from BigQuery." });
    }
  });
});

export const listDatasets = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "GET") {
      res.status(405).send({
        error: "Invalid request method. Only GET requests are allowed.",
      });
      return;
    }

    try {
      const [tables] = await bigquery.dataset("clean").getTables();
      const tableInfos = await Promise.all(
        tables.map(async (table: any) => {
          const metadata = await table.getMetadata();
          return {
            id: table.id,
            name: metadata[0].tableReference.tableId,
            numRows: metadata[0].numRows,
          };
        })
      );

      res.status(200).send(tableInfos);
    } catch (error) {
      console.error("Failed to get tables:", error);
      res.status(500).send({ error: "Failed to get tables from BigQuery." });
    }
  });
});

export const getPopulationCounts = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "GET") {
      res.status(405).send({
        error: "Invalid request method. Only GET requests are allowed.",
      });
      return;
    }

    const timeGranularity =
      (req.query.timeGranularity as string) || "WEEK(MONDAY)";
    const allowedTimeGranularities = [
      "MINUTE",
      "HOUR",
      "DAY",
      "WEEK(MONDAY)",
      "MONTH",
      "QUARTER",
      "YEAR",
    ];

    if (!allowedTimeGranularities.includes(timeGranularity)) {
      res.status(400).send({
        error: `Invalid time granularity. Allowed values are ${allowedTimeGranularities.join(
          ", "
        )}.`,
      });
      return;
    }

    const gbifIds = req.query.gbifIds
      ? Array.isArray(req.query.gbifIds)
        ? req.query.gbifIds.map(Number)
        : [Number(req.query.gbifIds)]
      : [278557222];

    if (!gbifIds.every(Number.isInteger)) {
      res.status(400).send({
        error: "Invalid GBIF IDs. GBIF IDs should be integers.",
      });
      return;
    }

    try {
      const [rows] = await bigquery.query(
        sqlQuery("populationCountsQuery.sql")
          .replace("__GBIF_IDS__", gbifIds.join(","))
          .replace("__TIME_GRANULARITY__", timeGranularity)
      );
      res.status(200).send(rows);
    } catch (error) {
      console.error("Failed to query data:", error);
      res.status(500).send({ error: "Failed to query data from BigQuery." });
    }
  });
});

let speciesCache: Array<any> | null = null;

export const getSpeciesList = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "GET") {
      res.status(405).send({
        error: "Invalid request method. Only GET requests are allowed.",
      });
      return;
    }

    try {
      if (!speciesCache) {
        const [rows] = await bigquery.query(sqlQuery("speciesList.sql"));
        speciesCache = rows;
      }

      const sliceLimit = 5;
      var result = {
        total: speciesCache.length,
        species: speciesCache.slice(0, sliceLimit),
      };

      const searchTerm = req.query.searchTerm;
      if (searchTerm && typeof searchTerm === "string") {
        const matching = speciesCache.filter(
          (row) =>
            row.gbif_id.toString().includes(searchTerm) ||
            row.verbatim_scientific_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        );
        result = {
          total: matching.length,
          species: matching.slice(0, sliceLimit),
        };
      }

      res.status(200).send(result);
    } catch (error) {
      console.error("Failed to query data:", error);
      res.status(500).send({ error: "Failed to query data from BigQuery." });
    }
  });
});

// Setup cors to restrict domains that can access the function
const audienceSubscriberCorsHandler = cors({
  origin: [
    // "http://localhost:3000",
    "https://www.wildflow.ai",
    "https://wildflow.ai",
  ],
});

const URL = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?options=project%3D${ENDPOINT_ID}`;

const sql = postgres(URL, { ssl: "require" });

admin.initializeApp();

export const addAudienceSubscriber = functions.https.onRequest(
  async (request, response) => {
    return audienceSubscriberCorsHandler(request, response, async () => {
      try {
        const { name, email } = request.body;
        const emailRegex = /^[\w-.+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const nameRegex = /^[\p{L} \-]+$/u;

        if (
          !name ||
          !email ||
          !emailRegex.test(email) ||
          !nameRegex.test(name)
        ) {
          response.status(400).send("Failed to subscribe");
          return;
        }

        await sql`
                  INSERT INTO audience (name, email) VALUES (${name}, ${email})
                  ON CONFLICT (email) DO NOTHING
              `;

        response.status(200).send("Thank you for subscribing!");
      } catch (error) {
        console.error("Error writing to PostgreSQL", error);
        response.status(500).send("Failed to subscribe");
      }
    });
  }
);

const sqlQuery = (sqlFileName: string) =>
  fs.readFileSync(path.resolve(__dirname, sqlFileName), "utf8");
