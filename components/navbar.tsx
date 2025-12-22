"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  HeartPlus,
  Home,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  Sidebar,
  SquareMenu,
  Sun,
  User,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { SignedIn, SignedOut, SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";

const Navbar = () => {
  const { setTheme } = useTheme();
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <nav className="border-b border-b-border">
      <div className="mx-auto flex max-h-30 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href={"/"} className="flex items-center self-start">
          <Image
            src={"/logo.png"}
            alt="logo"
            width={156}
            height={156}
            className="h-40 w-auto object-contain"
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <Link href={"/"} className=" items-center gap-2 hidden sm:flex">
            <Home />
            <span>Home</span>
          </Link>

          {/* THEME MENU */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
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

          <SignedIn>
            {/* USER MENU */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="cursor-pointer">
                  {user && user.imageUrl ? (
                    <AvatarImage src={user.imageUrl} />
                  ) : (
                    <AvatarFallback>UN</AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={10}>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={"/profile"} className="flex gap-1">
                    <User className="h-[1.2rem] w-[1.2rem] mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  <LogOut className="h-[1.2rem] w-[1.2rem] mr-2" />
                  <SignOutButton>Sign Out</SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={"outline"} size={"icon"}>
                  <SquareMenu />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={10}>
                <DropdownMenuLabel>Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={"/profile"} className="flex gap-1">
                    <User className="h-[1.2rem] w-[1.2rem] mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={"/mealplan"} className="flex gap-1">
                    <UtensilsCrossed className="h-[1.2rem] w-[1.2rem] mr-2" />
                    Generate Meal Plans (subscription required)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={"/subscribe"} className="flex gap-1">
                    <HeartPlus className="h-[1.2rem] w-[1.2rem] mr-2" />
                    Subscribe
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  <LogOut className="h-[1.2rem] w-[1.2rem] mr-2" />
                  <SignOutButton>Sign Out</SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          <SignedOut>
            <Link href={"/sign-in"}>
              <Button>Sign In</Button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
