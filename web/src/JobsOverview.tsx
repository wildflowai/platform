import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";
import { FaTrash, FaEye } from "react-icons/fa";
import { getJobsList, cancelJob } from "./api";
import ShowText from "./ShowText";

type Job = {
  jobId: string;
  status: string;
  creationTime: string;
  endTime: string;
};

const JobsOverview: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [maxResults, setMaxResults] = useState("20");

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getJobsList(parseInt(maxResults));
        if (data && data.jobs) {
          setJobs(data.jobs);
        } else {
          setError("Failed to load jobs");
        }
      } catch (error) {
        setError("Failed to load jobs");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [maxResults]);

  const handleNavigate = (jobId: string) => {
    navigate(`/job/${jobId}`);
  };

  const handleCancelJob = async (jobId: string) => {
    cancelJob(jobId);
  };

  if (loading) {
    <ShowText text="Loading jobs..." />;
  }

  return (
    <div className="flex justify-center p-4 w-full h-full">
      <div className="w-3/4 h-full overflow-y-auto">
        <div className="mb-4">
          <label htmlFor="maxResults" className="mr-2">
            Max Results:
          </label>
          <input
            type="number"
            id="maxResults"
            value={maxResults}
            min="1"
            className="text-black"
            onChange={(e) => setMaxResults(e.target.value)}
          />
        </div>
        <table className="min-w-full border-collapse block md:table">
          <thead className="block md:table-header-group">
            <tr
              className={`border md:border-none md:table-row ${
                darkMode ? "bg-gray-800" : "bg-gray-300"
              }`}
            >
              <th className="block md:table-cell px-2 py-1 text-left">
                Job ID
              </th>
              <th className="block md:table-cell px-2 py-1 text-left">
                Status
              </th>
              <th className="block md:table-cell px-2 py-1 text-left">
                Creation Time
              </th>
              <th className="block md:table-cell px-2 py-1 text-left">
                End Time
              </th>
              <th className="block md:table-cell px-2 py-1 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {jobs.map((job) => (
              <tr
                key={job.jobId}
                className={`block md:table-row ${
                  darkMode ? "text-white" : "text-black"
                } hover:bg-blue-500 dark:hover:bg-blue-300`}
              >
                <td className="block md:table-cell px-2 py-1 text-left border md:border-none">
                  {job.jobId}
                </td>
                <td className="block md:table-cell px-2 py-1 text-left border md:border-none">
                  {job.status}
                </td>
                <td className="block md:table-cell px-2 py-1 text-left border md:border-none">
                  {new Date(parseInt(job.creationTime)).toLocaleString()}
                </td>
                <td className="block md:table-cell px-2 py-1 text-left border md:border-none">
                  {job.endTime
                    ? new Date(parseInt(job.endTime)).toLocaleString()
                    : "N/A"}
                </td>
                <td className="block md:table-cell px-2 py-1 text-right border md:border-none">
                  <button
                    onClick={() => handleNavigate(job.jobId)}
                    className="mx-1"
                  >
                    <FaEye />
                  </button>
                  {job.status === "RUNNING" && (
                    <button
                      onClick={() => handleCancelJob(job.jobId)}
                      className="mx-1"
                    >
                      <FaTrash />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobsOverview;
