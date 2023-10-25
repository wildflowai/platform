import React, { useState } from "react";
import FileUpload from "./FileUpload";
import { uploadFile, bucketId } from "./api"; // Import the uploadFile function
import { useNavigate } from "react-router-dom";
import ShowText from "./ShowText";
import { last } from "lodash";

const generateNewPath = (path: string) => {
  const lastDot = path.lastIndexOf(".");
  const timestamp = new Date().toISOString();
  const destinationPrefix = "uploaded/";
  if (lastDot === -1) {
    return destinationPrefix + path + "_" + timestamp;
  }
  const filePath = path.substring(0, lastDot);
  const fileExtension = path.substring(lastDot + 1);
  return destinationPrefix + filePath + "_" + timestamp + "." + fileExtension;
};

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");

  const handleFileUpload = async (uploadedFile: File) => {
    setStatus("Uploading the file...");

    try {
      const destinationFileName = generateNewPath(uploadedFile.name);
      console.log(uploadFile.name, destinationFileName);
      await uploadFile(uploadedFile, destinationFileName);
      setStatus("File successfully uploaded");
      navigate(`/ingest/${bucketId()}/${destinationFileName}`);
    } catch (error: any) {
      console.error("File upload failed", error);
      setStatus("File upload failed: " + error.message);
    }
  };

  if (!localStorage.getItem("wildflow-invite-token")) {
    return (
      <ShowText
        text="This feature under development. Please specify your auth token to view
      this page."
      />
    );
  }

  if (status === "") {
    return <FileUpload onFileUpload={handleFileUpload} />;
  }

  return <ShowText text={status} />;
};

export default Upload;
