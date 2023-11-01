import React, { useContext, useState, useEffect } from "react";
import JobStatus from "./JobStatus";
import JobResultsTable from "./JobResultsTable";

interface JobResultsProps {
  jobId: string;
  tableName?: string;
  filePath?: string;
}

const JobResults: React.FC<JobResultsProps> = ({
  jobId,
  tableName,
  filePath,
}) => {
  console.log("JobResults", { jobId, tableName, filePath });
  const [jobSucceeded, setJobSucceeded] = useState<boolean>(false);
  if (jobSucceeded) {
    return <JobResultsTable jobId={jobId} />;
  }
  return (
    <JobStatus
      jobId={jobId}
      tableName={tableName}
      filePath={filePath}
      onSuccess={() => setJobSucceeded(true)}
    />
  );
};

export default JobResults;
