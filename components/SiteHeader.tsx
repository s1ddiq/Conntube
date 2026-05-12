"use client";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import React from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MoonIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@wrksz/themes/client";

const SiteHeader = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();

  // Don't render header on room pages
  return (
    <div className="flex justify-center items-center p-4 gap-4 h-16 bg-background border-b-4 z-40">
      <header
        className={`flex justify-between ${pathname.startsWith("/room/") ? "" : "max-w-7xl"} w-full items-center p-4 gap-4 h-16`}
      >
        <Link href="/" className="flex justify-center items-center gap-4">
          <Image src="/logo.svg" width={32} height={32} alt="Conntube Logo" />
          <p className="font-bold text-lg">Conntube</p>
        </Link>

        <div className="flex-center gap-6">
          {resolvedTheme === "light" ? (
            <Button
              variant="outline"
              onClick={() => setTheme("dark")}
              size="icon-lg"
            >
              <SunIcon />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setTheme("light")}
              size="icon-lg"
            >
              <MoonIcon />
            </Button>
          )}
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton>
              <Button>Sign Up</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>
    </div>
  );
};

export default SiteHeader;
