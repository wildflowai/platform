import React from "react";
import { GoogleMap, useJsApiLoader, Circle } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

// Array of hardcoded points
const points = [
  { lat: -3.745, lng: -38.5 },
  { lat: -3.746, lng: -38.524 },
  { lat: -3.7, lng: -38.525 },
  { lat: -3.748, lng: -38.526 },
  { lat: -3.749, lng: -38.527 },
];

// Calculate the average lat and lng for the center of the map
const center = points.reduce(
  (acc, cur) => {
    return { lat: acc.lat + cur.lat, lng: acc.lng + cur.lng };
  },
  { lat: 0, lng: 0 }
);

// Divide by the total number of points to get the average
center.lat /= points.length;
center.lng /= points.length;

function Map() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

  const [map, setMap] = React.useState(null);

  const onLoad = React.useCallback(function callback(map: any) {
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      mapTypeId={"satellite"}
    >
      {/* Add a Circle for each point */}
      {points.map((point, i) => (
        <Circle
          key={i}
          center={point}
          options={{
            strokeColor: "#FF0000",
            fillColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillOpacity: 0.35,
            radius: 500,
          }}
        />
      ))}
    </GoogleMap>
  ) : (
    <div>Loading...</div>
  );
}

export default Map;
