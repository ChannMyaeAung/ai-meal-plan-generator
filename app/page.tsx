"use client";
import Image from "next/image";
import Link from "next/link";

import { easeInOut, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import Navbar from "@/components/navbar";

export default function Home() {
  return (
    <div className="px-4 py-8 sm:py-12 max-w-7xl mx-auto">
      <div className="relative mx-auto my-10 flex max-w-7xl flex-col items-center justify-center">
        <div className="px-4 py-10 md:py-20">
          <div className="pointer-events-none absolute inset-0 blur-3xl">
            <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-rose-200/40 dark:bg-rose-500/20" />
            <div className="absolute right-6 bottom-10 h-72 w-72 rounded-full bg-amber-200/40 dark:bg-amber-400/10" />
          </div>
          <h1 className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-slate-700 md:text-4xl lg:text-7xl dark:text-slate-300">
            {"AI-crafted weekly meal plans in minutes"
              .split(" ")
              .map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: "easeInOut",
                  }}
                  className="mr-2 inline-block"
                >
                  {word}
                </motion.span>
              ))}
          </h1>
          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
              delay: 0.8,
            }}
            className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400"
          >
            Feed your week with confidence using personalized nutrition goals,
            pantry-friendly ingredients, and AI that keeps variety, macros, and
            budget perfectly balanced.
          </motion.p>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
              delay: 1,
            }}
            className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/mealplan">
              <Button className="w-60 transform rounded-lg px-6 py-2 font-medium  transition-all duration-300 hover:bg-gray-800 dark:text-white dark:hover:bg-amber-800 cursor-pointer bg-amber-600 text-slate-900">
                Explore Now
              </Button>
            </Link>
            <Link href={"/subscribe"}>
              <Button className="w-60 transform rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-chart-5 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900 cursor-pointer">
                View Plans
              </Button>
            </Link>
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
              delay: 1.2,
            }}
            className="relative z-10 mt-20 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="w-full overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700">
              <Image
                src="/meal-hero.jpg"
                alt="Landing page preview"
                className="aspect-video h-auto w-full object-cover"
                height={1000}
                width={1000}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
