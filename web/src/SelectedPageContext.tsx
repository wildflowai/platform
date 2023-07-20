import React from "react";

export const SelectedPageContext = React.createContext({
  selectedPageName: "Explorer",
  setSelectedPageName: (newPageName: string) => {},
});
