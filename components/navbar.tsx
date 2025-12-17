"use client";
import { SignedIn, SignedOut, SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const { setTheme } = useTheme();
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <nav className="fixed top-0 left-0 w-full shadow-sm z-50 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={80} height={80} />
        </Link>

        {/* Theme Toggle, Avatar & Navigation Links */}
        <div className="space-x-6 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-border text-foreground hover:bg-muted/60"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Show this if the user is signed in */}
          <SignedIn>
            <Link
              href="/"
              className="font-medium text-foreground tracking-wide"
            >
              Home
            </Link>
            <Link className="text-foreground" href="/mealplan">
              Meal Plan
            </Link>
            <Link className="text-foreground" href="/subscribe">
              Subscribe
            </Link>
            {user?.imageUrl ? (
              <Avatar>
                <Link href="/profile">
                  <AvatarImage
                    src={user.imageUrl}
                    alt="User Avatar"
                    width={30}
                    height={30}
                  />
                </Link>
                <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
              </Avatar>
            ) : null}
            <SignOutButton>
              <Button
                variant={"destructive"}
                className="cursor-pointer transition-all"
              >
                Sign Out
              </Button>
            </SignOutButton>
          </SignedIn>

          {/* Sign Out Component from Clerk */}
          <SignedOut>
            <Link href={"/"}>Home</Link>
            <Link href={isSignedIn ? "/subscribe" : "/sign-up"}>Subscribe</Link>
            <Link href={"/sign-up"}>
              <Button className="bg-primary text-primary-foreground hover:brightness-95">
                Sign Up
              </Button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
