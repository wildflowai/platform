import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { r } from "codemirror-lang-r";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { ThemeContext } from "./ThemeContext";
import { useContext } from "react";
import { runRCode } from "./api";
import DataTableFlat from "./DataTableFlat";

const _LOCAL_STORAGE_KEY = "wildflow-stored-r-code";
const _DEFAULT_CODE = `
data <- wfread('raw.lewini_presenciaAusencia', 5)

# wfwrite('raw.test_table', data)
print(data)
`;

const QueryR: React.FC = () => {
  const [query, setQuery] = useState(
    localStorage.getItem(_LOCAL_STORAGE_KEY) || _DEFAULT_CODE
  );
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = () => {
    setResults(null);
    setError(null);
    setRunning(true);
    runRCode(query).then((data) => {
      if (Array.isArray(data)) {
        setResults(atob(data[0]));
      } else if (data.error && data.encodedMessage) {
        setError(atob(data.encodedMessage));
      } else {
        setError("Failed parsing response");
      }
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

  const getData = () => {
    if (!results) return [];
    try {
      return JSON.parse(results);
    } catch (e) {
      return [JSON.stringify(results)];
    }
  };

  const data = getData();

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
          extensions={[r()]}
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
      {results && (
        <CodeMirror
          className={`w-full mb-4 ${
            darkMode ? "text-white" : "text-black"
          } text-lg`}
          value={results}
          theme={darkMode ? atomone : "light"}
          extensions={[r()]}
          readOnly={true}
        />
      )}
      {error && (
        <div
          className={`m-4 p-4 rounded ${
            darkMode ? "bg-red-800" : "bg-red-200"
          }`}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default QueryR;
