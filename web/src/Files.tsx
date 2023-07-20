import React from "react";

const Files: React.FC = () => {
  console.log(">>>>>>>>>>>>>>", "we're in Files");
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <h1>
        This will be DropBox / Google Drive integration page containing your
        files.
      </h1>
    </div>
  );
};

export default Files;
