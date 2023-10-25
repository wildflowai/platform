import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { downloadFile, ingestCsvFromGcsToBigQuery } from "./api";
import ShowText from "./ShowText";
import PreviewAndIngest from "./PreviewAndIngest";
import { set } from "lodash";

const _MAX_PREVIEW_ROWS = 15;

const Ingest: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fullFilePathWithBucket = location.pathname.substring("/ingest/".length);
  const filePath = fullFilePathWithBucket.substring(
    fullFilePathWithBucket.indexOf("/") + 1
  );
  const [data, setData] = useState<(string | null)[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileAndParse = async () => {
      try {
        const { url } = await downloadFile(filePath);
        if (!url) {
          console.error("Failed to get signed URL");
          setError("Failed to get signed URL");
          return;
        }

        Papa.parse(url, {
          download: true,
          dynamicTyping: true,
          preview: _MAX_PREVIEW_ROWS,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error("Error parsing CSV:", results.errors);
              setError("Error parsing CSV");
              return;
            }
            setData(results.data as (string | null)[][]);
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
            setError("Error parsing CSV");
          },
        });
      } catch (error) {
        console.error("Error fetching file:", error);
        setError("Error fetching file");
      }
    };

    fetchFileAndParse();
  }, [filePath]);

  const handleOnIngest = (
    newHeaders: string[],
    hasHeader: boolean,
    newTableName: string
  ) => {
    setStatus("Ingesting the file...");
    ingestCsvFromGcsToBigQuery(filePath, newHeaders, hasHeader, newTableName)
      .then((response) => {
        const newJobId = response.jobID.includes(".")
          ? response.jobID.split(".")[1]
          : response.jobID;
        navigate(`/job/${newJobId}?tableName=${newTableName}`);
      })
      .catch((error: any) => {
        setError(
          `Failed ingesting the file: ${JSON.stringify(error, null, 2)}`
        );
      });
  };

  if (!data) {
    return <ShowText text="Fetching the file to preview..." />;
  }
  if (error) {
    return <ShowText text={`Error: ${error}`} />;
  }
  if (status) {
    <ShowText text={status} />;
  }
  return <PreviewAndIngest data={data} onIngest={handleOnIngest} />;
};

export default Ingest;
