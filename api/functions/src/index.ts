import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as postgres from "postgres";
import * as dotenv from "dotenv";
import { BigQuery } from "@google-cloud/bigquery";
import * as cors from "cors";
import * as fs from "fs";
import * as path from "path";
import { generateSQLCode } from "./mergeTablesSqlGen";
import * as crypto from "crypto";

dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID, MY_HASH_TOKEN } =
  process.env;

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
    return res.status(200).send(generateSQLCode(projectId, data));
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
