"use client";

import { useSearchParams } from "next/navigation";
import SelectImagesContent from "./SelectImagesContent";

export default function ClientSelectImages() {
  const searchParams = useSearchParams();

  return <SelectImagesContent searchParams={searchParams} />;
}
