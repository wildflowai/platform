import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Explorer from "./Explorer";
import Files from "./Files";
import Datasets from "./Datasets";
import Workflows from "./Workflows";
import Query from "./Query";
import Settings from "./Settings";
import { ThemeContext } from "./ThemeContext";
import { SelectedPageContext } from "./SelectedPageContext";
import { OrganismProvider } from "./OrganismProvider";

const App: React.FC = () => {
  const [selectedPageName, setSelectedPageName] = useState<string>("Query");
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const toggleDarkMode = () => {
    setDarkMode((mode) => !mode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <SelectedPageContext.Provider
        value={{ selectedPageName, setSelectedPageName }}
      >
        <OrganismProvider>
          <div className="flex">
            <Sidebar />
            <div
              className={`flex flex-grow flex-shrink ${
                darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-black"
              } transition-all duration-200 ease-in-out`}
            >
              {(() => {
                switch (selectedPageName) {
                  case "Explorer":
                    return <Explorer />;
                  case "Files":
                    return <Files />;
                  case "Datasets":
                    return <Datasets />;
                  case "Workflows":
                    return <Workflows />;
                  case "Query":
                    return <Query />;
                  case "Settings":
                    return <Settings />;
                  default:
                    return null;
                }
              })()}
            </div>
          </div>
        </OrganismProvider>
      </SelectedPageContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
