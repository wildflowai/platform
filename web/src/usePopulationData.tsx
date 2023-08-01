import axios from "axios";
import useSWR from "swr";

const API_ENDPOINT =
  "https://us-central1-wildflow-demo.cloudfunctions.net/getPopulationCounts";

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

const calcBounds = (responseData: any) => {
  const bounds = new window.google.maps.LatLngBounds();
  getPopulationCounts(responseData).forEach((point: any) =>
    bounds.extend(point.location)
  );
  return bounds;
};

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

const usePopulationData = (organism: any) => {
  const fetchData = async (url: string) => {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error("An error occurred while fetching data.");
    }
  };

  const { data, error } = useSWR(
    `${API_ENDPOINT}?gbifIds=${organism.gbifId}&timeGranularity=MONTH`,
    fetchData
  );

  return {
    data,
    center: data ? getCenter(getPopulationCounts(data)) : null,
    bounds: data ? calcBounds(data) : null,
    isLoading: !error && !data,
    isError: error,
  };
};

export { usePopulationData, getUniqueLocations };
