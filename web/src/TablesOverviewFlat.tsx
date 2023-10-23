import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";
import { FaDownload } from "react-icons/fa";
import { exportTableToCsv } from "./api";
import { useNavigate } from "react-router-dom";
import ShowText from "./ShowText";

type DataSet = {
  datasetId: string;
  id: string;
  name: string;
  numRows: string;
  size: string;
};

type Props = {
  data: DataSet[];
};

const TablesOverviewFlat: React.FC<Props> = ({ data }) => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const [exportingTable, setExportingTable] = React.useState("");

  const handleOnClick = (tableName: string, event: React.MouseEvent) => {
    event.preventDefault();
    setExportingTable(tableName);
    const filePath = tableName + "_" + new Date().toISOString() + ".csv";
    exportTableToCsv(tableName, filePath).then((data) => {
      console.log("data>>>", JSON.stringify(data, null, 2));
      const jobId = data.jobID.replace("wildflow-pelagic:US.", "");
      navigate(`/job/${jobId}?filePath=${filePath}`);
    });
  };

  if (exportingTable !== "") {
    return <ShowText text={`Exporting table ${exportingTable} to CSV...`} />;
  }

  return (
    <div className="flex justify-center p-4 w-full h-full">
      <div className="w-1/2 h-full overflow-y-auto">
        <table className="border-collapse block md:table auto-rows-auto w-full">
          <thead className="block md:table-header-group">
            <tr
              className={`border md:border-none md:table-row ${
                darkMode ? "bg-gray-800" : "bg-gray-300"
              }`}
            >
              <th className="block md:table-cell px-2 py-1 text-left">Name</th>
              <th className="block md:table-cell px-2 py-1 text-right">Size</th>
              <th className="block md:table-cell px-2 py-1 text-right">
                NRows
              </th>
              <th className="block md:table-cell px-2 py-1 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {data.map((item) => (
              <tr
                key={`${item.datasetId}.${item.id}`}
                className={`block md:table-row ${
                  darkMode ? "text-white" : "text-black"
                }`}
              >
                <td className="block md:table-cell px-2 py-1 text-left border md:border-none">
                  <Link
                    to={`/table/${item.datasetId}.${item.id}`}
                    className={`hover:bg-blue-500 dark:hover:bg-blue-300`}
                  >
                    {`${item.datasetId}.${item.id}`}
                  </Link>
                </td>
                <td className="block md:table-cell px-2 py-1 text-right border md:border-none">
                  {item.size}
                </td>
                <td className="block md:table-cell px-2 py-1 text-right border md:border-none">
                  {item.numRows}
                </td>
                <td className="block md:table-cell px-2 py-1 text-right border md:border-none">
                  <button
                    onClick={(e) =>
                      handleOnClick(item.datasetId + "." + item.id, e)
                    }
                  >
                    <FaDownload />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablesOverviewFlat;
