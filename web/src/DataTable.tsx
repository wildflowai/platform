import React, { useState, useEffect } from "react";
import { getColumnsForTable } from "./api";
import DataTableFlat from "./DataTableFlat";

interface Props {
  tableName: string;
  onReturnBack: () => void;
}

const DataTable: React.FC<Props> = ({ tableName, onReturnBack }) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const [datasetId, tableId] = tableName.split(".");
    getColumnsForTable(datasetId, tableId).then((myData) => setData(myData));
  }, []);

  if (data.length === 0) {
    return <div>Loading the data</div>;
  }

  return (
    <>
      <button
        className="bg-blue-500 rounded mb-4 px-8 p-2 absolute top-4 left-24"
        onClick={onReturnBack}
      >
        Back
      </button>
      <DataTableFlat data={data} />
    </>
  );
};

export default DataTable;
