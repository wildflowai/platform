import { useEffect, useState } from "react";
import TablesOverviewFlat from "./TablesOverviewFlat";
import ShowText from "./ShowText";
import { projectId, getAllTablesForProject } from "./api";
import Datasets from "./Datasets";

const TablesOverview = () => {
  const [data, setData] = useState<any>(null);
  const [showLegacy, setShowLegacy] = useState<boolean>(false);

  useEffect(() => {
    console.log(projectId());
    if (projectId() === undefined || projectId() === "no-projectId") {
      setShowLegacy(true);
    } else {
      getAllTablesForProject().then((data) => {
        // Could be {error: 'Invalid token'} or {data: []}
        if (!data.error) {
          setData(data);
        }
      });
    }
  }, []);

  if (showLegacy) {
    return <Datasets />;
  }

  if (!data) {
    return <ShowText text="Loading a list of tables..." />;
  }
  return <TablesOverviewFlat data={data} />;
};

export default TablesOverview;
