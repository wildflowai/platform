import React, { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { ThemeContext } from "./ThemeContext";
import { useContext } from "react";
import { mergeTablesMinDistance } from "./api";

interface Props {
  data: any;
}

const MergeTablesConfirmation: React.FC<Props> = ({ data }) => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [generatedSql, setGeneratedSql] = useState<string>(
    "generating pipeline code..."
  );

  useEffect(() => {
    mergeTablesMinDistance(data, true).then((data) => {
      setGeneratedSql(data);
    });
  }, []);

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
          value={generatedSql}
          theme={darkMode ? atomone : "light"}
          extensions={[sql()]}
        />

        <button
          className={`${
            darkMode
              ? "bg-blue-700 hover:bg-blue-600"
              : "bg-blue-500 hover:bg-blue-700"
          } text-white font-bold py-2 px-4 rounded`}
          onClick={() => {}}
        >
          Run Query
        </button>
      </div>
    </div>
  );
};

export default MergeTablesConfirmation;
