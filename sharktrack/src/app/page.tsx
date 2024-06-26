import { Button } from "~/components/ui/button";
import { SignIn, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

async function Landing() {
  return (
    <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16 ">
      <h1 className="overflow-hidden whitespace-nowrap text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
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
      <div className="space-x-2">
        <Link href="/maxn">
          <Button>Calculate MaxN</Button>
        </Link>
        <Button variant="outline">
          <SignInButton />
        </Button>
        <Button variant="outline">
          <a
            href="https://wildflow.mintlify.app/tutorials/sharktrack"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn More
          </a>
        </Button>
      </div>
    </div>
  );
}

async function Table() {
  return <div>Hello</div>;
}

export default async function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <SignedOut>
        <Landing />
      </SignedOut>
      <SignedIn>
        <Table />
      </SignedIn>
    </main>
  );
}
