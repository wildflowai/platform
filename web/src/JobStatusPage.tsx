import React, { useContext, useState, useEffect } from "react";
import { ThemeContext } from "./ThemeContext";
import { checkJobStatus, cancelJob } from "./api";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import ShowText from "./ShowText";
import { bucketId } from "./api";
import DownloadFile from "./DownloadFile";
import JobStatus from "./JobStatus";

const JobStatusPage: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tableName = urlParams.get("tableName") || undefined;
  const filePath = urlParams.get("filePath") || undefined;
  const { jobId } = useParams<{ jobId: string }>();

  if (!jobId || jobId === undefined) {
    return <ShowText text="No job ID provided" />;
  }

  return <JobStatus jobId={jobId} tableName={tableName} filePath={filePath} />;
};

export default JobStatusPage;
