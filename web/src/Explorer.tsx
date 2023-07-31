import React, { Suspense, useEffect, useState } from "react";
import Map from "./Map";
import MapDatapoints from "./MapDatapoints";
import { usePopulationData } from "./usePopulationData";
import SelectOrganism from "./SelectOrganism";
import { OrganismContext } from "./OrganismProvider";

const Explorer: React.FC = () => {
  const { organism } = React.useContext(OrganismContext);
  const { data, bounds } = usePopulationData(organism);
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <Suspense fallback={<div>Loading map...</div>}>
        <Map bounds={bounds}>
          <Suspense fallback={<div>Loading population data...</div>}>
            <MapDatapoints data={data} />
          </Suspense>
        </Map>
      </Suspense>
      <div className="absolute top-3 left-40 bg-red-200 w-1/3">
        <SelectOrganism />
      </div>
    </div>
  );
};

export default Explorer;
