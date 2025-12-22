import React from "react";
import { AnimatedTestimonials } from "./ui/animated-testimonials";

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote:
        "Eat This Much not only helps me hit my macros, but also makes sure I'm not eating the same bland thing every day. I've lost 35 lbs over the past year, and with ETM, I'm eating and performing better than ever.",
      name: "Sarah Chen",
      designation: "Product Manager at TechFlow",
      src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "I found out about Eat This Much and lost 32 lbs in 6 months! Now I'm a fit over 50 female in amazing condition, and this site is what I refer to several times a day to ensure I eat properly and manage my macros.",
      name: "Michael Rodriguez",
      designation: "Doctor at HealthPlus",
      src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "After being diagnosed with sleep apnea and high blood pressure, I picked up this app and followed the nutrition plan religiously. Since then I've lost over 40lbs. I still have 20lbs or so to go before I get to where I really want to be, but I'm thankful for the life this app has helped me achieve.",
      name: "Emily Watson",
      designation: "Operations Director at CloudScale",
      src: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "Outstanding support and robust features. It's rare to find a product that delivers on all its promises.",
      name: "James Kim",
      designation: "Engineering Lead at DataPro",
      src: "https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "I started tracking my weight in April when I was 184lbs. In May I signed up for Eat This Much and immediately appreciated being able to just cook the menu and not worry about what to have for dinner. By November I was down to 155lbs and I still use Eat This Much today!.",
      name: "Lisa Thompson",
      designation: "VP of Technology at FutureNet",
      src: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];
  return <AnimatedTestimonials testimonials={testimonials} />;
};

export default TestimonialsSection;
