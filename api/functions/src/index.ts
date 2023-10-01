import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as postgres from "postgres";
import * as dotenv from "dotenv";
import { BigQuery } from "@google-cloud/bigquery";
import * as cors from "cors";
import * as fs from "fs";
import * as path from "path";

const corsHandler = cors({ origin: true });
const bigquery = new BigQuery();

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

dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;
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
