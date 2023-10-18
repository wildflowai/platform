import React, { useContext, useMemo } from "react";
import { useTable, useResizeColumns } from "react-table";
import { ThemeContext } from "./ThemeContext";

type Props = {
  data: Record<string, any>[];
};

const DataTableFlat: React.FC<Props> = ({ data }) => {
  const { darkMode } = useContext(ThemeContext);

  const columns: any[] = useMemo(() => {
    const sample = data[0];
    return Object.keys(sample).map((key) => {
      let style = {};
      if (key.toLowerCase() === "timestamp") {
        style = { backgroundColor: "blue" };
      }
      if (
        key.toLowerCase() === "latitude" ||
        key.toLowerCase() === "longitude"
      ) {
        style = { backgroundColor: "green" };
      }
      return {
        Header: key,
        accessor: (row: any) => {
          if (
            key.toLowerCase() === "timestamp" &&
            typeof row[key] === "object"
          ) {
            return row[key].value;
          }
          return row[key];
        },
        style: style,
      };
    });
  }, [data]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data }, useResizeColumns);

  const colours: Record<string, string> = {
    blue: darkMode ? "bg-blue-900" : "bg-blue-200",
    green: darkMode ? "bg-green-900" : "bg-green-200",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-full p-4 ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
      }`}
    >
      <div className="w-full overflow-x-auto">
        <table
          {...getTableProps()}
          className="w-full text-md shadow-md rounded mb-4"
        >
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(
                  (
                    column: any // Explicitly use 'any' type here
                  ) => (
                    <th
                      {...column.getHeaderProps()}
                      className={`p-3 px-5 border-r ${
                        colours[column.style.backgroundColor]
                      }`}
                    >
                      {column.render("Header")}
                    </th>
                  )
                )}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell: any) => (
                    <td
                      {...cell.getCellProps()}
                      className={`p-3 px-5 border-r whitespace-nowrap overflow-hidden truncate ${
                        colours[cell.column.style.backgroundColor]
                      }`}
                    >
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTableFlat;
