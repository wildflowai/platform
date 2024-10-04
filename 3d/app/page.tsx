import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl mb-4">Welcome to Wildflow Coral 3D Viewer</h1>
      <p className="mb-4">Enter a model ID in the URL to view a 3D model.</p>
      <Link href="/W32Em7" className="text-blue-500 hover:underline">
        View Sample Model (W32Em7)
      </Link>
    </div>
  );
}
