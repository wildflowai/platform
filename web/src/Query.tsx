import React from "react";

const Query: React.FC = () => {
  console.log(">>>>>>>>>>>>>>", "we're in the Query");
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <h1>From here you should be able execute R or SQL against cloud data.</h1>
    </div>
  );
};

export default Query;
