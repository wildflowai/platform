import React from "react";
import axios from "axios";
import {
  GoogleMap,
  useJsApiLoader,
  HeatmapLayer,
  Circle,
} from "@react-google-maps/api";
import TimeSlider, { TimeData } from "./TimeSlider";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const getCenter = (points: any) => {
  const center = points.reduce(
    (acc: any, cur: any) => {
      return { lat: acc.lat + cur.lat, lng: acc.lng + cur.lng };
    },
    { lat: 0, lng: 0 }
  );
  center.lat /= points.length;
  center.lng /= points.length;
  return center;
};

interface DataRow {
  gbif_id: number;
  day_start: object;
  lat: number;
  lon: number;
  mean_count: number;
}

const getUniqueLocations = (responseData: DataRow[]) => {
  return Array.from(
    new Set(
      responseData.map((row: DataRow) => {
        return JSON.stringify([row.lat, row.lon]);
      })
    )
  ).map((latLonStr: string) => {
    const [lat, lon] = JSON.parse(latLonStr);
    return new window.google.maps.LatLng(lat, lon);
  });
};

const getPopulationCounts = (responseData: any) => {
  return responseData.map((row: DataRow) => {
    return {
      location: new window.google.maps.LatLng(row.lat, row.lon),
      weight: row.mean_count,
    };
  });
};

const selectedPopulationCounts = (responseData: any, selectedDate: number) => {
  return getPopulationCounts(
    responseData.filter((row: any) => {
      const date = new Date((row.day_start as any).value).getTime();
      return date === selectedDate;
    })
  );
};

function Map() {
  const [map, setMap] = React.useState(null);
  // const [populationCounts, setPopulationCounts] = React.useState<any[]>([]);
  const [responseData, setResponseData] = React.useState<DataRow[]>([]);
  const [timeData, setTimeData] = React.useState<TimeData[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<number | null>(null);

  const fetchPopulationCounts = async () => {
    const response = await axios.get(
      "https://us-central1-wildflow-demo.cloudfunctions.net/getPopulationCounts"
    );
    setResponseData(response.data);

    const timeDataVal: TimeData[] = response.data.map((row: DataRow) => {
      return {
        date_millis: new Date((row.day_start as any).value).getTime(),
        count: row.mean_count,
      };
    });
    setTimeData(timeDataVal);
    if (timeDataVal.length > 0) {
      setSelectedDate(timeDataVal[0].date_millis);
    }
  };

  React.useEffect(() => {
    fetchPopulationCounts();
  }, []);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
    libraries: ["visualization"],
  });

  const onLoad = React.useCallback(
    function callback(map: any) {
      const bounds = new window.google.maps.LatLngBounds();
      getPopulationCounts(responseData).forEach((point: any) =>
        bounds.extend(point.location)
      );
      map.fitBounds(bounds);
      setMap(map);
    },
    [responseData]
  );

  const onUnmount = React.useCallback(
    function callback(map: any) {
      setMap(null);
    },
    [responseData]
  );

  return isLoaded && responseData.length > 0 && timeData ? (
    <div className="h-screen w-full flex flex-col relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={getCenter(getPopulationCounts(responseData))}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeId: "satellite",
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
        }}
      >
        {getUniqueLocations(responseData).map((point: any, i: number) => (
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

        {selectedDate && (
          <HeatmapLayer
            data={selectedPopulationCounts(responseData, selectedDate)}
            options={{
              radius: 150,
            }}
          />
        )}
      </GoogleMap>
      <div className="absolute bottom-3 ml-20 w-10/12">
        <TimeSlider data={timeData} onDateChange={setSelectedDate} />
      </div>
    </div>
  ) : (
    <div>Loading...</div>
  );
}

export default Map;
