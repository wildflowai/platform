import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { ThemeContext } from "./ThemeContext";
import { useContext } from "react";
import { runBigQuerySqlCode } from "./api";
import { useNavigate } from "react-router-dom";
import JobResults from "./JobResults";

const _LOCAL_STORAGE_KEY = "wildflow-stored-sql-code";
const _DEFAULT_CODE = `
select *
from \`env.chlorophyll\`
limit 10
`;

const QuerySql: React.FC = () => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(
    localStorage.getItem(_LOCAL_STORAGE_KEY) || _DEFAULT_CODE
  );
  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = () => {
    setResults(null);
    setError(null);
    setRunning(true);
    runBigQuerySqlCode(query).then((data) => {
      setJobId(data.jobID);
      setRunning(false);
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        executeQuery();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <div
      className={`flex flex-col w-full h-full ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
      }`}
    >
      <div className="flex flex-col items-end pr-4">
        <CodeMirror
          className={`w-full mb-4 ${
            darkMode ? "text-white" : "text-black"
          } text-lg`}
          value={query}
          theme={darkMode ? atomone : "light"}
          extensions={[sql()]}
          onChange={(value) => {
            setQuery(value);
            localStorage.setItem(_LOCAL_STORAGE_KEY, value);
          }}
        />

        <button
          className={`${
            darkMode
              ? "bg-blue-700 hover:bg-blue-600"
              : "bg-blue-500 hover:bg-blue-700"
          } text-white font-bold py-2 px-4 rounded`}
          onClick={executeQuery}
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>
      {jobId && <JobResults jobId={jobId} />}
    </div>
  );
};

export default QuerySql;
