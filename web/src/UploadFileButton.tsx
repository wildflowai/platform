import { useContext } from "react";
import { FaPlus } from "react-icons/fa";
import { ThemeContext } from "./ThemeContext";
import { useNavigate } from "react-router-dom";

const UploadFileButton = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  return (
    <button
      className={`absolute h-12 w-12 text-3xl rounded flex items-center justify-center m-4 ${
        darkMode
          ? "bg-gray-800 hover:bg-gray-900"
          : "bg-gray-200 hover:bg-gray-300"
      }`}
      onClick={() => navigate("/upload")}
    >
      <FaPlus />
    </button>
  );
};

export default UploadFileButton;
