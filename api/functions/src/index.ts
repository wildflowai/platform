import * as functions from "firebase-functions";
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
        sqlQuery("populationCountsQuery.sql").replace(
          "__GBIF_IDS__",
          gbifIds.join(",")
        )
      );
      res.status(200).send(rows);
    } catch (error) {
      console.error("Failed to query data:", error);
      res.status(500).send({ error: "Failed to query data from BigQuery." });
    }
  });
});

export const getSpeciesList = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "GET") {
      res.status(405).send({
        error: "Invalid request method. Only GET requests are allowed.",
      });
      return;
    }

    try {
      const [rows] = await bigquery.query(sqlQuery("speciesList.sql"));
      res.status(200).send(rows);
    } catch (error) {
      console.error("Failed to query data:", error);
      res.status(500).send({ error: "Failed to query data from BigQuery." });
    }
  });
});

const sqlQuery = (sqlFileName: string) =>
  fs.readFileSync(path.resolve(__dirname, sqlFileName), "utf8");
