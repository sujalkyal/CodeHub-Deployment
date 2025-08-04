"use client";

import Link from "next/link";
// Import icons to make the feature cards more visually appealing
import { Code, BookHeart, MessageSquareQuote } from "lucide-react";

export default function LandingPage() {
  return (
    // ✨ THEME CHANGE: New "dim" theme with a dark slate background
    <div className="min-h-screen bg-slate-900 text-slate-300">
      <main className="flex flex-col">
        {/* Hero Section */}
        <section className="flex flex-1 items-center justify-center px-4 py-24 md:px-8">
          <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
            {/* Left side: Text content */}
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-50 md:text-6xl lg:text-7xl">
                Welcome to <span className="text-indigo-400">CODEHUB</span>
              </h1>
              <p className="mb-10 mt-6 max-w-xl text-lg text-slate-400 md:text-xl">
                The ultimate platform for coding enthusiasts to solve, contribute, and discuss algorithmic problems. Sharpen your skills, challenge yourself, and join a vibrant community.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
                <Link
                  href="/problems"
                  // ✨ THEME CHANGE: Updated button styles for dark theme
                  className="rounded-md bg-indigo-600 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:bg-indigo-700 hover:shadow-indigo-500/40"
                >
                  Solve Problems
                </Link>
                <Link
                  href="/contribute"
                  // ✨ THEME CHANGE: Updated secondary button styles for dark theme
                  className="rounded-md bg-slate-800 px-8 py-3 text-lg font-bold text-slate-300 ring-1 ring-slate-700 transition-all duration-300 hover:bg-slate-700"
                >
                  Contribute Problem
                </Link>
              </div>
            </div>

            {/* Right side: Visual element */}
            <div className="hidden items-center justify-center md:flex">
              <img
                src="/globe.svg" 
                alt="Codehub Globe"
                // ✨ THEME CHANGE: Updated drop shadow to match new accent color
                className="h-96 w-96 object-contain drop-shadow-[0_0px_45px_rgba(129,140,248,0.3)]"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-slate-900 py-24 px-4 md:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-4 text-center text-4xl font-bold text-slate-50">Everything You Need to Excel</h2>
            <p className="mb-12 text-center text-lg text-slate-400">One platform, endless possibilities.</p>
            
            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature Card 1: Solve */}
              {/* ✨ THEME CHANGE: Updated card styles for the dark theme */}
              <div className="transform rounded-xl border border-slate-800 bg-slate-800/40 p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500/30 hover:shadow-indigo-500/10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400">
                  <Code size={24} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-50">Solve</h3>
                <p className="text-slate-400">Tackle a wide range of algorithmic and data structure problems, from easy to hard, and track your progress.</p>
              </div>

              {/* Feature Card 2: Contribute */}
              <div className="transform rounded-xl border border-slate-800 bg-slate-800/40 p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500/30 hover:shadow-indigo-500/10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400">
                  <BookHeart size={24} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-50">Contribute</h3>
                <p className="text-slate-400">Share your own problems with the community, help others learn, and get recognized for your contributions.</p>
              </div>

              {/* Feature Card 3: Discuss */}
              <div className="transform rounded-xl border border-slate-800 bg-slate-800/40 p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500/30 hover:shadow-indigo-500/10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400">
                  <MessageSquareQuote size={24} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-50">Discuss</h3>
                <p className="text-slate-400">Engage in discussions, share solutions, and learn new techniques from fellow coders worldwide.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-6 text-center text-slate-500">
        © {new Date().getFullYear()} CODEHUB. All rights reserved.
      </footer>
    </div>
  );
}