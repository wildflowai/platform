import React, { useState, useEffect } from "react";
import { getAllTablesForProject, getColumnsForTable } from "./api";
import SelectTable from "./SelectTables";
import SelectColumns from "./SelectColumns";
import ShowText from "./ShowText";

export interface TableInfo {
  datasetId: string;
  id: string;
  name: string;
  numRows: string;
  size: string;
}

interface TableSample {
  [tableName: string]: any[];
}

const MergeTables: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTables, setSelectedTables] = useState<TableInfo[]>([]);
  const [nextStep, setNextStep] = useState(false);

  const token = localStorage.getItem("wildflow-invite-token");
  const projectId = localStorage.getItem("wildflow-project-id");

  useEffect(() => {
    const fetchTables = async () => {
      const tablesData = await getAllTablesForProject();
      setTables(tablesData);
    };
    if (token) {
      fetchTables();
    }
  }, []);

  const handleSelect = (newTables: TableInfo[]) => {
    setSelectedTables(newTables);
  };

  const requestTables: string[] = selectedTables.map(
    (table) => table.datasetId + "." + table.id
  );

  if (!token) {
    return (
      <ShowText
        text="This feature under development. Please specify your auth token to view
      this page."
      />
    );
  }

  if (!projectId) {
    return (
      <ShowText text="This feature under development. The projectId is missing." />
    );
  }

  if (!tables.length) {
    return <ShowText text="Fetching a list of tables..." />;
  }

  if (nextStep) {
    return (
      <div className="flex flex-col w-full items-center">
        <SelectColumns
          tables={requestTables}
          returnCallBack={() => setNextStep(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-center justify-center">
      <SelectTable
        tables={tables}
        handleSelect={handleSelect}
        selectedTables={selectedTables}
      />
      <button
        onClick={() => {
          if (selectedTables.length) {
            setNextStep(true);
          }
        }}
        className={`${
          selectedTables.length
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-gray-400"
        } mt-4 px-6 py-2 rounded  text-white  transition duration-200`}
      >
        Next
      </button>
    </div>
  );
};

export default MergeTables;
