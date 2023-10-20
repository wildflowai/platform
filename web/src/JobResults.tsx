import React, { useContext, useState, useEffect } from "react";
import { ThemeContext } from "./ThemeContext";
import { checkJobStatus, cancelJob } from "./api";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import ShowText from "./ShowText";

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = parseInt(
    Math.floor(Math.log(bytes) / Math.log(1024)).toString(),
    10
  );
  const roundedValue = (bytes / Math.pow(1024, i)).toFixed(2);
  return roundedValue + " " + sizes[i];
};

const formatDuration = (milliseconds: number): string => {
  if (milliseconds === 0) return "0 sec";

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const formattedHours = hours > 0 ? `${hours} h${hours !== 1 ? "s" : ""}` : "";
  const formattedMinutes =
    minutes % 60 > 0
      ? `${minutes % 60} min${minutes % 60 !== 1 ? "s" : ""}`
      : "";
  const formattedSeconds =
    seconds % 60 > 0
      ? `${seconds % 60} sec${seconds % 60 !== 1 ? "s" : ""}`
      : "";

  return [formattedHours, formattedMinutes, formattedSeconds]
    .filter(Boolean)
    .join(", ");
};

const progressPercentageToShow = (jobDetails: any) => {
  const elapsedMilliseconds = Date.now() - jobDetails.creationTime;
  var myValue = (elapsedMilliseconds / 60000) * 90;
  if (elapsedMilliseconds >= 60000) myValue = 90;
  return Math.max(jobDetails.progress || 0, myValue).toFixed(2);
};

const JobResults: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tableName = urlParams.get("tableName");
  const { darkMode } = useContext(ThemeContext);
  const [pressedStop, setPressedStop] = useState<boolean>(false);
  const [jobDetails, setJobDetails] = useState({
    error: null,
    status: "NO_DATA",
    progress: 0,
    creationTime: null,
    endTime: null,
    totalBytesProcessed: null,
    cacheHit: false,
  });
  const { jobId } = useParams<{ jobId: string }>();

  const getElapsedTime = () => {
    if (!jobDetails.creationTime) return "N/A";
    const endTime = jobDetails.endTime || Date.now();
    return formatDuration(endTime - jobDetails.creationTime);
  };

  const getTimeSinceCompletion = () => {
    if (!jobDetails.endTime) return "N/A";
    return formatDuration(Date.now() - jobDetails.endTime);
  };

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      console.log("checking job status...");
      const jobStatus = await checkJobStatus(jobId);

      setJobDetails(jobStatus);

      if (jobStatus.status === "DONE") {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [jobId]);

  const elapsedSeconds = jobDetails.creationTime
    ? Math.floor((Date.now() - jobDetails.creationTime) / 1000)
    : 0;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSeconds = elapsedSeconds % 60;

  const handleStopJob = () => {
    if (jobId) {
      cancelJob(jobId);
      setPressedStop(true);
    }
  };

  if (jobDetails.status === "NO_DATA") {
    return <ShowText text="Fetching the job info..." />;
  }

  const tableLink = `/table/${tableName}`;

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
      {jobDetails.error && (
        <h1 className={`text-xl ${darkMode ? "text-red-500" : "text-red-600"}`}>
          Error: {jobDetails.error}
        </h1>
      )}
      {!jobDetails.error && jobDetails.status !== "DONE" && (
        <>
          <h1 className="text-xl text-orange-500 font-bold">
            job status: {jobDetails.status}
          </h1>
          <div className="relative bg-gray-300 w-64 h-4 rounded-md shadow">
            <div
              className="absolute left-0 top-0 bg-blue-500 rounded-md h-full"
              style={{ width: `${progressPercentageToShow(jobDetails)}%` }}
            ></div>
          </div>
          <p className="text-sm">
            Progress: {progressPercentageToShow(jobDetails)}%
          </p>
          <p className="text-sm">Elapsed: {getElapsedTime()}</p>
          <button
            onClick={handleStopJob}
            className="bg-red-500 text-white py-1 px-4 rounded hover:bg-red-600 active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {pressedStop ? "Please wait..." : "Stop the job"}
          </button>
        </>
      )}

      {!jobDetails.error && jobDetails.status === "DONE" && (
        <div className="flex space-y-4 items-center flex-col">
          <h1 className="text-xl text-green-500 font-bold">DONE!</h1>
          <p className="text-sm">
            Processed: {formatBytes(Number(jobDetails.totalBytesProcessed))}
          </p>
          <p className="text-sm">
            Elapsed: {getElapsedTime()}, finished: {getTimeSinceCompletion()}{" "}
            ago
          </p>
          {tableName && (
            <Link
              to={tableLink}
              className={`${
                darkMode ? "text-blue-300" : "text-blue-500"
              } underline font-bold`}
            >
              {tableName}
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default JobResults;
