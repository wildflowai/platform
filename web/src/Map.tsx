import React, { ReactNode, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

type LatLng = {
  lat: number;
  lng: number;
};

type MapProps = {
  bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral | null;
  children?: ReactNode;
};

const centerFromLocalStorageOrDefault = () => {
  const savedCenter = localStorage.getItem("mapCenter");
  return savedCenter ? JSON.parse(savedCenter) : new google.maps.LatLng(10, 10);
};

const Map: React.FC<MapProps> = ({ bounds, children }) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
    libraries: ["visualization"],
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
  }, []);

  const onUnmount = React.useCallback(function callback() {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (isLoaded && mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds);
    }
  }, [isLoaded, bounds]);

  return isLoaded ? (
    <div className="h-screen w-full flex flex-col relative flex items-center justify-center">
      <GoogleMap
        mapContainerStyle={{
          width: "100%",
          height: "100vh",
        }}
        center={centerFromLocalStorageOrDefault()}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onCenterChanged={() => {
          if (mapRef.current) {
            const center = mapRef.current.getCenter();
            if (center) {
              localStorage.setItem(
                "mapCenter",
                JSON.stringify(center.toJSON())
              );
            }
          }
        }}
        options={{
          mapTypeId: "satellite",
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
        }}
      >
        {children}
      </GoogleMap>
    </div>
  ) : (
    <div>Loading Google Map...</div>
  );
};

export default Map;
