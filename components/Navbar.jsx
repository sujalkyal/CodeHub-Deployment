"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  // Effect to handle scroll detection for adding a shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    // Cleanup function to remove the event listener
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      // ✨ CHANGE: Navbar now has a permanent background and bottom border for separation.
      // The shadow appears on scroll for a subtle depth effect.
      className={`fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 transition-shadow duration-300 ${
        scrolled ? "shadow-lg" : ""
      }`}
    >
      {/* ✨ CHANGE: Increased vertical padding from py-4 to py-5 */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/landing" className="text-2xl font-extrabold tracking-tight text-slate-50">
          CODE<span className="text-indigo-400">HUB</span>
        </Link>
        {/* ✨ CHANGE: Increased spacing from space-x-6 to space-x-8 */}
        <div className="flex items-center space-x-8">
          <Link href="/contribute" className="hidden text-slate-300 hover:text-indigo-400 sm:block font-medium transition-colors">
            Contribute
          </Link>
          <Link href="/problems" className="hidden text-slate-300 hover:text-indigo-400 sm:block font-medium transition-colors">
            Problems
          </Link>
          
          <SignedIn>
            <div className="h-8 w-8">
              <UserButton afterSignOutUrl="/landing" />
            </div>
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              className="rounded-md bg-indigo-600 px-4 py-2 font-bold text-white transition-colors hover:bg-indigo-500"
            >
              Sign In
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
