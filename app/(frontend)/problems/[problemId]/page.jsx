"use client";
/**
 * ProblemSolvePage - A modern, professional UI for solving coding problems.
 *
 * v6: Redesigned problem description panel.
 * - Created a more structured and readable layout for the description, examples, and constraints.
 * - Added sample cases to the description panel.
 */

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { CheckCircle2, XCircle, Loader, ChevronDown, ChevronRight, AlertTriangle, Clock, Server } from "lucide-react";

// --- Configuration & Helpers ---
const LANGUAGES = [
  { name: "C++", id: 54, monacoName: "cpp" },
  { name: "Java", id: 62, monacoName: "java" },
  { name: "Python", id: 71, monacoName: "python" },
];

function decodeBase64(str) {
  if (typeof window === 'undefined' || !str) return "";
  try { return atob(str); } catch { return "Error decoding base64 string."; }
}

// --- UI Components ---
function TestCaseResult({ testCase, result }) {
  const [isOpen, setIsOpen] = useState(false);

  const statusMap = {
    3: { text: "Accepted", color: "text-green-400", Icon: CheckCircle2 },
    4: { text: "Wrong Answer", color: "text-red-400", Icon: XCircle },
    5: { text: "Time Limit Exceeded", color: "text-red-400", Icon: Clock },
    6: { text: "Compilation Error", color: "text-yellow-400", Icon: AlertTriangle },
  };
  const defaultStatus = { text: "Error", color: "text-red-400", Icon: XCircle };
  const statusInfo = result ? (statusMap[result.statusId] || { text: result.statusDescription, ...defaultStatus }) : null;

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 mb-3">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left">
        <div className="flex items-center gap-3">
          {statusInfo ? <statusInfo.Icon className={`${statusInfo.color} w-5 h-5`} /> : <Loader className="w-5 h-5 text-slate-500 animate-spin" />}
          <span className="font-semibold text-slate-300">
            {testCase.isSample ? `Sample Test Case` : `Test Case #${result.id}`}
          </span>
          {statusInfo && <span className={`font-bold ${statusInfo.color}`}>{statusInfo.text}</span>}
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-700 bg-slate-900/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {testCase.input && <div>
              <h4 className="text-indigo-400 font-semibold mb-2">Input</h4>
              <pre className="text-slate-300 whitespace-pre-wrap bg-slate-800 p-3 rounded">{testCase.input}</pre>
            </div>}
            {testCase.output && <div>
              <h4 className="text-indigo-400 font-semibold mb-2">Expected Output</h4>
              <pre className="text-slate-300 whitespace-pre-wrap bg-slate-800 p-3 rounded">{testCase.output}</pre>
            </div>}
            {result?.stdout && (
              <div className="md:col-span-2">
                <h4 className="text-indigo-400 font-semibold mb-2">Your Output</h4>
                <pre className="text-slate-300 whitespace-pre-wrap bg-slate-800 p-3 rounded">{decodeBase64(result.stdout)}</pre>
              </div>
            )}
             {result?.stderr && (
              <div className="md:col-span-2">
                <h4 className="text-yellow-400 font-semibold mb-2">Stderr</h4>
                <pre className="text-yellow-300 whitespace-pre-wrap bg-slate-800 p-3 rounded">{decodeBase64(result.stderr)}</pre>
              </div>
            )}
            {result?.compileOutput && (
              <div className="md:col-span-2">
                <h4 className="text-yellow-400 font-semibold mb-2">Compile Output</h4>
                <pre className="text-yellow-300 whitespace-pre-wrap bg-slate-800 p-3 rounded">{decodeBase64(result.compileOutput)}</pre>
              </div>
            )}
             {result?.message && (
                <div className="md:col-span-2">
                    <h4 className="text-indigo-400 font-semibold mb-2">Message</h4>
                    <pre className="text-slate-300 whitespace-pre-wrap bg-slate-800 p-3 rounded">{decodeBase64(result.message)}</pre>
                </div>
            )}
          </div>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-700/50">
            {result?.time && <div className="flex items-center gap-2 text-sm text-slate-400"><Clock size={14} /> Time: {result.time}s</div>}
            {result?.memory && <div className="flex items-center gap-2 text-sm text-slate-400"><Server size={14} /> Memory: {result.memory} KB</div>}
          </div>
        </div>
      )}
    </div>
  );
}


