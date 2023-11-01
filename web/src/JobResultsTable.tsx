import React, { useContext, useState, useEffect } from "react";
import { bigQueryJobResults } from "./api";
import ShowText from "./ShowText";
import DataTableFlat from "./DataTableFlat";

interface JobResultsTableProps {
  jobId: string;
}

const JobResultsTable: React.FC<JobResultsTableProps> = ({ jobId }) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    bigQueryJobResults(jobId).then(setData);
  }, [jobId]);
  if (!data) {
    return <ShowText text="Fetching job results..." />;
  }
  if (
    !(data as any).rows ||
    (data as any).rows === undefined ||
    (data as any).rows.length === 0
  ) {
    return <ShowText text="This query has succeded, but returned now rows." />;
  }
  return <DataTableFlat data={(data as any).rows} />;
};

export default JobResultsTable;
