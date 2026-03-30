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
  HeartPlus,
  Home,
  LogOut,
  Moon,
  Sun,
  User,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { SignedIn, SignedOut, SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/mealplan", label: "Meal Plans", icon: UtensilsCrossed },
  { href: "/subscribe", label: "Pricing", icon: HeartPlus },
];

const Navbar = () => {
  const { setTheme } = useTheme();
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : (user?.firstName?.[0] ?? "U");

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.png"
            alt="AI Meal Plan Generator"
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Center nav — visible on md+ when signed in */}
        <SignedIn>
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </SignedIn>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
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

          {/* Signed-in: single avatar dropdown with full navigation */}
          <SignedIn>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-2 ring-transparent hover:ring-primary/40 transition-all focus-visible:outline-none focus-visible:ring-primary/60">
                  <Avatar className="h-9 w-9 cursor-pointer">
                    {user?.imageUrl ? (
                      <AvatarImage
                        src={user.imageUrl}
                        alt={user.firstName ?? "User"}
                      />
                    ) : (
                      <AvatarFallback className="text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={10} className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Mobile nav links */}
                <div className="md:hidden">
                  {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" asChild>
                  <SignOutButton>
                    <button className="flex w-full items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          {/* Signed-out: Sign In button */}
          <SignedOut>
            <Link href="/sign-in">
              <Button size="sm">Sign In</Button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
