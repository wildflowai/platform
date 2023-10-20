import React, { useEffect, useState, useContext } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { ThemeContext } from "./ThemeContext";
import { mergeTablesMinDistance } from "./api";
import { useNavigate } from "react-router-dom";

interface Props {
  data: any;
  outputTable: string;
}

const MergeTablesConfirmation: React.FC<Props> = ({ data, outputTable }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [generatedSql, setGeneratedSql] = useState<string>(
    "generating pipeline code..."
  );
  const [jobResult, setJobResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    mergeTablesMinDistance(outputTable, data, true).then((data) => {
      setGeneratedSql(data);
    });
  }, []);

  const handleRunQuery = async () => {
    setLoading(true);
    try {
      const result = await mergeTablesMinDistance(outputTable, data, false);
      setJobResult(result);
      setLoading(false);
      if (result.jobID) {
        navigate(`/job/${result.jobID}?tableName=${outputTable}`);
      }
    } catch (err: any) {
      setJobResult({ error: `Failed to start BigQuery job: ${err.message}` });
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col w-full h-full ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
      }`}
    >
      <div className="flex flex-col items-center pr-4">
        <h1 className="text-large mt-4 mb-4">
          This code will be executed to merge the tables:
        </h1>
        <CodeMirror
          className={`w-full mb-4 overflow-y-auto ${
            darkMode ? "text-white" : "text-black"
          } text-lg`}
          style={{ maxHeight: "80vh", maxWidth: "70%" }}
          value={generatedSql}
          theme={darkMode ? atomone : "light"}
          extensions={[sql()]}
          readOnly={true}
        />

        <button
          className={`${
            darkMode
              ? "bg-blue-700 hover:bg-blue-600"
              : "bg-blue-500 hover:bg-blue-700"
          } text-white font-bold py-2 px-4 rounded`}
          onClick={handleRunQuery}
          disabled={loading}
        >
          Merge Tables
        </button>
      </div>
    </div>
  );
};

export default MergeTablesConfirmation;
