import React, { useState, useEffect } from "react";
import { getColumnsForTable } from "./api";
import DataTableFlat from "./DataTableFlat";
import { useParams } from "react-router-dom";
import { projectId } from "./api";
import ShowText from "./ShowText";

const DataTableLink: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const { tableName } = useParams<{ tableName: string }>();

  useEffect(() => {
    if (tableName !== undefined) {
      const [datasetId, tableId] = tableName.split(".");
      getColumnsForTable(datasetId, tableId).then((myData) => setData(myData));
    }
  }, []);

  if (tableName === undefined) {
    return <ShowText text="Table name is not defined..." />;
  }
  if (data.length === 0) {
    return <ShowText text="Loading the table data..." />;
  }

  const bigQueryLink =
    `https://console.cloud.google.com/bigquery?project=` +
    `${projectId()}&ws=!1m5!1m4!4m3!1s${projectId()}!2s${
      tableName.split(".")[0]
    }!3s${tableName.split(".")[1]}`;

  return (
    <>
      <a href={bigQueryLink} target="_blank" rel="noopener noreferrer">
        <button className="bg-blue-500 rounded mb-4 px-2 p-2 absolute top-4 right-24">
          Open in BigQuery
        </button>
      </a>
      <DataTableFlat data={data} />
    </>
  );
};

export default DataTableLink;
