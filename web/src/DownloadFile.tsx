import React, { useState, useEffect } from "react";
import { downloadFile, bucketId } from "./api";

interface Props {
  filePath: string;
}

const DownloadFile: React.FC<Props> = ({ filePath }) => {
  const [buttonName, setButtonName] = useState("Download");

  const handleOnClick = () => {
    setButtonName("Downloading...");
    const url = `https://storage.cloud.google.com/${bucketId()}/${filePath}`;
    window.open(url, "_blank");
    // downloadFile(filePath).then((response) => {
    //   console.log(response);
    //   setButtonName("Downloading...");
    //   const url = response.data.url;
    //   window.open(url, "_blank");
    // });
  };

  return (
    <button
      className="bg-blue-600 py-1 px-4 rounded mt-4"
      onClick={handleOnClick}
    >
      {buttonName}
    </button>
  );
};

export default DownloadFile;
