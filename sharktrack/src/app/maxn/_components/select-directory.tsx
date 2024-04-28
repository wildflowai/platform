"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

export default function SelectDirectory() {
  const [results, setResults] = useState<string | null>(null);

  const handleDirectorySelection = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const jpgFiles = await countJpgFiles(dirHandle);
    } catch (error) {
      console.error("Error picking directory:", error);
    }
  };

  if (results) {
    return <div>Results: {results}</div>;
  }
  return (
    <div className="flex h-screen items-center justify-center">
      <Button
        onClick={() => {
          console.log("clicked!!");
          toast.error("Yay!");
        }}
      >
        Select Directory
      </Button>
    </div>
  );
}

const countJpgFiles = async (
  dirHandle: FileSystemDirectoryHandle,
): Promise<number> => {
  console.log("Looking for 'detections' subdirectory");
  let jpgCount = 0;
  try {
    const detectionsDirHandle =
      await dirHandle.getDirectoryHandle("detections");
    console.log("Started counting in 'detections'");
    for await (const entry of (detectionsDirHandle as any).values()) {
      if (entry.kind === "file" && entry.name.endsWith(".jpg")) {
        jpgCount++;
      }
    }
    console.log("Finished counting", jpgCount);
  } catch (error) {
    console.error("Error: 'detections' subdirectory not found");
    throw new Error("'detections' subdirectory not found");
  }
  return jpgCount;
};
