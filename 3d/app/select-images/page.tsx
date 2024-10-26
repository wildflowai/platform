import dynamic from "next/dynamic";

const ClientSelectImages = dynamic(() => import("./ClientSelectImages"), {
  ssr: false,
});

export default function SelectImagesPage() {
  return <ClientSelectImages />;
}
