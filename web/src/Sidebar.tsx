import { SidebarButtonName, PageName } from "./types";
import React, { useContext } from "react";
import {
  AiOutlineGlobal,
  AiOutlineCode,
  AiOutlineSetting,
  AiOutlineDropbox,
  AiOutlineDatabase,
} from "react-icons/ai";
import {
  BsFillBrightnessHighFill,
  BsFillMoonFill,
  BsGraphUp,
} from "react-icons/bs";
import { LuWorkflow } from "react-icons/lu";
import { GiHamburgerMenu } from "react-icons/gi";
import { ThemeContext } from "./ThemeContext";
import { SelectedPageContext } from "./SelectedPageContext";
import { TbBrandGoogleBigQuery } from "react-icons/tb";

type VisibleButton = { Icon: any; text: string } | "separator";

const Sidebar: React.FC = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { selectedPageName, setSelectedPageName } =
    useContext(SelectedPageContext);
  const [showText, setShowText] = React.useState(false);

  const buttons: VisibleButton[] = [
    { Icon: AiOutlineDropbox, text: "Files" },
    { Icon: AiOutlineDatabase, text: "Datasets" },
    { Icon: AiOutlineGlobal, text: "Explorer" },
    { Icon: LuWorkflow, text: "Workflows" },
    { Icon: TbBrandGoogleBigQuery, text: "Query" },
    "separator",
    {
      Icon: darkMode ? BsFillBrightnessHighFill : BsFillMoonFill,
      text: darkMode ? "Day" : "Night",
    },
    { Icon: AiOutlineSetting, text: "Settings" },
  ];

  const handleClick = (buttonName: string) => {
    if (buttonName === (darkMode ? "Day" : "Night")) {
      toggleDarkMode();
    } else {
      setSelectedPageName(buttonName);
    }
  };

  return (
    <div
      className={`flex flex-col items-start h-screen overflow-auto transition-all duration-200 ease-in-out ${
        showText ? "w-36" : "w-16"
      } ${darkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"}`}
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
            onClick={() => handleClick(button.text)}
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
