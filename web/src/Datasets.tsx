import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import { TbBrandGoogleBigQuery } from "react-icons/tb";

const apiEndpoint =
  "https://us-central1-wildflow-demo.cloudfunctions.net/listDatasets";

interface Dataset {
  id: string;
  name: string;
  numRows: string;
}

const Datasets: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiEndpoint)
      .then((response) => response.json())
      .then((data) => {
        const sortedData = data.sort(
          (a: Dataset, b: Dataset) => Number(b.numRows) - Number(a.numRows)
        );
        setDatasets(sortedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-full p-4 ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
      }`}
    >
      <h1 className="text-2xl mb-4">
        List of public standardized datasets in Wildflow
      </h1>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-md shadow-md rounded mb-4">
          <tbody>
            <tr className="border-b">
              <th className="text-left p-3 px-5">ID</th>
              <th className="text-left p-3 px-5 w-1/2">Name</th>
              <th className="text-left p-3 px-5">Number of Rows</th>
              <th className="text-left p-3 px-5">BigQuery</th>
            </tr>
            {loading
              ? // Show 3 skeleton rows when loading
                Array.from({ length: 3 }, (_, index) => (
                  <tr
                    key={index}
                    className={`border-b ${
                      darkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <td className="p-3 px-5 bg-gray-300">&nbsp;</td>
                    <td className="p-3 px-5 bg-gray-300">&nbsp;</td>
                    <td className="p-3 px-5 bg-gray-300">&nbsp;</td>
                    <td className="p-3 px-5 bg-gray-300">&nbsp;</td>
                  </tr>
                ))
              : datasets.map((dataset) => (
                  <tr
                    key={dataset.id}
                    className={`border-b ${
                      darkMode
                        ? "hover:bg-gray-600 bg-gray-700"
                        : "hover:bg-orange-100 bg-gray-100"
                    }`}
                  >
                    <td className="p-3 px-5">{dataset.id}</td>
                    <td className="p-3 px-5">{dataset.name}</td>
                    <td className="p-3 px-5">{dataset.numRows}</td>
                    <td className="p-3 px-5">
                      <a
                        href={`https://console.cloud.google.com/bigquery?project=wildflow-demo&ws=!1m5!1m4!4m3!1swildflow-demo!2sclean!3s${dataset.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center"
                      >
                        <TbBrandGoogleBigQuery
                          className="group-hover:text-blue-500"
                          size={24}
                        />
                      </a>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Datasets;
