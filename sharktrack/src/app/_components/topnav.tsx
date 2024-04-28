import {
  SignInButton,
  SignOutButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "~/components/ui/button";

export function TopNav() {
  return (
    <nav className="flex w-full items-center justify-between border-b p-2">
      <div>SharkTrack 🦈 🎥</div>
      <div className="flex flex-row items-center gap-4">
        <Button variant="link">
          <a
            href="https://wildflow.mintlify.app/tutorials/sharktrack"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
        </Button>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
          <SignOutButton />
        </SignedIn>
      </div>
    </nav>
  );
}
