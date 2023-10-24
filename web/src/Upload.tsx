import React, { useState, useContext } from "react";
import FileUpload from "./FileUpload";
import FilePreviewAndUpload from "./FilePreviewAndUpload";
import { ThemeContext } from "./ThemeContext";

const Upload: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
  };

  const handleUpload = (data: any[], tableName: string) => {
    console.log("Uploading data to table:", tableName);
    console.log("Data:", data);

    // Here you would add your logic to upload the data to your backend
  };

  return (
    <div className="p-4 flex items-center justify-center w-full">
      {!file ? (
        <FileUpload onFileUpload={handleFileUpload} />
      ) : (
        <FilePreviewAndUpload file={file} onUpload={handleUpload} />
      )}
    </div>
  );
};

export default Upload;
