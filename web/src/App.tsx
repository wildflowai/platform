import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Explorer from "./Explorer";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Files from "./Files";
import Datasets from "./Datasets";
import Auth from "./Auth";
import MergeTables from "./MergeTables";
import Workflows from "./Workflows";
import Query from "./Query";
import Settings from "./Settings";
import { ThemeContext } from "./ThemeContext";
import { SelectedPageContext } from "./SelectedPageContext";
import { OrganismProvider } from "./OrganismProvider";
import { Routes, Route } from "react-router-dom";
import JobStatusPage from "./JobStatusPage";
import { BrowserRouter } from "react-router-dom";
import DataTableLink from "./DataTableLink";
import TablesOverview from "./TablesOverview";
import Upload from "./Upload";
import Ingest from "./Ingest";
import JobsOverview from "./JobsOverview";

const App: React.FC = () => {
  const [selectedPageName, setSelectedPageName] = useState<string>("Auth");
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const toggleDarkMode = () => {
    setDarkMode((mode) => !mode);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const projectId = urlParams.get("projectId");
    if (token) {
      localStorage.setItem("wildflow-invite-token", token);
    }
    if (projectId) {
      localStorage.setItem("wildflow-project-id", projectId);
    }
  }, []);

  return (
    <BrowserRouter>
      <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
        <GoogleOAuthProvider clientId="30246104341-2gt4q839sbet97i1gf1qiscehblsefth.apps.googleusercontent.com">
          <SelectedPageContext.Provider
            value={{ selectedPageName, setSelectedPageName }}
          >
            <OrganismProvider>
              <div className="flex">
                <Sidebar />
                <div
                  className={`flex flex-grow flex-shrink ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-black"
                  } transition-all duration-200 ease-in-out`}
                >
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/job/:jobId" element={<JobStatusPage />} />
                    <Route path="/jobs" element={<JobsOverview />} />
                    <Route
                      path="/table/:tableName"
                      element={<DataTableLink />}
                    />
                    <Route path="/ingest/*" element={<Ingest />} />
                    <Route path="/mergetables" element={<MergeTables />} />
                    <Route path="/explorer" element={<Explorer />} />
                    <Route path="/" element={<Explorer />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/datasets" element={<TablesOverview />} />
                    <Route path="/upload" element={<Upload />} />
                    {/* <Route path="/datasets" element={<Datasets />} /> */}
                    <Route path="/workflows" element={<MergeTables />} />
                    <Route path="/query" element={<Query />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* You can add a default fallback route if needed */}
                    <Route path="*" element={<WrongUrl />} />
                  </Routes>
                </div>
              </div>
            </OrganismProvider>
          </SelectedPageContext.Provider>
        </GoogleOAuthProvider>
      </ThemeContext.Provider>
    </BrowserRouter>
  );
};

const WrongUrl: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full">
      It seems you entered a wrong URL 🤗
    </div>
  );
};

export default App;
