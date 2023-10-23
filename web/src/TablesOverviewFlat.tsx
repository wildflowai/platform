import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";

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
  const { darkMode } = useContext(ThemeContext);
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
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {data.map((item) => (
              <Link
                to={`/table/${item.datasetId}.${item.id}`}
                className={`h-block md:table-row hover:bg-blue-500 dark:hover:bg-blue-300 ${
                  darkMode ? "text-white" : "text-black"
                }`}
                key={`${item.datasetId}.${item.id}`}
              >
                <td className="block md:table-cell px-2 py-1 h-px leading-none p-0 text-left border md:border-none">
                  {`${item.datasetId}.${item.id}`}
                </td>
                <td className="block md:table-cell px-2 py-1 text-right border md:border-none">
                  {item.size}
                </td>
                <td className="block md:table-cell px-2 py-1 text-right border md:border-none">
                  {item.numRows}
                </td>
              </Link>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablesOverviewFlat;
