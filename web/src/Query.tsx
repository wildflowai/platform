import React, { useState } from "react";
import { isPelagic } from "./api";
import QueryR from "./QueryR";
import QuerySql from "./QuerySql";
import QueryOld from "./QueryOld";

const Query: React.FC = () => {
  const [mode, setMode] = useState("SQL");
  if (isPelagic()) {
    return (
      <div className="flex flex-col w-full">
        <div className="flex ml-2 mt-2 mb-2 space-x-1">
          <button
            className={`w-20 h-9 text-center ${
              mode === "SQL"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-black"
            } rounded`}
            onClick={() => setMode("SQL")}
          >
            SQL
          </button>
          <button
            className={`w-20 h-9 text-center ${
              mode === "R" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
            } rounded`}
            onClick={() => setMode("R")}
          >
            R
          </button>
        </div>
        {mode === "R" ? <QueryR /> : <QuerySql />}
      </div>
    );
    return <QuerySql />;
  }
  return <QueryOld />;
};

export default Query;
