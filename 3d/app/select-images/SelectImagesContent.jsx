/* eslint-disable */
"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useDropzone } from "react-dropzone";
import { parseString } from "xml2js";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

import Plot from "./DynamicPlot";

const COLORS = [
  "rgba(255, 99, 132, 0.7)",
  "rgba(54, 162, 235, 0.7)",
  "rgba(255, 206, 86, 0.7)",
  "rgba(75, 192, 192, 0.7)",
  "rgba(153, 102, 255, 0.7)",
  "rgba(255, 159, 64, 0.7)",
];

const multiplyMatrices = (a, b) =>
  a.map((row, i) =>
    b[0].map((_, j) => row.reduce((acc, _, n) => acc + a[i][n] * b[n][j], 0))
  );

const parseXML = (xmlContent) =>
  new Promise((resolve, reject) =>
    parseString(xmlContent, (err, result) =>
      err ? reject(err) : resolve(result)
    )
  );

export default function SelectImages({ searchParams }) {
  const [cameras, setCameras] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [result, setResult] = useState(null);
  const [useGlobalCoordinates, setUseGlobalCoordinates] = useState(true);
  const [selectedPoints, setSelectedPoints] = useState(0);
  const plotRef = useRef(null);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith(".xml")) {
      const xmlContent = await file.text();
      const result = await parseXML(xmlContent);
      setResult(result);
      const extractedCameras = result.document.chunk[0].cameras[0].camera;
      const extractedSensors = result.document.chunk[0].sensors[0].sensor;
      setCameras(extractedCameras);
      setSensors(
        extractedSensors.map((sensor, index) => ({
          id: sensor.$.id,
          label: sensor.$.label,
          color: COLORS[index % COLORS.length],
          isSelected: true,
          imageCount: extractedCameras.filter(
            (camera) => camera.$.sensor_id === sensor.$.id
          ).length,
        }))
      );
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const { datasets, chartBounds } = useMemo(() => {
    if (cameras.length === 0 || sensors.length === 0 || !result)
      return { datasets: [], chartBounds: null };
    const chunkTransform = result.document.chunk[0].transform[0];
    const rotation = chunkTransform.rotation[0]._.split(" ").map(Number);
    const translation = chunkTransform.translation[0]._.split(" ").map(Number);
    const scale = parseFloat(chunkTransform.scale[0]._);
    const chunkMatrix = [
      [rotation[0], rotation[1], rotation[2], translation[0]],
      [rotation[3], rotation[4], rotation[5], translation[1]],
      [rotation[6], rotation[7], rotation[8], translation[2]],
      [0, 0, 0, 1],
    ];
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    const datasets = sensors.map((sensor) => {
      const sensorData = cameras
        .filter((camera) => camera.$.sensor_id === sensor.id)
        .map((camera) => {
          const cameraTransform = camera.transform[0].split(" ").map(Number);
          let x, y;
          if (useGlobalCoordinates) {
            const cameraMatrix = [
              [
                cameraTransform[0],
                cameraTransform[1],
                cameraTransform[2],
                cameraTransform[3],
              ],
              [
                cameraTransform[4],
                cameraTransform[5],
                cameraTransform[6],
                cameraTransform[7],
              ],
              [
                cameraTransform[8],
                cameraTransform[9],
                cameraTransform[10],
                cameraTransform[11],
              ],
              [0, 0, 0, 1],
            ];
            const globalMatrix = multiplyMatrices(chunkMatrix, cameraMatrix);
            x = globalMatrix[0][3] * scale;
            y = globalMatrix[1][3] * scale;
          } else {
            x = cameraTransform[3];
            y = cameraTransform[7];
          }
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          return { x, y, label: camera.$.label };
        });
      return {
        label: `${sensor.id}: ${sensor.label}`,
        data: sensorData,
        backgroundColor: sensor.color,
        pointRadius: 5,
      };
    });
    const margin = 0.1;
    const chartBounds = {
      minX: minX - (maxX - minX) * margin,
      maxX: maxX + (maxX - minX) * margin,
      minY: minY - (maxY - minY) * margin,
      maxY: maxY + (maxY - minY) * margin,
    };
    return { datasets, chartBounds };
  }, [cameras, sensors, result, useGlobalCoordinates]);

  const plotData = useMemo(() => {
    return datasets
      .filter((dataset) =>
        sensors.find(
          (sensor) =>
            sensor.id === dataset.label.split(":")[0] && sensor.isSelected
        )
      )
      .map((dataset) => ({
        x: dataset.data.map((point) => point.x),
        y: dataset.data.map((point) => point.y),
        text: dataset.data.map((point) => point.label),
        mode: "markers",
        type: "scatter",
        name: dataset.label,
        marker: { color: dataset.backgroundColor, size: 5 },
      }));
  }, [datasets, sensors]);

  const calculateBoundingBox = useCallback(() => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    datasets.forEach((dataset) => {
      dataset.data.forEach((point) => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });
    const xMargin = (maxX - minX) * 0.1;
    const yMargin = (maxY - minY) * 0.1;
    return {
      xRange: [minX - xMargin, maxX + xMargin],
      yRange: [minY - yMargin, maxY + yMargin],
    };
  }, [datasets]);

  const [plotLayout, setPlotLayout] = useState(() => {
    const { xRange, yRange } = calculateBoundingBox();
    return {
      autosize: true,
      plot_bgcolor: "black",
      paper_bgcolor: "black",
      font: { color: "white" },
      xaxis: { gridcolor: "rgba(173, 216, 230, 0.3)", range: xRange },
      yaxis: { gridcolor: "rgba(173, 216, 230, 0.3)", range: yRange },
      dragmode: "select",
      hovermode: "closest",
      selectdirection: "any",
      showlegend: false,
    };
  });

  const updateURL = useCallback(
    (minX, maxX, minY, maxY) => {
      const params = new URLSearchParams();
      if (minX !== null && maxX !== null && minY !== null && maxY !== null) {
        params.set("minX", minX.toString());
        params.set("maxX", maxX.toString());
        params.set("minY", minY.toString());
        params.set("maxY", maxY.toString());
      }
      router.push(`?${params.toString()}`);
    },
    [router]
  );

  const getSelectionFromURL = useCallback(() => {
    const minX = parseFloat(searchParams.get("minX") || "");
    const maxX = parseFloat(searchParams.get("maxX") || "");
    const minY = parseFloat(searchParams.get("minY") || "");
    const maxY = parseFloat(searchParams.get("maxY") || "");
    return isNaN(minX) || isNaN(maxX) || isNaN(minY) || isNaN(maxY)
      ? null
      : { minX, maxX, minY, maxY };
  }, [searchParams]);

  const countSelectedPoints = useCallback(
    (minX, maxX, minY, maxY) => {
      return datasets
        .filter((dataset) =>
          sensors.find(
            (sensor) =>
              sensor.id === dataset.label.split(":")[0] && sensor.isSelected
          )
        )
        .reduce((count, dataset) => {
          return (
            count +
            dataset.data.filter(
              (point) =>
                point.x >= minX &&
                point.x <= maxX &&
                point.y >= minY &&
                point.y <= maxY
            ).length
          );
        }, 0);
    },
    [datasets, sensors]
  );

  useEffect(() => {
    const { xRange, yRange } = calculateBoundingBox();
    setPlotLayout((prevLayout) => ({
      ...prevLayout,
      xaxis: { ...prevLayout.xaxis, range: xRange },
      yaxis: { ...prevLayout.yaxis, range: yRange },
    }));
    const selectionFromURL = getSelectionFromURL();
    if (selectionFromURL) {
      const { minX, maxX, minY, maxY } = selectionFromURL;
      setSelectedPoints(countSelectedPoints(minX, maxX, minY, maxY));
    } else {
      setSelectedPoints(0);
    }
  }, [calculateBoundingBox, getSelectionFromURL, countSelectedPoints]);

  const handleSelectionComplete = useCallback(
    (eventData) => {
      if (eventData.points && eventData.points.length > 0) {
        const [minX, maxX] = eventData.range.x;
        const [minY, maxY] = eventData.range.y;
        updateURL(minX, maxX, minY, maxY);
        setSelectedPoints(countSelectedPoints(minX, maxX, minY, maxY));
      } else {
        updateURL(null, null, null, null);
        setSelectedPoints(0);
      }
    },
    [updateURL, countSelectedPoints]
  );

  const toggleSensor = useCallback(
    (id) => {
      setSensors((prev) =>
        prev.map((sensor) =>
          sensor.id === id
            ? { ...sensor, isSelected: !sensor.isSelected }
            : sensor
        )
      );
      const { xRange, yRange } = calculateBoundingBox();
      setPlotLayout((prevLayout) => ({
        ...prevLayout,
        xaxis: { ...prevLayout.xaxis, range: xRange },
        yaxis: { ...prevLayout.yaxis, range: yRange },
      }));
      const selectionFromURL = getSelectionFromURL();
      if (selectionFromURL) {
        const { minX, maxX, minY, maxY } = selectionFromURL;
        setSelectedPoints(countSelectedPoints(minX, maxX, minY, maxY));
      } else {
        setSelectedPoints(0);
      }
    },
    [calculateBoundingBox, getSelectionFromURL, countSelectedPoints]
  );

  const handleDownload = useCallback(() => {
    const selectionFromURL = getSelectionFromURL();
    if (selectionFromURL) {
      const { minX, maxX, minY, maxY } = selectionFromURL;
      const selectedCameras = datasets
        .filter((dataset) =>
          sensors.find(
            (sensor) =>
              sensor.id === dataset.label.split(":")[0] && sensor.isSelected
          )
        )
        .flatMap((dataset) =>
          dataset.data.filter(
            (point) =>
              point.x >= minX &&
              point.x <= maxX &&
              point.y >= minY &&
              point.y <= maxY
          )
        )
        .map((point) => point.label);

      const content = selectedCameras.join("\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "selected_cameras.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [datasets, sensors, getSelectionFromURL]);

  const plotConfig = {
    displayModeBar: true,
    modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
    displaylogo: false,
    responsive: true,
  };

  return (
    <div className="h-screen w-full bg-black p-4 flex items-center justify-center">
      {datasets.length === 0 ? (
        <div
          {...getRootProps()}
          className={`p-20 border-2 border-dashed rounded-lg text-center ${
            isDragActive ? "border-blue-500 bg-blue-900" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-white">
            {isDragActive
              ? "Drop the XML file here"
              : "Drag 'n' drop an XML file here, or click to select a file"}
          </p>
        </div>
      ) : (
        <div className="w-full h-full relative">
          <button
            onClick={() => {
              setCameras([]);
              setSensors([]);
            }}
            className="absolute bottom-4 right-4 z-10 bg-red-500 hover:bg-red-700 text-white font-bold p-2 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <div className="w-full h-full relative">
            <Plot
              data={plotData}
              layout={plotLayout}
              config={plotConfig}
              style={{ width: "100%", height: "100%" }}
              onSelected={handleSelectionComplete}
              onDeselect={() => {
                updateURL(null, null, null, null);
                setSelectedPoints(0);
              }}
              className="plotly-bottom-right"
            />
          </div>
          <div className="absolute top-0 left-0 bg-black bg-opacity-80 rounded-lg p-2">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="globalToggle"
                checked={useGlobalCoordinates}
                onChange={() => setUseGlobalCoordinates(!useGlobalCoordinates)}
                className="mr-2"
              />
              <label htmlFor="globalToggle" className="text-white text-xs">
                Global Coordinates
              </label>
            </div>
            {sensors.map((sensor) => (
              <div key={sensor.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={sensor.id}
                  checked={sensor.isSelected}
                  onChange={() => toggleSensor(sensor.id)}
                  className="mr-2"
                />
                <label
                  htmlFor={sensor.id}
                  className="flex items-center text-white text-xs"
                >
                  <span
                    className="w-3 h-3 inline-block mr-2"
                    style={{ backgroundColor: sensor.color }}
                  ></span>
                  {`${sensor.id}: ${sensor.label} | ${sensor.imageCount} pics`}
                </label>
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 rounded-lg p-2 flex items-center">
            <p className="text-white text-xs mr-4 w-32">
              Selected points: {selectedPoints}
            </p>
            <button
              onClick={handleDownload}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded flex items-center"
              disabled={selectedPoints === 0}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              <span className="text-xs">Download</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
