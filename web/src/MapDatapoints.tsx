import React from "react";
import { Circle } from "@react-google-maps/api";
import { getUniqueLocations } from "./usePopulationData";

type MapDatapointsProps = {
  data: any[];
};

const MapDatapoints: React.FC<MapDatapointsProps> = ({ data }) => {
  if (!data)
    return (
      <div className="absolute left-1/2 top-1/2 text-gray-0">
        Fetching the data...
      </div>
    );
  return (
    <>
      {getUniqueLocations(data).map((point: any, i: number) => (
        <Circle
          key={i}
          center={point}
          options={{
            strokeColor: "#FFFFFF",
            fillColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 6,
            fillOpacity: 0.8,
            radius: 0,
          }}
        />
      ))}
    </>
  );
};

export default MapDatapoints;
