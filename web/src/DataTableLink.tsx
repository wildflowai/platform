import React, { useState, useEffect } from "react";
import { getColumnsForTable } from "./api";
import DataTableFlat from "./DataTableFlat";
import { useParams } from "react-router-dom";
import { projectId } from "./api";
import ShowText from "./ShowText";
import { exportTableToCsv } from "./api";
import { useNavigate } from "react-router-dom";

const DataTableLink: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const { tableName } = useParams<{ tableName: string }>();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [downloadButtonName, setDownloadButtonName] =
    useState<string>("Download as CSV");

  useEffect(() => {
    if (tableName !== undefined) {
      const [datasetId, tableId] = tableName.split(".");
      getColumnsForTable(datasetId, tableId).then((myData) => {
        if (myData.success) {
          setData(myData.data);
        } else {
          setErrorMessage(myData.message);
        }
      });
    }
  }, []);

  if (tableName === undefined) {
    return <ShowText text="Table name is not defined..." />;
  }
  if (errorMessage !== "") {
    return <ShowText text={`Failed fetching the table: ${errorMessage}`} />;
  }
  if (data.length === 0) {
    return <ShowText text="Loading the table data..." />;
  }

  const bigQueryLink =
    `https://console.cloud.google.com/bigquery?project=` +
    `${projectId()}&ws=!1m5!1m4!4m3!1s${projectId()}!2s${
      tableName.split(".")[0]
    }!3s${tableName.split(".")[1]}`;

  const handleOnClick = () => {
    setDownloadButtonName("Exporting to CSV...");
    const filePath = tableName + "_" + new Date().toISOString() + ".csv";
    console.log("asking:: ", tableName, filePath);
    exportTableToCsv(tableName, filePath).then((data) => {
      console.log("data>>>", JSON.stringify(data, null, 2));
      const jobId = data.jobID.replace("wildflow-pelagic:US.", "");
      navigate(`/job/${jobId}?filePath=${filePath}`);
    });
  };

  return (
    <>
      <div className="flex flex-row justify-center absolute top-4 right-10">
        <a href={bigQueryLink} target="_blank" rel="noopener noreferrer">
          <button className="bg-blue-500 rounded mb-4 px-3 p-2">
            Open in BigQuery
          </button>
        </a>
        <button
          className="bg-blue-500 rounded ml-4 mb-4 px-3 p-2"
          onClick={handleOnClick}
        >
          {downloadButtonName}
        </button>
      </div>
      <DataTableFlat data={data} />
    </>
  );
};

export default DataTableLink;
