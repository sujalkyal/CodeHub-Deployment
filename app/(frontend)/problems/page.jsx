"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { ChevronLeft, ChevronRight, TriangleAlert, SearchX, Search } from "lucide-react";

// --- Helper Components ---

// A single problem row component with the new theme
const ProblemRow = ({ problem, index }) => {
  const difficultyStyles = {
    EASY: "bg-green-600/10 text-green-400",
    MEDIUM: "bg-yellow-600/10 text-yellow-400",
    HARD: "bg-red-600/10 text-red-400",
  };
  const style = difficultyStyles[problem.difficulty] || {};

  return (
    <Link href={`/problems/${problem.slug}`} passHref>
      <div
        className="group grid cursor-pointer grid-cols-12 items-center gap-4 rounded-lg border border-slate-800 bg-slate-800/40 p-4 transition-all duration-300 hover:border-indigo-500/30 hover:bg-slate-800 animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="col-span-12 md:col-span-8">
          <p className="font-semibold text-slate-200 transition-colors group-hover:text-indigo-400">
            {problem.title}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {problem.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 md:text-right">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>
                {problem.difficulty}
            </span>
        </div>
      </div>
    </Link>
  );
};

// Skeleton loader with the new theme
const SkeletonLoader = () => (
  <div className="space-y-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="h-24 animate-pulse rounded-lg border border-slate-800 bg-slate-800/40 p-4">
        <div className="mb-4 h-6 w-3/4 rounded bg-slate-700"></div>
        <div className="flex gap-2">
          <div className="h-4 w-20 rounded bg-slate-700"></div>
          <div className="h-4 w-24 rounded bg-slate-700"></div>
        </div>
      </div>
    ))}
  </div>
);

// --- Main Component ---

export default function ProblemsListPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  // ✨ FIX: State to track if the component has mounted on the client
  const [hasMounted, setHasMounted] = useState(false);

  const fetchProblems = useCallback(() => {
    setLoading(true);
    setError(null);
    axios.get("/api/problems/getAllProblem")
      .then((res) => {
        setProblems(res.data);
      })
      .catch((err) => {
        setError("Failed to fetch problems. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchProblems();
    // ✨ FIX: Set mounted state to true only on the client
    setHasMounted(true);
  }, [fetchProblems]);

  const filteredProblems = problems
    .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(p => selectedDifficulty ? p.difficulty === selectedDifficulty : true)
    .filter(p => selectedTag ? p.tags.includes(selectedTag) : true);

  const paginated = filteredProblems.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredProblems.length / pageSize);
  const allTags = Array.from(new Set(problems.flatMap((p) => p.tags || [])));

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const renderContent = () => {
    if (loading) return <SkeletonLoader />;
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg bg-slate-800/60 p-10 text-center">
          <TriangleAlert className="mb-4 h-12 w-12 text-red-500" />
          <h3 className="text-xl font-semibold text-slate-100">An Error Occurred</h3>
          <p className="text-red-400">{error}</p>
          <button onClick={fetchProblems} className="mt-6 rounded-md bg-indigo-600 px-5 py-2 font-semibold text-white transition-transform hover:scale-105">
            Try Again
          </button>
        </div>
      );
    }
    if (paginated.length > 0) {
      return (
        <>
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 mb-2 text-sm font-semibold text-slate-500">
            <div className="col-span-8">TITLE</div>
            <div className="col-span-4 text-right">DIFFICULTY</div>
          </div>
          <div className="space-y-4">
            {paginated.map((problem, index) => (
              <ProblemRow key={problem.id} problem={problem} index={index} />
            ))}
          </div>
        </>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-slate-800/60 p-10 text-center">
        <SearchX className="mb-4 h-12 w-12 text-slate-500" />
        <h3 className="text-xl font-semibold text-slate-100">No Problems Found</h3>
        <p className="text-slate-400">Try adjusting your search or filters.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 px-4 pt-28 pb-12 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-50 md:text-5xl">Problem Set</h1>
        <p className="mt-4 text-lg text-slate-400">Find your next challenge.</p>
        
        {/* ✨ FIX: Conditionally render the filter section only on the client */}
        {hasMounted && (
          <div className="my-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text"
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => handleFilterChange(setSearchQuery)(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 p-1">
                {["", "EASY", "MEDIUM", "HARD"].map(difficulty => (
                  <button
                    key={difficulty || "ALL"}
                    onClick={() => handleFilterChange(setSelectedDifficulty)(difficulty)}
                    className={`w-full rounded px-3 py-1.5 text-sm font-semibold transition-colors ${selectedDifficulty === difficulty ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-700"}`}
                  >
                    {difficulty || "All"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleFilterChange(setSelectedTag)("")} className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${!selectedTag ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                All Tags
              </button>
              {allTags.map((tag) => (
                <button key={tag} onClick={() => handleFilterChange(setSelectedTag)(tag)} className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${selectedTag === tag ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {renderContent()}

        {/* Pagination */}
        {totalPages > 1 && !loading && !error && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button className="flex cursor-pointer items-center gap-2 rounded-md bg-slate-800 px-4 py-2 font-semibold text-slate-300 transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="font-medium text-slate-400">Page {page} of {totalPages}</span>
            <button className="flex cursor-pointer items-center gap-2 rounded-md bg-slate-800 px-4 py-2 font-semibold text-slate-300 transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
