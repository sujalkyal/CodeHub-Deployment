"use client";
import axios from "axios";
import { useState } from "react";
import { UploadCloud, FileJson, Loader, Info, Code, CheckCircle, AlertCircle } from "lucide-react";

// --- Constants ---
const DIFFICULTY = ["EASY", "MEDIUM", "HARD"];
const TAGS = [
  "Array", "String", "Math", "Dynamic Programming", "Graph", "Tree", "Greedy",
  "Sorting", "Binary Search", "Hashing", "Bit Manipulation", "Stack", "Queue",
  "Heap", "Linked List", "Recursion", "Backtracking", "Two Pointers",
  "Sliding Window", "Prefix Sum", "Trie", "Segment Tree", "Disjoint Set",
  "BFS", "DFS", "Implementation", "Comparison", "Number Theory", "Loops",
  "Set", "Hash Map",
].filter((v, i, a) => a.findIndex(t => t.toLowerCase() === v.toLowerCase()) === i);

// --- Main Component ---
export default function ContributePage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    structure: "",
    inputFormat: "",
    outputFormat: "",
    constraints: "",
    sampleInput: "",
    sampleOutput: "",
    difficulty: "EASY",
    tags: [],
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Mock toast functionality
  const toast = {
    success: (msg) => setNotifications(prev => [...prev, { type: 'success', msg, id: Date.now() }]),
    error: (msg) => setNotifications(prev => [...prev, { type: 'error', msg, id: Date.now() }])
  };

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        tags: prev.tags.includes(value)
          ? prev.tags.filter((t) => t !== value)
          : [...prev.tags, value],
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFile = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
  if (!file) {
    toast.error("Please upload an input/output file.");
    return;
  }
  setLoading(true);
  try {
    const payload = { ...form, tags: form.tags };
    const data = new FormData();
    data.append("json", JSON.stringify(payload));
    data.append("input_output", file);
    console.log("[Contribute] Submitting problem data:", data);
    const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BOILERPLATE_API_URL || "http://localhost:4000/generate"}`,
        data
      );

    toast.success("Problem created! ID: " + res.data.problemId);

    setForm({
      title: "",
      description: "",
      structure: "",
      inputFormat: "",
      outputFormat: "",
      constraints: "",
      sampleInput: "",
      sampleOutput: "",
      difficulty: "EASY",
      tags: [],
    });
    setFile(null);
  } catch (err) {
    toast.error(err?.response?.data?.error || "Failed to create problem.");
  } finally {
    setLoading(false);
  }
};


  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 backdrop-blur-sm ${
              notif.type === 'success' 
                ? 'bg-emerald-900/90 border-emerald-400 text-emerald-100' 
                : 'bg-red-900/90 border-red-400 text-red-100'
            }`}
            onClick={() => removeNotification(notif.id)}
          >
            {notif.type === 'success' ? (
              <CheckCircle size={20} className="text-emerald-400" />
            ) : (
              <AlertCircle size={20} className="text-red-400" />
            )}
            <span className="font-medium">{notif.msg}</span>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/30 rounded-full mb-6">
            <Code className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Contribute a New Problem
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Share your coding challenge with the community and help others learn and grow.
          </p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="xl:col-span-2">
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Problem Details</h2>
                <p className="text-indigo-100 mt-1">Fill out all the required information below</p>
              </div>
              
              <div className="p-8">
                <div className="space-y-10">
                  {/* Basic Information */}
                  <FormSection title="Basic Information" icon="📝">
                    <div className="grid grid-cols-1 gap-6">
                      <FormInput 
                        label="Problem Title" 
                        name="title" 
                        value={form.title} 
                        onChange={handleChange} 
                        placeholder="e.g., Two Sum Problem" 
                        required 
                      />
                      <FormTextArea 
                        label="Problem Description" 
                        name="description" 
                        value={form.description} 
                        onChange={handleChange} 
                        placeholder="Provide a clear and detailed description of the problem. Explain what needs to be solved and any important context." 
                        required 
                        rows={4}
                      />
                      <FormTextArea 
                        label="Function/Class Structure" 
                        name="structure" 
                        value={form.structure} 
                        onChange={handleChange} 
                        placeholder="Define the function or class structure according to the guidelines" 
                        required 
                        rows={3}
                      />
                    </div>
                  </FormSection>

                  {/* Input & Output Specifications */}
                  <FormSection title="Input & Output Specifications" icon="🔄">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <FormInput 
                        label="Input Format" 
                        name="inputFormat" 
                        value={form.inputFormat} 
                        onChange={handleChange} 
                        placeholder="Describe the input format and structure" 
                        required 
                      />
                      <FormInput 
                        label="Output Format" 
                        name="outputFormat" 
                        value={form.outputFormat} 
                        onChange={handleChange} 
                        placeholder="Describe the expected output format" 
                        required 
                      />
                    </div>
                    <FormInput 
                      label="Constraints" 
                      name="constraints" 
                      value={form.constraints} 
                      onChange={handleChange} 
                      placeholder="e.g., 1 ≤ n ≤ 10^5, -10^9 ≤ values ≤ 10^9" 
                      required 
                    />
                  </FormSection>
                  
                  {/* Sample Test Case */}
                  <FormSection title="Sample Test Case" icon="🧪">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <FormTextArea 
                        label="Sample Input" 
                        name="sampleInput" 
                        value={form.sampleInput} 
                        onChange={handleChange} 
                        placeholder="nums = [2,7,11,15]&#10;target = 9" 
                        rows={4} 
                        required 
                      />
                      <FormTextArea 
                        label="Sample Output" 
                        name="sampleOutput" 
                        value={form.sampleOutput} 
                        onChange={handleChange} 
                        placeholder="[0,1]" 
                        rows={4} 
                        required 
                      />
                    </div>
                  </FormSection>

                  {/* Metadata */}
                  <FormSection title="Problem Metadata" icon="🏷️">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-3">
                          Difficulty Level
                        </label>
                        <select 
                          name="difficulty" 
                          value={form.difficulty} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-700/50 text-white font-medium backdrop-blur-sm"
                        >
                          {DIFFICULTY.map((d) => (
                            <option key={d} value={d} className="bg-slate-800">
                              {d.charAt(0) + d.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-3">
                          Test Cases File
                        </label>
                        <label 
                          htmlFor="file-upload" 
                          className={`w-full h-12 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 cursor-pointer transition-all backdrop-blur-sm ${
                            file 
                              ? 'border-emerald-400 bg-emerald-500/20' 
                              : 'border-slate-600 bg-slate-700/30 hover:border-indigo-400 hover:bg-indigo-500/20'
                          }`}
                        >
                          <UploadCloud size={20} className={file ? "text-emerald-400" : "text-slate-400"} />
                          <span className={`font-medium ${file ? "text-emerald-300" : "text-slate-300"}`}>
                            {file ? "File Selected" : "Upload JSON file"}
                          </span>
                        </label>
                        <input 
                          id="file-upload" 
                          type="file" 
                          accept=".json" 
                          onChange={handleFile} 
                          required 
                          className="hidden" 
                        />
                        {file && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/20 px-3 py-2 rounded-lg backdrop-blur-sm border border-emerald-500/30">
                            <FileJson size={16} />
                            <span className="font-medium">{file.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-4">
                        Problem Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TAGS.map((tag) => (
                          <label 
                            key={tag} 
                            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all border backdrop-blur-sm ${
                              form.tags.includes(tag) 
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25' 
                                : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:border-indigo-400 hover:bg-indigo-500/20'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              name="tags" 
                              value={tag} 
                              checked={form.tags.includes(tag)} 
                              onChange={handleChange} 
                              className="hidden" 
                            />
                            {tag}
                          </label>
                        ))}
                      </div>
                      {form.tags.length > 0 && (
                        <p className="mt-3 text-sm text-slate-400">
                          Selected {form.tags.length} tag{form.tags.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </FormSection>
                </div>

                {/* Submit Button */}
                <div className="mt-10 pt-8 border-t border-slate-200">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    onClick={handleSubmit}
                    className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading && <Loader className="animate-spin" size={24} />}
                    {loading ? "Creating Problem..." : "Submit Problem"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Guidelines */}
          <div className="xl:col-span-1">
            <div className="sticky top-8">
              <Guidelines />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---
const FormSection = ({ title, icon, children }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 pb-4 border-b border-slate-600/50">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
    <div className="space-y-6">{children}</div>
  </div>
);

const FormInput = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-300 mb-3">
      {label}
      {props.required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input 
      {...props} 
      className="w-full px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-700/50 text-white placeholder-slate-400 backdrop-blur-sm"
    />
  </div>
);

const FormTextArea = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-300 mb-3">
      {label}
      {props.required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <textarea 
      {...props} 
      rows={props.rows || 4} 
      className="w-full px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-700/50 text-white placeholder-slate-400 resize-none backdrop-blur-sm"
    />
  </div>
);

const Guidelines = () => (
  <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
      <div className="flex items-center gap-3">
        <Info className="text-white" size={24} />
        <h3 className="text-xl font-bold text-white">Guidelines</h3>
      </div>
    </div>
    
    <div className="p-6 space-y-6">
      <div>
        <h4 className="text-lg font-bold text-white mb-3">Structure Format</h4>
        <p className="text-slate-300 mb-4">
          Follow these precise rules for the "Function/Class Structure" field:
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <h5 className="font-semibold text-slate-200 mb-2">Functions:</h5>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/50 backdrop-blur-sm">
            <code className="text-sm text-slate-300 font-mono">
              Function: solve<br/>
              Input: integer n, string s<br/>
              Output: integer
            </code>
          </div>
        </div>
        
        <div>
          <h5 className="font-semibold text-slate-200 mb-2">Classes:</h5>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/50 backdrop-blur-sm">
            <code className="text-sm text-slate-300 font-mono">
              Class: Solution<br/>
              Methods:<br/>
              - twoSum<br/>
              Input: vector_integer nums, integer target<br/>
              Output: vector_integer
            </code>
          </div>
        </div>
        
        <div>
          <h5 className="font-semibold text-slate-200 mb-2">Vector Rules:</h5>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400 mb-2">1D vector - include size:</p>
              <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-500/30 backdrop-blur-sm">
                <code className="text-sm text-emerald-300 font-mono">
                  Input: integer n, vector_integer arr
                </code>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">2D vector - include dimensions:</p>
              <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-500/30 backdrop-blur-sm">
                <code className="text-sm text-emerald-300 font-mono">
                  Input: integer rows, integer cols, vector_vector_integer matrix
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-slate-600/50">
        <div className="flex items-start gap-3 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30 backdrop-blur-sm">
          <Info size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300 mb-1">Pro Tip</p>
            <p className="text-sm text-blue-200">
              Always test your structure format before submitting to ensure proper code generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);