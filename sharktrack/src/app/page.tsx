import Link from "next/link";
import { db } from "../server/db/index";

export default async function HomePage() {
  const users = await db.query.users.findMany();
  console.log("users: >>>>>>", users);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16 ">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          SharkTrack 🦈 🎥
        </h1>
        <div className="tracking-tight text-white">
          Cloud version of incredible{" "}
          <a
            className="text-blue-400 hover:text-blue-300"
            href="https://github.com/filippovarini/sharktrack"
            target="_blank"
          >
            github.com/filippovarini/sharktrack
          </a>
        </div>
      </div>
    </main>
  );
}
