"use client";

import { useRouter } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { fetchContributors } from "../../utils/fetchContributors";
import { useEffect, useState } from "react";
import { ReactNode } from "react";

export default function Contributors({
  params,
}: {
  params: { modelId: string };
}) {
  const router = useRouter();
  const { modelId } = params;
  const [contributorsContent, setContributorsContent] =
    useState<ReactNode | null>(null);

  useEffect(() => {
    fetchContributors(modelId)
      .then((data) => {
        setContributorsContent(data.contributorsContent);
      })
      .catch((error) => console.error("Error fetching contributors:", error));
  }, [modelId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-black text-white p-8 relative max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg">
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4"
        >
          <XMarkIcon className="h-6 w-6 text-white hover:text-gray-300" />
        </button>
        <div className="space-y-4">{contributorsContent}</div>
      </div>
    </div>
  );
}
