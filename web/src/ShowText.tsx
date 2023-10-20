import React from "react";

interface Props {
  text: string;
}

const ShowText: React.FC<Props> = ({ text }) => {
  return (
    <div className="flex items-center justify-center w-full h-full">{text}</div>
  );
};

export default ShowText;
