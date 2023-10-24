import { useNavigate } from "react-router-dom";
import React, { useContext } from "react";
import {
  AiOutlineGlobal,
  AiOutlineCode,
  AiOutlineSetting,
  AiOutlineDropbox,
  AiOutlineDatabase,
  AiOutlinePlus,
} from "react-icons/ai";
import {
  BsFillBrightnessHighFill,
  BsFillMoonFill,
  BsGraphUp,
} from "react-icons/bs";
import { TbPlus } from "react-icons/tb";
import { LuWorkflow } from "react-icons/lu";
import { GiHamburgerMenu } from "react-icons/gi";
import { ThemeContext } from "./ThemeContext";
import { SelectedPageContext } from "./SelectedPageContext";
import { TbBrandGoogleBigQuery } from "react-icons/tb";

type VisibleButton = { Icon: any; text: string; path: string } | "separator";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { selectedPageName, setSelectedPageName } =
    useContext(SelectedPageContext);
  const [showText, setShowText] = React.useState(false);

  const buttons: VisibleButton[] = [
    { Icon: TbPlus, text: "Upload", path: "/upload" },
    { Icon: AiOutlineDropbox, text: "Files", path: "/files" },
    { Icon: AiOutlineDatabase, text: "Datasets", path: "/datasets" },
    { Icon: AiOutlineGlobal, text: "Explorer", path: "/explorer" },
    { Icon: LuWorkflow, text: "Workflows", path: "/workflows" },
    { Icon: TbBrandGoogleBigQuery, text: "Query", path: "/query" },
    "separator",
    {
      Icon: darkMode ? BsFillBrightnessHighFill : BsFillMoonFill,
      text: darkMode ? "Day" : "Night",
      path: "", // No path for the dark mode toggle
    },
    { Icon: AiOutlineSetting, text: "Settings", path: "/settings" },
  ];

  const handleClick = (b: VisibleButton) => {
    if (b === "separator") return;
    if (b.text === (darkMode ? "Day" : "Night")) {
      toggleDarkMode();
    } else {
      setSelectedPageName(b.text);
      navigate(b.path);
    }
  };

  return (
    <div
      className={`flex flex-col items-start h-screen overflow-auto transition-all duration-200 ease-in-out ${
        showText ? "w-36" : "w-16"
      } ${
        darkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"
      } flex-shrink-0`}
    >
      <button onClick={() => setShowText(!showText)} className="mt-3 ml-4 mb-1">
        <GiHamburgerMenu
          size={24}
          className="hover:text-blue-500 dark:hover:text-blue-300"
        />
      </button>
      {buttons.map((button, index) =>
        button === "separator" ? (
          <div className="flex-1" key={index} />
        ) : (
          <button
            key={button.text}
            className={`my-3 flex items-center w-full justify-start pl-4 flex-shrink-0 ${
              button.text === selectedPageName ? "text-blue-500" : ""
            }`}
            onClick={() => handleClick(button)}
          >
            <div
              className={`flex items-center w-full justify-start hover:text-blue-500 dark:hover:text-blue-300`}
            >
              <div>
                <button.Icon
                  size={24}
                  className={
                    button.text === selectedPageName ? "text-blue-500" : ""
                  }
                />
              </div>
              <div
                className={`ml-2 whitespace-nowrap overflow-hidden ${
                  showText ? "w-auto opacity-100" : "w-0 opacity-0"
                }`}
              >
                {button.text}
              </div>
            </div>
          </button>
        )
      )}
    </div>
  );
};

export default Sidebar;
