import React, { useState } from "react";
import { isPelagic } from "./api";
import QueryR from "./QueryR";
import QueryOld from "./QueryOld";

const Query: React.FC = () => {
  if (isPelagic()) {
    return <QueryR />;
  }
  return <QueryOld />;
};

export default Query;
