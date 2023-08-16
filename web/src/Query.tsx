import React, { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { r } from "codemirror-lang-r";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { ThemeContext } from "./ThemeContext";
import { useContext } from "react";

const _MOCK_SQL_CODE = `SELECT
  organism.gbif_id,
  TIMESTAMP_TRUNC(timestamp, WEEK(MONDAY)) AS week_start,
  location.lat,
  location.lon,
  AVG(metadata.individualCount) AS population_count,
FROM \`wildflow-demo.clean.*\`
WHERE timestamp IS NOT NULL
  AND metadata.individualCount IS NOT NULL
  AND organism.gbif_id IN (278557222)
GROUP BY 1, 2, 3, 4
ORDER BY 1, 2, 3, 4
LIMIT 2
`;

const _MOCK_R_CODE = `
  library(bigrquery)
  library(dplyr)
  library(lubridate)

  data <- bq_project_query(project_id, initial_sql_query, billing = billing) %>% 
    bq_table_download()

  result <- data %>% 
    filter(organism.gbif_id %in% c(278557222)) %>%
    mutate(week_start = floor_date(timestamp, "week", week_start = get_week_start("Monday"))) %>% 
    group_by(organism.gbif_id, week_start, location.lat, location.lon) %>% 
    summarize(population_count = mean(metadata.individualCount, na.rm = TRUE)) %>% 
    arrange(organism.gbif_id, week_start, location.lat, location.lon) %>% 
    head(2)

  result
`;

const Query: React.FC = () => {
  interface Result {
    gbif_id: string;
    week_start: string;
    lat: string;
    lon: string;
    population_count: string;
  }

  const mockData = [
    {
      gbif_id: "278557222",
      week_start: "2003-03-28",
      lat: "50.91126",
      lon: "0.967679",
      population_count: "26.5",
    },
    {
      gbif_id: "278557222",
      week_start: "2007-07-15",
      lat: "50.927303",
      lon: "0.96242",
      population_count: "3.0",
    },
  ];

  // const [query, setQuery] = useState(mockCode);
  const [results, setResults] = useState<Result[]>([]);
  const [mode, setMode] = useState("SQL"); // New state for switching between SQL and R

  const executeQuery = () => {
    setResults(mockData);
  };

  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <div
      className={`flex flex-col w-full h-full ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
      }`}
    >
      {/* Switch Tabs */}
      <div className="flex mt-2 space-x-1 mb-2">
        <button
          className={`w-20 h-9 text-center ${
            mode === "SQL" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
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

      <div className="flex flex-col items-end">
        <CodeMirror
          className={`w-full mb-4 ${
            darkMode ? "text-white" : "text-black"
          } text-lg`}
          value={mode === "SQL" ? _MOCK_SQL_CODE : _MOCK_R_CODE}
          theme={darkMode ? atomone : "light"}
          extensions={mode === "SQL" ? [sql()] : [r()]}
          // onChange={(value) => setQuery(value)}
        />

        <button
          className={`${
            darkMode
              ? "bg-blue-700 hover:bg-blue-600"
              : "bg-blue-500 hover:bg-blue-700"
          } text-white font-bold py-2 px-4 rounded`}
          onClick={executeQuery}
        >
          Run Query
        </button>
      </div>

      <div className="w-full mt-6">
        {results.length > 0 && (
          <table
            className={`min-w-full ${darkMode ? "bg-gray-700" : "bg-white"}`}
          >
            <thead>
              <tr>
                {[
                  "gbif_id",
                  "week_start",
                  "lat",
                  "lon",
                  "population_count",
                ].map((header) => (
                  <th
                    className={`text-left py-2 px-4 border-b ${
                      darkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.gbif_id + result.week_start}>
                  <td
                    className={`py-2 px-4 border-b ${
                      darkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    {result.gbif_id}
                  </td>
                  <td
                    className={`py-2 px-4 border-b ${
                      darkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    {result.week_start}
                  </td>
                  <td
                    className={`py-2 px-4 border-b ${
                      darkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    {result.lat}
                  </td>
                  <td
                    className={`py-2 px-4 border-b ${
                      darkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    {result.lon}
                  </td>
                  <td
                    className={`py-2 px-4 border-b ${
                      darkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    {result.population_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Query;
