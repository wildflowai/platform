import React, { useCallback, useState, useContext } from "react";
import { useDropzone } from "react-dropzone";
import { ThemeContext } from "./ThemeContext";

const FileUpload: React.FC<{ onFileUpload: (file: File) => void }> = ({
  onFileUpload,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      onFileUpload(file);
    },
    [onFileUpload]
  );

  const { darkMode } = useContext(ThemeContext);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className="border-dashed border-4 p-10 text-center cursor-pointer border-gray-400"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className={darkMode ? "dark:text-gray-100" : "light:text-gray-600"}>
          Drop the file here...
        </p>
      ) : (
        <p className={darkMode ? "dark:text-gray-100" : "light:text-gray-600"}>
          Drag 'n' drop a CSV file here, or click to select a file
        </p>
      )}
    </div>
  );
};

export default FileUpload;
