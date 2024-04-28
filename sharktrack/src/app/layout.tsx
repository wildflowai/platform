import "~/styles/globals.css";
import { ClerkProvider, SignedOut } from "@clerk/nextjs";
import { TopNav } from "./_components/topnav";
import { SignedIn } from "@clerk/nextjs";

import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Wildflow SharkTrack",
  description: "Track all your sharks! 🦈",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`font-sans ${inter.variable} dark`}>
          <SignedIn>
            <TopNav />
          </SignedIn>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
