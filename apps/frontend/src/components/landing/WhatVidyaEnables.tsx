import { NativeSelect } from '@/components/ui/native-select';
import React, { useState } from "react";
import {
  Search,
  LineChart,
  Sparkles,
  CheckSquare,
  ChevronRight,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  name: string;
  grade: string;
  status: "Strong Grip" | "Needs Practice" | "Critical Support";
  gap: string;
  rollNo: string;
  marks: string;
  avatarBg: string;
}

export default function WhatVidyaEnables() {
  // Card 1: Trends Playground
  const [trendMetric, setTrendMetric] = useState<"accuracy" | "distribution" | "gaps">("accuracy");
  const [selectedClass, setSelectedClass] = useState<"10B" | "10A" | "9C">("10B");

  // Card 2: Student Registry
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "Strong Grip" | "Needs Practice" | "Critical Support">("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("Aarav Sharma");

  // Card 3: Rubric Playground
  const [activeFeedbackLine, setActiveFeedbackLine] = useState<number>(0);
  const [approvedState, setApprovedState] = useState<{ [key: number]: boolean }>({
    0: true,
    1: false,
    2: false
  });

  // Card 4: Board Standard Selector
  const [activeBoard, setActiveBoard] = useState<"cbse" | "icse" | "ib">("cbse");
  const [complianceChecks, setComplianceChecks] = useState({
    nep2020: true,
    competencyBased: true,
    rubricMatched: true,
    formativeChecked: false
  });

  const students: Student[] = [
    { name: "Aarav Sharma", grade: "A (95%)", status: "Strong Grip", gap: "None", rollNo: "Roll: #12", marks: "95/100", avatarBg: "bg-emerald-50 text-emerald-700" },
    { name: "Ananya Saxena", grade: "B+ (88%)", status: "Needs Practice", gap: "Parallel Ohm's current split", rollNo: "Roll: #08", marks: "88/100", avatarBg: "bg-amber-50 text-amber-700" },
    { name: "Kunal Verma", grade: "C (74%)", status: "Needs Practice", gap: "Resistor calculation steps", rollNo: "Roll: #21", marks: "74/100", avatarBg: "bg-amber-50 text-amber-700" },
    { name: "Diya Mehra", grade: "A- (91%)", status: "Strong Grip", gap: "None", rollNo: "Roll: #15", marks: "91/100", avatarBg: "bg-emerald-50 text-emerald-700" },
    { name: "Rishabh Goel", grade: "D (54%)", status: "Critical Support", gap: "Basic voltage ratio law", rollNo: "Roll: #34", marks: "54/100", avatarBg: "bg-rose-50 text-rose-700" },
    { name: "Meera Nair", grade: "A (96%)", status: "Strong Grip", gap: "None", rollNo: "Roll: #02", marks: "96/100", avatarBg: "bg-emerald-50 text-emerald-700" },
    { name: "Ishaan Jha", grade: "B (82%)", status: "Needs Practice", gap: "Fractions simplification rule", rollNo: "Roll: #19", marks: "82/100", avatarBg: "bg-amber-50 text-amber-700" },
    { name: "Pooja Hegde", grade: "B+ (86%)", status: "Needs Practice", gap: "Unit labels for acceleration", rollNo: "Roll: #05", marks: "86/100", avatarBg: "bg-amber-50 text-amber-700" },
    { name: "Kabir Das", grade: "C- (68%)", status: "Critical Support", gap: "Difference of vector vs scalar", rollNo: "Roll: #29", marks: "68/100", avatarBg: "bg-rose-50 text-rose-700" },
    { name: "Rohan Kapoor", grade: "A+ (98%)", status: "Strong Grip", gap: "None", rollNo: "Roll: #11", marks: "98/100", avatarBg: "bg-emerald-50 text-emerald-700" }
  ];

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || s.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const studentDetail = students.find(s => s.name === selectedStudent) || students[0];

  const gradingLines = [
    {
      text: "1. V = I × R. In a parallel circuit loop, voltage is identical across all resistive elements.",
      feedback: "Correct. Parallel branches maintain equipotential criteria. Excellent terminology representation.",
      score: "+4 points (Full score)",
      status: "correct"
    },
    {
      text: "2. Therefore equivalent resistance (R_eq) equals R1 + R2 + R3 in this parallel mesh.",
      feedback: "Incorrect formulas used. Parallel R_eq requires reciprocal sum rule: 1/R_eq = Σ(1/Ri).",
      score: "+0 points (Formula misapplication)",
      status: "incorrect"
    },
    {
      text: "3. Heat generated is given by H = I²Rt. Since R is divided, warmth output rises.",
      feedback: "Partially correct rationale. Heat drops as total dynamic resistance drops if source supply remains constant.",
      score: "+1.5 points (Partial step credit)",
      status: "partial"
    },
  ];

  // Helper calculation for compliance progress meter
  const getCompliancePercentage = () => {
    const activeCount = Object.values(complianceChecks).filter(Boolean).length;
    return Math.round((activeCount / 4) * 100);
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "Strong Grip": return "text-emerald-700 bg-emerald-50 border-emerald-100";
      case "Needs Practice": return "text-amber-700 bg-amber-50 border-amber-100";
      case "Critical Support": return "text-rose-700 bg-rose-50 border-rose-100";
      default: return "text-gray-700 bg-gray-50 border-gray-100";
    }
  };

  return (
    <section className="py-24 bg-[#fdfdfc] border-b border-[#f3ede4] relative overflow-hidden" id="features">
      {/* Absolute high-design grid backgrounds */}
      <div className="absolute top-[20%] right-[-100px] w-[500px] h-[500px] rounded-full bg-orange-50/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-150px] w-[600px] h-[600px] rounded-full bg-stone-100/30 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Core Narrative Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-widest text-[#e05934] uppercase bg-orange-50 border border-orange-100/60 mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#e05934]" /> Core Modules
          </span>
          <h2 className="font-display font-medium text-3xl sm:text-4xl text-gray-900 tracking-tight leading-tight">
            What VidyaAI Enables
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 max-w-xl mx-auto leading-relaxed">
            A state-of-the-art framework crafted to automate subjective exams with curriculum-aligned rubrics, transparent insights, and zero setup delays.
          </p>
        </div>

        {/* Dynamic Bento Box Matrix Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">

          {/* ================= CARD 1: Turn Data into Actionable Insights ================= */}
          <div className="bg-white border border-[#f3ede4] rounded-2xl p-6 sm:p-8 flex flex-col justify-start h-full items-stretch shadow-2xs hover:shadow-xs transition-shadow duration-300 relative overflow-hidden group">
            <div className="mb-6 flex-grow-0">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-orange-50 text-[#e05934] rounded-xl inline-block mb-4 border border-orange-100/30">
                  <LineChart className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-[#e05934]/90 bg-[#e05934]/5 px-2.5 py-1 rounded-full border border-[#e05934]/10">
                  Interactive Analytics
                </span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-gray-900 leading-snug">
                Turn Data into Actionable Insights
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Visualize learning trends filterable by class sections. Track accuracy ratios, grading lag parameters, and instantly highlight unaddressed curriculum blocks.
              </p>
            </div>

            {/* Simulated Live Dashboard Container */}
            <div className="bg-[#fcfbf9] rounded-xl border border-[#f3ede4] p-5 flex-1 flex flex-col justify-between mt-5">

              {/* Dashboard Internal Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f3ede4] pb-3 mb-4">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#e05934]" />
                  <span className="text-[11px] font-mono font-bold text-gray-800 uppercase">Class Diagnostics</span>
                </div>

                {/* Sub Selector widgets */}
                <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-[10px] font-medium border border-stone-200">
                  {(["10B", "10A", "9C"] as const).map((cl) => (
                    <button
                      key={cl}
                      onClick={() => setSelectedClass(cl)}
                      className={`px-2 py-1 rounded-md transition-all ${selectedClass === cl
                          ? "bg-white text-gray-900 shadow-3xs font-bold"
                          : "text-gray-400 hover:text-gray-700"
                        }`}
                    >
                      Class {cl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle metric views */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { id: "accuracy", label: "Accuracy Index", val: selectedClass === "10B" ? "82.5%" : selectedClass === "10A" ? "88%" : "69%" },
                  { id: "distribution", label: "Graded Turnaround", val: "12 mins" },
                  { id: "gaps", label: "Feedback Gaps", val: selectedClass === "10B" ? "2 Active" : selectedClass === "10A" ? "0 Clean" : "5 Active" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTrendMetric(tab.id as any)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${trendMetric === tab.id
                        ? "bg-white border-[#e05934] shadow-3xs"
                        : "bg-transparent border-[#f3ede4] hover:bg-stone-50"
                      }`}
                  >
                    <span className="text-[9px] font-mono text-gray-400 uppercase block">{tab.label}</span>
                    <span className="font-display font-bold text-xs sm:text-sm text-gray-900 block mt-1 tracking-tight">{tab.val}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Simulated Line or Bar graphs using layout animate components */}
              <div className="bg-white rounded-lg p-3 border border-gray-100 h-28 flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {trendMetric === "accuracy" && (
                    <motion.div
                      key="accuracy-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center text-[10px] text-gray-450 font-mono">
                        <span>Electricity Test Timeline</span>
                        <span className="text-emerald-600 font-bold">Standard average: +12% vs last term</span>
                      </div>

                      {/* Interactive Visual Graph representation */}
                      <div className="flex items-end justify-between h-14 px-1 gap-3 pt-1">
                        {[
                          { week: "W1", percent: "42%", heightVal: selectedClass === "10B" ? 42 : 55 },
                          { week: "W2", percent: "58%", heightVal: selectedClass === "10B" ? 58 : 65 },
                          { week: "W3", percent: "72%", heightVal: selectedClass === "10B" ? 72 : 75 },
                          { week: "W4", percent: selectedClass === "10B" ? "82.5%" : selectedClass === "10A" ? "88%" : "69%", heightVal: selectedClass === "10B" ? 82.5 : selectedClass === "10A" ? 88 : 69 },
                        ].map((bar, idx) => (
                          <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full">
                            <span className="text-[8px] font-mono text-[#e05934] font-semibold mb-0.5 leading-none">{bar.percent}</span>
                            <div className="w-full bg-orange-50/50 rounded-t-xs border border-orange-100/10 h-7 overflow-hidden flex items-end">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${bar.heightVal}%` }}
                                className="w-full bg-orange-100/90 hover:bg-[#e05934]/90 transition-all cursor-pointer"
                              />
                            </div>
                            <span className="text-[7.5px] text-gray-400 font-mono mt-0.5 leading-none">{bar.week}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {trendMetric === "distribution" && (
                    <motion.div
                      key="duration-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col justify-center"
                    >
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-mono">CYCLE EFFICIENCY</p>
                        <h4 className="text-xl sm:text-2xl font-display font-bold text-emerald-600 mt-1">12 Minute Sync Rate</h4>
                        <p className="text-[10px] text-gray-500 max-w-[280px] mx-auto mt-1 leading-snug">
                          98.4% faster than standard offline manual homework processing workflows.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {trendMetric === "gaps" && (
                    <motion.div
                      key="gaps-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-[10px] border-b border-gray-50 pb-1.5 font-mono">
                        <span className="text-gray-400 uppercase">Class learning gaps</span>
                        <span className="text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded">Action Recommended</span>
                      </div>
                      <div className="space-y-1.5 overflow-y-auto max-h-[80px] pr-1">
                        <div className="flex items-center justify-between p-1 text-[10px] hover:bg-gray-50 rounded">
                          <span className="font-semibold text-gray-800">Parallel Resistor loop rule deviation</span>
                          <span className="text-orange-600 bg-orange-50 px-1 py-0.5 rounded font-bold font-mono">68% missed</span>
                        </div>
                        <div className="flex items-center justify-between p-1 text-[10px] hover:bg-gray-50 rounded">
                          <span className="font-semibold text-gray-800">Formula ratio transposition errors</span>
                          <span className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded font-bold font-mono">32% missed</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

          {/* ================= CARD 2: Access Student Performance Instantly ================= */}
          <div className="bg-white border border-[#f3ede4] rounded-2xl p-6 sm:p-8 flex flex-col justify-start h-full items-stretch shadow-2xs hover:shadow-xs transition-shadow duration-300 relative overflow-hidden group">
            <div className="mb-6 flex-grow-0">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-orange-50 text-[#e05934] rounded-xl inline-block mb-4 border border-orange-100/30">
                  <Search className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-[#e05934]/90 bg-[#e05934]/5 px-2.5 py-1 rounded-full border border-[#e05934]/10">
                  Live Registry search
                </span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-gray-900 leading-snug">
                Access Student Performance Instantly
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Run lookups to pull up precise academic dossiers. Click on profiles to access diagnostic analytics, historical scores, and custom tutoring notes.
              </p>
            </div>

            {/* Interactive Student Search & Card selector component */}
            <div className="bg-[#fcfbf9] rounded-xl border border-[#f3ede4] p-4 flex-1 flex flex-col justify-start space-y-3 mt-5 min-h-0">

              {/* Filter controls */}
              <div className="flex items-center justify-between gap-2.5 mb-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search query (e.g. Aarav, Kunal)..."
                    className="w-full bg-white border border-gray-200 text-[10px] pl-8 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#e05934] rounded-lg text-gray-800"
                  />
                </div>
                <NativeSelect
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as any)}
                  className="bg-white border border-gray-200 text-[10px] px-2 py-1.5 rounded-lg focus:ring-1 focus:ring-[#e05934] focus:outline-none text-gray-600 font-mono"
                >
                  <option value="all"> All Scores </option>
                  <option value="Strong Grip">Strong Grip</option>
                  <option value="Needs Practice">Needs Practice</option>
                  <option value="Critical Support">Support Needed</option>
                </NativeSelect>
              </div>

              {/* Split view: Left: List index, Right: Selection Details */}
              <div className="flex-1 relative min-h-[175px] mt-1">
                <div className="absolute inset-0 grid grid-cols-12 gap-3.5">

                  {/* List portion */}
                  <div className="col-span-12 sm:col-span-7 space-y-1.5 h-full overflow-y-auto pr-1 flex flex-col justify-start scrollbar-thin">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((s, idx) => {
                        const isSelected = selectedStudent === s.name;
                        return (
                          <div
                            key={idx}
                            role="button"
                            onClick={() => setSelectedStudent(s.name)}
                            className={`flex items-center justify-between p-2 rounded-lg border text-[10px] cursor-pointer transition-all ${isSelected
                                ? "bg-white border-[#e05934] shadow-3xs translate-x-1"
                                : "bg-white border-gray-100 hover:border-gray-300"
                              }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${s.avatarBg}`}>
                                {s.name.split(" ").map(w => w[0]).join("")}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 leading-tight">{s.name}</p>
                                <p className="text-[8px] text-gray-400 font-mono mt-0.5">{s.rollNo}</p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-gray-800 shrink-0">{s.grade.split(" ")[0]}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-[10px] font-mono">
                        No matching records found.
                      </div>
                    )}
                  </div>

                  {/* Right Profile card summary */}
                  <div className="col-span-12 sm:col-span-5 bg-white border border-gray-100 rounded-lg p-3 flex flex-col justify-between shadow-3xs h-full">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-display font-extrabold text-[11px] text-gray-900 truncate pr-1">{studentDetail.name}</h4>
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${getStatusColorClass(studentDetail.status)}`}>
                          {studentDetail.status.split(" ")[0]}
                        </span>
                      </div>

                      <p className="text-[9px] leading-relaxed text-gray-505 mt-2 overflow-hidden text-ellipsis line-clamp-3">
                        <strong className="text-gray-800 font-medium">Class Gap Analysis:</strong>
                        <br />
                        {studentDetail.gap === "None" ? "No conceptual gaps found. All benchmark criteria met perfectly." : `Struggling with: ${studentDetail.gap}.`}
                      </p>
                    </div>

                    <div className="border-t border-gray-50 pt-2 flex items-center justify-between text-[8px] font-mono text-gray-400">
                      <span>Grade: <strong className="text-gray-700">{studentDetail.marks}</strong></span>
                      <span className="text-[#e05934] flex items-center gap-0.5 cursor-pointer hover:underline font-bold">
                        Inspect <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* ================= CARD 3: AI-Powered Subjective Grading ================= */}
          <div className="bg-white border border-[#f3ede4] rounded-2xl p-6 sm:p-8 flex flex-col justify-start h-full items-stretch shadow-2xs hover:shadow-xs transition-shadow duration-300 relative overflow-hidden group">
            <div className="mb-6 flex-grow-0">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-orange-50 text-[#e05934] rounded-xl inline-block mb-4 border border-orange-100/30">
                  <Sparkles className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-[#e05934]/90 bg-[#e05934]/5 px-2.5 py-1 rounded-full border border-[#e05934]/10">
                  Worksheet Evaluator
                </span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-gray-900 leading-snug">
                AI-Powered Grading & Step-Feedback
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                VidyaAI assesses hand-written formulas, calculations, and explanations step-by-step. Hover over student worksheets to reveal automated teacher recommendations.
              </p>
            </div>

            {/* Interactive evaluation simulator */}
            <div className="bg-[#fcfbf9] rounded-xl border border-[#f3ede4] p-4 flex-1 flex flex-col justify-between mt-5">
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block mb-2">
                Click lines to check step analytics
              </span>

              {/* Lines representation */}
              <div className="space-y-2">
                {gradingLines.map((line, idx) => {
                  const isActive = activeFeedbackLine === idx;
                  const isApproved = approvedState[idx];

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveFeedbackLine(idx)}
                      role="button"
                      className={`p-2 rounded-lg border text-left font-mono text-[10.5px] leading-normal transition-all relative group cursor-pointer ${isActive
                          ? line.status === "correct"
                            ? "bg-emerald-50/50 border-emerald-300 translate-x-1"
                            : line.status === "incorrect"
                              ? "bg-rose-50/50 border-rose-300 translate-x-1"
                              : "bg-amber-50/50 border-amber-300 translate-x-1"
                          : "bg-white border-gray-100 hover:border-gray-200"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`${isActive ? "text-gray-950 font-medium" : "text-gray-500"}`}>
                          {line.text}
                        </span>

                        {/* Approval pill */}
                        <div className="flex items-center space-x-1.5 shrink-0 pl-1">
                          {isApproved ? (
                            <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-sans font-bold flex items-center gap-0.5 select-none">
                              <Check className="w-2.5 h-2.5" /> Approved
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setApprovedState(prev => ({ ...prev, [idx]: true }));
                              }}
                              className="text-[8px] bg-stone-100 text-[#e05934] border border-[#e05934]/20 hover:bg-[#e05934] hover:text-white px-2 py-0.5 rounded font-sans transition-colors"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active feedback panel details */}
              <div className="bg-white border border-gray-100 rounded-lg p-3 mt-4 flex items-start gap-2.5 min-h-[55px] shadow-3xs relative overflow-hidden">
                <span className="p-1 px-1.5 bg-orange-50 text-[#e05934] rounded text-[10px] font-mono uppercase shrink-0 font-bold">
                  AI FEEDBACK
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[8px] font-mono text-gray-400 mb-1">
                    <span>LINE {activeFeedbackLine + 1} ASSESSMENT</span>
                    <strong className="text-gray-900 font-bold">{gradingLines[activeFeedbackLine].score}</strong>
                  </div>
                  <p className="text-[10px] text-gray-700 leading-normal font-sans">
                    {gradingLines[activeFeedbackLine].feedback}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ================= CARD 4: Full Board Alignment & Quality Check ================= */}
          <div className="bg-white border border-[#f3ede4] rounded-2xl p-6 sm:p-8 flex flex-col justify-start h-full items-stretch shadow-2xs hover:shadow-xs transition-shadow duration-300 relative overflow-hidden group">
            <div className="mb-6 flex-grow-0">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-orange-50 text-[#e05934] rounded-xl inline-block mb-4 border border-orange-100/30">
                  <CheckSquare className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-[#e05934]/90 bg-[#e05934]/5 px-2.5 py-1 rounded-full border border-[#e05934]/10">
                  Standards Compliance
                </span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-gray-900 leading-snug">
                Full Curriculum Alignment & Board Check
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Ensure evaluation expectations remain uniform. Dynamically realign scoring systems with CBSE, ICSE, or international board guidelines with one tap.
              </p>
            </div>

            {/* Interactive Alignment Controls */}
            <div className="bg-[#fcfbf9] rounded-xl border border-[#f3ede4] p-4 flex-1 flex flex-col justify-start space-y-4 mt-5">

              {/* Presets and progress meter */}
              <div className="grid grid-cols-12 gap-4 items-center border-b border-[#f3ede4] pb-3">

                {/* Switchers */}
                <div className="col-span-12 sm:col-span-7 space-y-1">
                  <span className="text-[9px] font-mono text-gray-400 block uppercase font-semibold">
                    ACTIVE BOARD ALIGNMENT
                  </span>
                  <div className="flex bg-stone-100 border border-stone-200 rounded-lg p-0.5 gap-1 text-[10px]">
                    {[
                      { id: "cbse", label: "CBSE India" },
                      { id: "icse", label: "ICSE India" },
                      { id: "ib", label: "IB / K-12" }
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setActiveBoard(b.id as any)}
                        className={`flex-1 py-1 rounded transition-all text-center ${activeBoard === b.id
                            ? "bg-white text-gray-900 shadow-3xs font-bold"
                            : "text-gray-400 hover:text-gray-700"
                          }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Wheel */}
                <div className="col-span-12 sm:col-span-5 flex items-center justify-start sm:justify-end gap-3">
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-gray-400 block uppercase leading-none mb-1">
                      VERIFIER SCORE
                    </span>
                    <span className="text-sm font-bold text-gray-900 tracking-tight block">
                      {getCompliancePercentage()}% Compliant
                    </span>
                  </div>

                  {/* Micro compliance meter bars */}
                  <div className="w-12 h-12 rounded-full border border-[#f3ede4] bg-white flex items-center justify-center font-display font-extrabold text-[#e05934] text-xs shadow-3xs">
                    {getCompliancePercentage()}%
                  </div>
                </div>

              </div>

              {/* Dynamic Checklists */}
              <div className="space-y-2">
                <p className="text-[9px] font-mono text-gray-400 uppercase font-semibold">
                  Board compliance checkpoint guidelines:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">

                  <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={complianceChecks.nep2020}
                      onChange={(e) => setComplianceChecks(prev => ({ ...prev, nep2020: e.target.checked }))}
                      className="rounded border-gray-300 text-[#e05934] focus:ring-[#e05934] focus:ring-1"
                    />
                    <span className="text-gray-700 font-medium">NEP 2020 Competencies</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={complianceChecks.competencyBased}
                      onChange={(e) => setComplianceChecks(prev => ({ ...prev, competencyBased: e.target.checked }))}
                      className="rounded border-gray-300 text-[#e05934] focus:ring-[#e05934] focus:ring-1"
                    />
                    <span className="text-gray-700 font-medium">Subjective Rubric-Lock</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={complianceChecks.rubricMatched}
                      onChange={(e) => setComplianceChecks(prev => ({ ...prev, rubricMatched: e.target.checked }))}
                      className="rounded border-gray-300 text-[#e05934] focus:ring-[#e05934] focus:ring-1"
                    />
                    <span className="text-gray-700 font-medium">CBSE Syllabus Checklist</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={complianceChecks.formativeChecked}
                      onChange={(e) => setComplianceChecks(prev => ({ ...prev, formativeChecked: e.target.checked }))}
                      className="rounded border-gray-300 text-[#e05934] focus:ring-[#e05934] focus:ring-1"
                    />
                    <span className="text-gray-700 font-medium">Formative checks (optional)</span>
                  </label>

                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
