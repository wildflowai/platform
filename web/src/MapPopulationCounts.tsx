import React from "react";
import TimeSlider from "./TimeSlider";
import { HeatmapLayer } from "@react-google-maps/api";

type MapDatapointsProps = {
  data: any[];
};

interface DataRow {
  gbif_id: number;
  timewindow_start: object;
  lat: number;
  lon: number;
  population_count: number;
}

const getPopulationCounts = (responseData: any) => {
  return responseData.map((row: DataRow) => {
    return {
      location: new window.google.maps.LatLng(row.lat, row.lon),
      weight: row.population_count,
    };
  });
};

const selectedPopulationCounts = (responseData: any, selectedDate: number) => {
  return getPopulationCounts(
    responseData.filter((row: any) => {
      const date = new Date((row.timewindow_start as any).value).getTime();
      return date === selectedDate;
    })
  );
};

const getTimeDataVal = (responseData: DataRow[]) =>
  responseData.map((row: DataRow) => {
    return {
      date_millis: new Date((row.timewindow_start as any).value).getTime(),
      count: row.population_count,
    };
  });

const MapPopulationCounts: React.FC<MapDatapointsProps> = ({ data }) => {
  const [selectedDate, setSelectedDate] = React.useState<number | null>(null);
  return (
    <>
      {data && data.length !== 0 && selectedDate && (
        <HeatmapLayer
          data={selectedPopulationCounts(data, selectedDate)}
          options={{
            radius: 150,
          }}
        />
      )}
      {data && data.length !== 0 && (
        <div className="absolute bottom-3 ml-20 w-10/12">
          <TimeSlider
            data={getTimeDataVal(data)}
            onDateChange={setSelectedDate}
          />
        </div>
      )}
    </>
  );
};

export default MapPopulationCounts;
