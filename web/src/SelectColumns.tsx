import React, { useState, useEffect, useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import MergeTablesConfirmation from "./MergeTablesConfirmation";
import { getColumnsForTables } from "./api";
import DataTable from "./DataTable";

type ColumnType = {
  name: string;
  newName: string;
  type: string;
  selected: boolean;
};

type TableKey = `${string}|${number}`;
type DataStructure = Record<TableKey, ColumnType[]>;

type Props = {
  tables: string[];
  returnCallBack: () => void;
};

const SelectColumns: React.FC<Props> = ({ tables, returnCallBack }) => {
  const { darkMode } = useContext(ThemeContext);

  const [tableData, setTableData] = useState<
    { index: number; table: string; columns: string[] }[]
  >([]);
  const [data, setData] = useState<Record<string, any[]>>({});
  const [finalConfirmation, setFinalConfirmation] = useState<boolean>(false);
  const [inspectingTable, setInspectingTable] = useState<string>("");
  const [outputTable, setOutputTable] = useState("raw.results");

  useEffect(() => {
    getColumnsForTables(tables).then((data) => {
      setTableData(data);
      const initialState: Record<string, any[]> = {};
      data.forEach((tableInfo: any) => {
        const tableKey: TableKey = `${tableInfo.table}|${tableInfo.index}`;
        initialState[tableKey] = tableInfo.columns.map((column: any) => {
          let type = "";
          if (["date", "timestamp", "time"].includes(column.toLowerCase()))
            type = "date";
          else if (["latitude", "lat"].includes(column.toLowerCase()))
            type = "latitude";
          else if (["longitude", "lon", "lng"].includes(column.toLowerCase()))
            type = "longitude";

          return {
            name: column,
            newName: column,
            type: type,
            selected: true,
          };
        });
      });
      setData(initialState);
    });
  }, []);

  const isValidOutputTable = (name: string) => {
    const parts = name.split(".");
    if (parts.length !== 2) return false;

    const regex = /^[a-z_][a-z\d_]*$/;
    return parts.every((part) => regex.test(part));
  };

  const handleInputChange = (
    table: TableKey,
    index: number,
    key: keyof ColumnType,
    value: any
  ) => {
    const updatedData = { ...data };
    updatedData[table][index][key] = value;
    setData(updatedData);
  };

  const toggleAllSelections = (table: TableKey, value: boolean) => {
    const updatedData = { ...data };
    updatedData[table] = updatedData[table].map((col) => ({
      ...col,
      selected: value,
    }));
    setData(updatedData);
  };

  const getRowColor = (columnSelected: boolean, columnType: string) => {
    if (!columnSelected) {
      return "";
    }
    if (columnType === "latitude") {
      return darkMode ? "bg-green-700" : "bg-green-200";
    }
    if (columnType === "longitude") {
      return darkMode ? "bg-orange-700" : "bg-orange-200";
    }
    if (columnType === "date") {
      return darkMode ? "bg-indigo-700" : "bg-indigo-200";
    }
    return "";
  };

  const getDuplicates = (): Set<string> => {
    const names = Object.values(data)
      .flat()
      .filter((col) => col.selected)
      .map((col) => col.newName.toLowerCase());
    return new Set(
      names.filter((name, idx) => names.lastIndexOf(name) !== idx)
    );
  };

  const duplicates = getDuplicates();

  const generateWarningText = (
    data: DataStructure,
    duplicates: Set<string>
  ): string => {
    for (const tableKey in data) {
      const tableName = tableKey.split("|")[0];
      const selectedColumns = data[tableKey as TableKey].filter(
        (col: any) => col.selected
      );
      const lat = selectedColumns.filter((col: any) => col.type === "latitude");
      const lon = selectedColumns.filter(
        (col: any) => col.type === "longitude"
      );
      const date = selectedColumns.filter((col: any) => col.type === "date");

      if (lat.length !== 1) {
        return `Table ${tableName} must have exactly one latitude column selected.`;
      }
      if (lon.length !== 1) {
        return `Table ${tableName} must have exactly one longitude column selected.`;
      }
      if (date.length !== 1) {
        return `Table ${tableName} must have exactly one date column selected.`;
      }
      if (!isValidOutputTable(outputTable)) {
        return (
          `Output table name must have one dot and each ` +
          `part must start with a letter or an underscore.`
        );
      }
    }
    if (duplicates.size) {
      return `Duplicate column names: ${Array.from(duplicates).join(", ")}`;
    }
    return "";
  };

  if (Object.keys(data).length === 0) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        Fetching columns for selected tables...
      </div>
    );
  }

  const warningText = generateWarningText(data, duplicates);

  if (finalConfirmation) {
    return <MergeTablesConfirmation data={data} />;
  }

  if (inspectingTable !== "") {
    return (
      <DataTable
        tableName={inspectingTable}
        onReturnBack={() => setInspectingTable("")}
      />
    );
  }

  return (
    <div className={`${darkMode ? "text-white" : "text-gray-800"} mt-4`}>
      <button
        className="bg-blue-500 rounded mb-4 px-8 p-2 absolute top-4 left-24"
        onClick={returnCallBack}
      >
        Back
      </button>
      {warningText === "" && (
        <button
          className={`${
            darkMode ? "bg-blue-500" : "bg-blue-300"
          } rounded mb-4 px-8 p-2 absolute top-4 right-8`}
          onClick={() => setFinalConfirmation(true)}
        >
          Next
        </button>
      )}
      {warningText !== "" ? (
        <div
          className={`${
            darkMode ? "bg-red-800" : "bg-red-200"
          } mb-4 p-2 text-center rounded-lg`}
        >
          {warningText}
        </div>
      ) : (
        <div className="mb-4 p-2 rounded-lg text-center">
          Please select all necessary columns and press Next.
        </div>
      )}

      <div className="mb-4 p-2 rounded-lg flex flex-row items-center">
        <label className="block text-sm font-medium">Output table:</label>
        <input
          type="text"
          value={outputTable}
          onChange={(e) => {
            const value = e.target.value.toLowerCase();
            setOutputTable(value);
          }}
          className={`${
            isValidOutputTable(outputTable)
              ? ""
              : darkMode
              ? "bg-red-800"
              : "bg-red-200"
          } px-4 py-2 rounded border border-gray-300 text-gray-800 ml-2 w-1/2`}
          placeholder="raw.results"
        />
      </div>

      <table className="w-full max-w-3xl text-sm table-fixed mx-auto">
        <thead>
          <tr>
            <th className="py-0.5 px-2 w-1/4">Column</th>
            <th className="py-0.5 px-2 w-2/5">New Name</th>
            <th className="py-0.5 px-2 w-1/6">Type</th>
            <th className="py-0.5 px-4 w-1/8">Select</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((tableInfo, tableIndex) => {
            const tableKey: TableKey = `${tableInfo.table}|${tableIndex}`;
            return (
              <React.Fragment key={tableKey}>
                <tr>
                  <td
                    colSpan={3}
                    className={`py-1 text-left font-bold ${
                      tableIndex ? "pt-8" : ""
                    } ${darkMode ? "text-blue-300" : "text-blue-600"}`}
                  >
                    <button
                      onClick={() => setInspectingTable(tableInfo.table)}
                      className="underline"
                    >
                      {tableInfo.table}
                    </button>
                  </td>
                  <td
                    className={`py-1 flex justify-center ${
                      tableIndex ? "pt-8" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      onChange={(e) =>
                        toggleAllSelections(tableKey, e.target.checked)
                      }
                      style={{ transform: "scale(1.5)", cursor: "pointer" }}
                    />
                  </td>
                </tr>
                {data[tableKey].map((column, index) => (
                  <tr
                    key={`${tableInfo.table}-${column.name}-${index}`}
                    className={`${column.selected ? "" : "text-gray-400"} ${
                      darkMode ? "hover:bg-blue-700" : "hover:bg-blue-200"
                    } ${getRowColor(column.selected, column.type)}`}
                  >
                    <td className="py-0 px-2">{column.name}</td>
                    <td className="py-0 px-2">
                      {column.selected ? (
                        <input
                          type="text"
                          value={column.newName.toLowerCase()}
                          onChange={(e) =>
                            handleInputChange(
                              tableKey,
                              index,
                              "newName",
                              e.target.value.toLowerCase()
                            )
                          }
                          className={`bg-transparent border rounded w-full py-0 px-1`}
                          style={
                            duplicates.has(column.newName.toLowerCase())
                              ? {
                                  backgroundColor: darkMode
                                    ? "#f56565"
                                    : "#fed7d7",
                                }
                              : {}
                          }
                        />
                      ) : null}
                    </td>
                    <td className="py-0 px-2">
                      {column.selected ? (
                        <select
                          value={column.type}
                          onChange={(e) =>
                            handleInputChange(
                              tableKey,
                              index,
                              "type",
                              e.target.value
                            )
                          }
                          className="bg-transparent border rounded w-full py-0 px-1"
                        >
                          <option value="">-</option>
                          <option value="date">Date</option>
                          <option value="latitude">Latitude</option>
                          <option value="longitude">Longitude</option>
                        </select>
                      ) : null}
                    </td>
                    <td className="py-0 flex items-center justify-center px-4">
                      <input
                        type="checkbox"
                        checked={column.selected}
                        onChange={(e) =>
                          handleInputChange(
                            tableKey,
                            index,
                            "selected",
                            e.target.checked
                          )
                        }
                        style={{ transform: "scale(1.5)", cursor: "pointer" }}
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SelectColumns;
