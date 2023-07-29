import React from "react";
import axios from "axios";
import {
  GoogleMap,
  useJsApiLoader,
  HeatmapLayer,
  Circle,
} from "@react-google-maps/api";
import TimeSlider, { TimeData } from "./TimeSlider";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { ThemeContext } from "./ThemeContext";

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
  timewindow_start: object;
  lat: number;
  lon: number;
  population_count: number;
}

interface OptionType {
  value: number;
  label: string;
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

function Map() {
  const { darkMode, toggleDarkMode } = React.useContext(ThemeContext);
  const [totalMatches, setTotalMatches] = React.useState<number | null>(null);

  const [map, setMap] = React.useState(null);
  const [responseData, setResponseData] = React.useState<DataRow[]>([]);
  //const [timeData, setTimeData] = React.useState<TimeData[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<number | null>(null);
  const [species, setSpecies] = React.useState<{
    value: number | null;
    label: string | null;
  }>({ value: null, label: null });
  const [speciesOptions, setSpeciesOptions] = React.useState<OptionType[]>([]);

  const fetchPopulationCounts = async (speciesId: number | null = null) => {
    let url =
      "https://us-central1-wildflow-demo.cloudfunctions.net/getPopulationCounts";
    if (speciesId !== null) {
      url += `?gbifIds=${speciesId}&timeGranularity=MONTH`;
    }
    const response = await axios.get(url);
    setResponseData(response.data);
    setSelectedDate(getTimeDataVal(response.data)[0].date_millis);
  };

  const loadSpeciesOptions = async (
    inputValue: string = "",
    callback?: (options: OptionType[]) => void
  ): Promise<OptionType[]> => {
    try {
      const response = await axios.get(
        `https://us-central1-wildflow-demo.cloudfunctions.net/getSpeciesList?searchTerm=${inputValue}`
      );
      const totalMatches = response.data.total;
      setTotalMatches(totalMatches);

      const speciesData: OptionType[] = response.data.species
        .map((species: { gbif_id: number; scientific_name: string }) => ({
          value: species.gbif_id,
          label: species.scientific_name,
        }))
        .slice(0, 5); // Limit options to 5
      setSpeciesOptions(speciesData);
      if (!species.value && speciesData.length > 0) {
        const defaultSpecies = speciesData[0];
        setSpecies(defaultSpecies); // Set the default species as the first one
        fetchPopulationCounts(defaultSpecies.value);
      }
      callback?.(speciesData);
      return speciesData;
    } catch (err) {
      console.error(err);
      callback?.([]);
      return [];
    }
  };

  const handleSpeciesChange = (selectedOption: any) => {
    setSpecies(selectedOption);
    fetchPopulationCounts(selectedOption.value);
  };

  React.useEffect(() => {
    loadSpeciesOptions().catch((error) => {
      console.error("Error loading species options:", error);
    });
  }, []);

  React.useEffect(() => {
    if (species.value !== null) {
      fetchPopulationCounts(species.value);
    }
    loadSpeciesOptions();
  }, [species]);

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

  return isLoaded && responseData.length > 0 ? (
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
        <TimeSlider
          data={getTimeDataVal(responseData)}
          onDateChange={setSelectedDate}
        />
      </div>

      <div className="absolute top-3 ml-20 w-1/3 flex justify-between items-center">
        <AsyncSelect
          cacheOptions={false}
          loadOptions={loadSpeciesOptions}
          defaultOptions={speciesOptions}
          onChange={handleSpeciesChange}
          placeholder={`Search...`}
          value={species}
          styles={{
            option: (provided, state) => ({
              ...provided,
              color: "#202020",
            }),
            singleValue: (provided) => ({
              ...provided,
              color: "#202020",
            }),
            control: (provided) => ({
              ...provided,
              width: "90%", // adjust width to make room for total count
            }),
          }}
        />
        <div className="ml-4">{totalMatches && `${totalMatches} total`}</div>
      </div>
    </div>
  ) : (
    <div>Loading...</div>
  );
}

export default Map;
