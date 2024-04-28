// SelectDirectory.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import Papa from "papaparse";

export default function SelectDirectory() {
  const [results, setResults] = useState<string | null>(null);

  const handleDirectorySelection = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const { detections, csvFile } = await findRequiredFiles(dirHandle);
      const labeledDetections = await parseDetections(detections);
      const sharktrackData = await parseCsv(csvFile);
      const maxNData = computeMaxN(sharktrackData, labeledDetections);
      const csvContent = convertToCSV(maxNData);
      downloadCSV(csvContent, "maxn.csv");
      setResults("Detections and CSV data processed and downloaded.");
    } catch (error) {
      console.error("Error:", error);
      toast.error((error as any).message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <Button onClick={handleDirectorySelection}>Select Directory</Button>
      {results && <div>Results: {results}</div>}
    </div>
  );
}

async function findRequiredFiles(dirHandle: FileSystemDirectoryHandle) {
  const detections = await dirHandle.getDirectoryHandle("detections");
  const csvFile = await dirHandle.getFileHandle("output.csv");
  return { detections, csvFile };
}

async function parseDetections(detectionsDir: FileSystemDirectoryHandle) {
  const labeledDetections: Record<number, string> = {};
  for await (const fileEntry of (detectionsDir as any).values()) {
    if (fileEntry.kind === "file" && fileEntry.name.endsWith(".jpg")) {
      const match = fileEntry.name.match(/^(\d+)-(.+)\.jpg$/);
      if (match) {
        const [_, trackId, label] = match;
        labeledDetections[parseInt(trackId)] = label;
      } else {
        throw new Error(
          "File format is incorrect, should be '{TRACK_ID}-{CLASS}.jpg'",
        );
      }
    }
  }
  return labeledDetections;
}

async function parseCsv(csvFileHandle: FileSystemFileHandle) {
  const file = await csvFileHandle.getFile();
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results: any) => {
        resolve(results.data);
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });
}

function computeMaxN(data: any[], detections: Record<number, string>) {
  const grouped: any = {};

  // sort data first by chapter path and then by frame
  data.sort((a, b) => {
    if (a.chapter_path < b.chapter_path) {
      return -1;
    }
    if (a.chapter_path > b.chapter_path) {
      return 1;
    }
    return a.frame - b.frame;
  });

  data.forEach((row) => {
    const classLabel = detections[row.track_id];
    if (classLabel) {
      const key = `${row.chapter_path}`; // Group by chapter_path and class
      if (!grouped[key]) {
        grouped[key] = {
          maxN: 0,
          tracks: new Set(),
          chapter_path: row.chapter_path,
          class: classLabel,
          firstMaxFrame: row.frame,
          firstMaxTime: row.time,
        };
      }
      grouped[key].tracks.add(row.track_id);
      const currentCount = grouped[key].tracks.size;
      // Update maxN only if the current count of unique track IDs is greater
      if (currentCount > grouped[key].maxN) {
        grouped[key].maxN = currentCount;
        grouped[key].firstMaxFrame = row.frame; // Set the frame where maxN was first reached
        grouped[key].firstMaxTime = row.time; // Set the time when maxN was first reached
      }
    }
  });

  // Map to array for output, using firstMaxFrame and firstMaxTime
  return Object.values(grouped).map((g: any) => ({
    chapter_path: g.chapter_path,
    frame: g.firstMaxFrame,
    class: g.class,
    time: g.firstMaxTime,
    n: g.maxN,
    tracks_in_maxn: `[${Array.from(g.tracks).join(", ")}]`,
  }));
}

function convertToCSV(data: any[]): string {
  // Custom replacer function to handle quotes only when necessary
  const replacer = (key: string, value: any) => {
    if (value === null) {
      return "";
    }
    // Check if the value contains commas, quotes, or newlines
    if (typeof value === "string" && /[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`; // Escape quotes and wrap in quotes
    }
    return value.toString();
  };

  const header = [
    "chapter_path",
    "frame",
    "class",
    "time",
    "n",
    "tracks_in_maxn",
  ];

  const csv = [
    header.join(","), // header row first
    ...data.map((row) =>
      header.map((fieldName) => replacer(fieldName, row[fieldName])).join(","),
    ),
  ].join("\r\n");

  return csv;
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