export default function ProblemSolvePage() {
  // --- State Management ---
  const { problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [runResult, setRunResult] = useState(null);
  const [runTestCases, setRunTestCases] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  
  const pollingRef = useRef();

  // --- Data Fetching and Setup ---
  useEffect(() => {
    axios.get(`/api/problems/${problemId}`)
      .then((res) => {
        setProblem(res.data);
        const defaultBoiler = res.data.boilerplates.find(b => b.language.name.toLowerCase() === LANGUAGES[0].name.toLowerCase());
        setCode(defaultBoiler?.code || "");
      })
      .catch((err) => setError("Problem not found or failed to load."))
      .finally(() => setLoading(false));
  }, [problemId]);

  useEffect(() => {
    if (!problem) return;
    const boiler = problem.boilerplates.find(b => b.language.name.toLowerCase() === selectedLang.name.toLowerCase());
    setCode(boiler?.code || `// Boilerplate for ${selectedLang.name} not found.`);
  }, [selectedLang, problem]);

  // --- Original Polling Logic ---
  const pollRun = (runId, testCases) => {
    let timeoutId;
    setRunTestCases(testCases);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/api/run/${runId}`);
        if (res.data.status === "Completed" || res.data.results) {
          clearInterval(pollingRef.current);
          clearTimeout(timeoutId);
          setRunResult({ ...res.data });
          setIsRunning(false);
        }
      } catch (err) {
        clearInterval(pollingRef.current);
        clearTimeout(timeoutId);
        setRunResult({ error: "Run failed during polling." });
        setIsRunning(false);
      }
    }, 3000);
    timeoutId = setTimeout(() => {
      clearInterval(pollingRef.current);
      setRunResult({ error: "Run timed out. Please check for infinite loops." });
      setIsRunning(false);
    }, 30000);
  };

  const pollSubmit = (submitId) => {
    let timeoutId;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/api/submit/${submitId}`);
        if (res.data.statusId === 3 || res.data.statusId === 4) { // Accepted or Wrong Answer
          clearInterval(pollingRef.current);
          clearTimeout(timeoutId);
          setSubmitResult(res.data);
          setIsSubmitting(false);
        }
      } catch (err) {
        clearInterval(pollingRef.current);
        clearTimeout(timeoutId);
        setSubmitResult({ error: "Submit failed during polling." });
        setIsSubmitting(false);
      }
    }, 3000);
    timeoutId = setTimeout(() => {
      clearInterval(pollingRef.current);
      setSubmitResult({ error: "Submission timed out." });
      setIsSubmitting(false);
    }, 600000);
  };

  // --- Original Action Handlers ---
  const handleRun = async () => {
    setIsRunning(true);
    setRunResult(null);
    setSubmitResult(null); // Clear previous submit results
    setRunTestCases(null);

    try {
        const langBoiler = problem.boilerplates.find(b => b.language.id === selectedLang.id);
        const res = await axios.post("/api/run", { 
          //  userId: "user_30e917Pr2xYTOEf2JV5lQe7R7NC", 
            problemSlug: problemId, 
            languageId: langBoiler.language.id, 
            code 
        });
        pollRun(res.data.runId, res.data.testCases);
    } catch (e) {
        setRunResult({ error: "Failed to initiate run." });
        setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);
    setRunResult(null); // Clear previous run results

    try {
        const langBoiler = problem.boilerplates.find(b => b.language.id === selectedLang.id);
        const res = await axios.post("/api/submit", { 
           // userId: "1", 
            problemSlug: problemId, 
            languageId: langBoiler.language.id, 
            code 
        });
        pollSubmit(res.data.submissionId);
    } catch (e) {
        setSubmitResult({ error: "Failed to initiate submission." });
        setIsSubmitting(false);
    }
  };

  // --- Main Render ---
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white"><Loader className="w-10 h-10 animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-slate-900 text-red-500">{error}</div>;

  return (
    <div className="h-screen bg-slate-900 text-slate-300 pt-24">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel: Problem Description */}
        <Panel defaultSize={50} minSize={30}>
          <div className="p-8 overflow-y-auto h-full bg-slate-900">
            <h1 className="text-3xl font-bold text-slate-50 mb-2">{problem.title}</h1>
            <div className="flex gap-2 mb-8">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${problem.difficulty === "EASY" ? "bg-green-600/10 text-green-400" : problem.difficulty === "MEDIUM" ? "bg-yellow-600/10 text-yellow-400" : "bg-red-600/10 text-red-400"}`}>{problem.difficulty}</span>
            </div>
            
            {/* ✨ UI CHANGE: New structured layout for problem description */}
            <div className="space-y-8 text-slate-300">
              <p className="leading-relaxed">{problem.description}</p>
              
              

              {/* Input/Output Format */}
              <div>
                <h3 className="font-semibold text-slate-50 text-lg mb-2">Input Format</h3>
                <p className="leading-relaxed">{problem.inputFormat}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-50 text-lg mb-2">Output Format</h3>
                <p className="leading-relaxed">{problem.outputFormat}</p>
              </div>

              {/* Constraints */}
              <div>
                <h3 className="font-semibold text-slate-50 text-lg mb-2">Constraints</h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  {problem.constraints.split('\n').map((line, index) => (
                    <li key={index}><code className="text-sm">{line}</code></li>
                  ))}
                </ul>
              </div>

              {/* Sample Case */}
              <div>
                <h3 className="font-semibold text-slate-50 text-lg mb-2">Example</h3>
                <div className="bg-slate-800/70 p-4 rounded-md space-y-2 text-sm font-mono">
                  <p><strong className="text-slate-400">Input:</strong> {problem.sampleInput}</p>
                  <p><strong className="text-slate-400">Output:</strong> {problem.sampleOutput}</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>
        
        <PanelResizeHandle className="w-2.5 bg-slate-800 data-[resize-handle-state=hover]:bg-indigo-500 data-[resize-handle-state=drag]:bg-indigo-500 transition-colors duration-200" />

        {/* Right Panel: Editor and Console */}
        <Panel defaultSize={50} minSize={30}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={65} minSize={25} className="flex flex-col">
              <div className="flex-grow relative">
                <Editor
                  height="100%"
                  language={selectedLang.monacoName}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on" }}
                />
              </div>
            </Panel>
            <PanelResizeHandle className="h-2.5 bg-slate-800 data-[resize-handle-state=hover]:bg-indigo-500 data-[resize-handle-state=drag]:bg-indigo-500 transition-colors duration-200" />
            <Panel defaultSize={35} minSize={15}>
                <div className="h-full flex flex-col bg-slate-900/70">
                    <div className="flex items-center justify-between p-3 bg-slate-900 border-b border-slate-700">
                        <select
                            className="bg-slate-800 text-white px-3 py-1.5 rounded-md border border-slate-700 cursor-pointer"
                            value={selectedLang.name}
                            onChange={(e) => setSelectedLang(LANGUAGES.find((l) => l.name === e.target.value))} >
                            {LANGUAGES.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                        </select>
                        <div className="flex gap-4">
                            <button onClick={handleRun} disabled={isRunning || isSubmitting} className="flex items-center gap-2 bg-slate-700 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-slate-600 transition disabled:opacity-60 disabled:cursor-not-allowed">
                                {isRunning && <Loader className="w-4 h-4 animate-spin" />}
                                {isRunning ? "Running..." : "Run Code"}
                            </button>
                            <button onClick={handleSubmit} disabled={isSubmitting || isRunning} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-md font-bold hover:bg-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed">
                                {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                    <div className="flex-grow p-5 overflow-y-auto">
                        {(!runResult && !submitResult && (isRunning || isSubmitting)) && (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <Loader className="w-6 h-6 animate-spin mr-2" />
                                {isRunning ? 'Running against sample cases...' : 'Submitting for final evaluation...'}
                            </div>
                        )}
                        {runResult && (
                           <div>
                            <h3 className="font-bold text-slate-100 mb-4">Run Results</h3>
                            {runResult.error && <p className="text-red-400">{runResult.error}</p>}
                            {runTestCases?.map(tc => {
                               const resultForCase = runResult.results?.find(r => r.id === tc.submissionTestCaseResultsId);
                               return <TestCaseResult key={tc.submissionTestCaseResultsId} testCase={{...tc, isSample: true}} result={resultForCase} />
                            })}
                           </div>
                        )}
                         {submitResult && (
                           <div>
                            {submitResult.error ? <p className="text-red-400">{submitResult.error}</p> : 
                            (<>
                                <div className="mb-6">
                                    <span className="font-bold text-lg text-slate-100">Overall Status: </span>
                                    <span className={`font-bold ${submitResult.statusId === 3 ? "text-green-400" : "text-red-400"}`}>
                                        {submitResult.statusDescription || "Processing"}
                                    </span>
                                    <span className="ml-4 text-sm text-gray-300">
                                        ({submitResult.passedCount} / {submitResult.totalTestCases} Passed)
                                    </span>
                                </div>
                                {submitResult.testCaseResults?.map(tc =>
                                    <TestCaseResult key={tc.id} testCase={{ input: "", output: "" }} result={tc} />
                                )}
                            </>)}
                           </div>
                        )}
                    </div>
                </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
