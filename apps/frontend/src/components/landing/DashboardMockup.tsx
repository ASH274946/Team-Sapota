import React, { useState } from "react";
import { 
  Plus, Home, Users, BarChart3, BookOpen, 
  CheckCircle, FileText, Sparkles, ChevronRight
} from "lucide-react";

export default function DashboardMockup() {
  const [activeTab, setActiveTab] = useState<"summary" | "gaps" | "actions">("summary");
  const [selectedSubGrade, setSelectedSubGrade] = useState<string>("B");

  const gradeStudents = {
    A: { count: 3, label: "Excellent performance, keep challenging them.", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    B: { count: 12, label: "Good grasp; minor gaps in application-level concepts.", color: "bg-blue-50 text-blue-700 border-blue-200" },
    C: { count: 22, label: "Average performance; needs reinforcement on core theory.", color: "bg-amber-50 text-amber-700 border-amber-200" },
    D: { count: 7, label: "Requires structured remedial support immediately.", color: "bg-orange-50 text-orange-700 border-orange-200" },
    F: { count: 6, label: "Critical gaps; needs personalized 1-on-1 intervention.", color: "bg-rose-50 text-rose-700 border-rose-200" },
  };

  const missedConcepts = [
    { name: "Ohm's Law Application", rate: 23, description: "Applying V=IR in complex parallel configurations" },
    { name: "Resistance in Parallel Circuits", rate: 18, description: "Calculating equivalent resistance for 3+ resistors" },
    { name: "Potential Difference & EMF", rate: 15, description: "Distinguishing internal resistance in active circuits" },
    { name: "Interpreting Circuit Diagrams", rate: 12, description: "Mapping multi-loop schematics to actual components" },
    { name: "Series vs Parallel Formulas", rate: 8, description: "Confusing proportional ratio of voltage drops" },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-[#f3ede4] shadow-2xl overflow-hidden dashboard-shadow">
      {/* Top Toolbar / Window controls */}
      <div className="bg-[#fcfbf9] px-4 py-3 border-b border-[#f3ede4] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-xs text-gray-400 font-mono pl-2">dashboard.vidyaai.com/classroom-10b</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#e05934]/10 text-[#e05934]">
            ● LIVE SESSION
          </span>
        </div>
      </div>

      <div className="flex h-[480px] lg:h-[550px] overflow-hidden text-sm">
        {/* Sidebar Mini Mockup */}
        <div className="w-16 lg:w-48 bg-[#fcfbf9] border-r border-[#f3ede4] flex flex-col justify-between py-4 select-none shrink-0">
          <div className="space-y-6">
            {/* Logo placeholder */}
            <div className="px-3 lg:px-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-white font-bold text-sm italic">
                V
              </div>
              <span className="hidden lg:block font-bold text-[#1e1e1a] tracking-tight">VidyaAI</span>
            </div>

            {/* Action button */}
            <div className="px-2 lg:px-3">
              <button className="w-full bg-[#e05934] text-white hover:bg-orange-600 font-medium px-2 py-2 lg:py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs">
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Create Class Assessment</span>
              </button>
            </div>

            {/* Standard Nav */}
            <nav className="space-y-1 px-2">
              <div className="bg-[#e05934]/10 text-[#e05934] font-medium rounded-lg px-2.5 py-2 flex items-center gap-3 cursor-pointer">
                <Home className="w-4.5 h-4.5" />
                <span className="hidden lg:inline text-xs">Home</span>
              </div>
              <div className="text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg px-2.5 py-2 flex items-center gap-3 cursor-pointer transition-colors">
                <Users className="w-4.5 h-4.5" />
                <span className="hidden lg:inline text-xs">My Classes</span>
              </div>
              <div className="text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg px-2.5 py-2 flex items-center gap-3 cursor-pointer transition-colors">
                <FileText className="w-4.5 h-4.5" />
                <span className="hidden lg:inline text-xs">Assignments</span>
              </div>
              <div className="text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg px-2.5 py-2 flex items-center gap-3 cursor-pointer transition-colors">
                <BarChart3 className="w-4.5 h-4.5" />
                <span className="hidden lg:inline text-xs">Analytics</span>
              </div>
              <div className="text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg px-2.5 py-2 flex items-center gap-3 cursor-pointer transition-colors">
                <BookOpen className="w-4.5 h-4.5" />
                <span className="hidden lg:inline text-xs">My Library</span>
              </div>
            </nav>
          </div>

          {/* School Name bottom */}
          <div className="px-3 border-t border-[#f3ede4] pt-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-[10px] shrink-0">
                DP
              </div>
              <div className="hidden lg:block truncate">
                <p className="text-[11px] font-semibold text-gray-900 leading-tight">Delhi Public School</p>
                <p className="text-[9px] text-[#e05934]">Physics Grader</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content Panel */}
        <div className="flex-1 bg-white p-4 lg:p-6 overflow-y-auto">
          {/* Header row in dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 font-mono">ASSESSMENT #12 DETAIL</p>
              <h3 className="font-display font-medium text-lg text-gray-900">Current Assessment Summary: Physics - Ohm's Law</h3>
            </div>
            <div className="flex items-center space-x-2">
              {/* Tabs selector */}
              {(["summary", "gaps", "actions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                    activeTab === tab
                      ? "bg-[#e05934] text-white"
                      : "bg-[#fcfbf9] text-gray-600 hover:bg-[#f3ede4]"
                  }`}
                >
                  {tab === "summary" && "Class Performance"}
                  {tab === "gaps" && "Learning Gaps"}
                  {tab === "actions" && "Recommended Actions"}
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard tabs switcher container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-auto">
            {activeTab === "summary" && (
              <>
                {/* Left column: Submissions and segmented performance */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Performance main metrics block */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#fcfbf9] p-3 rounded-xl border border-[#f3ede4] text-center">
                      <p className="text-[10px] font-mono text-gray-400">SUBMITTED</p>
                      <h4 className="font-display font-bold text-xl text-gray-900">45 <span className="text-xs text-gray-400">/ 50</span></h4>
                      <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
                        <div className="bg-emerald-500 h-1 rounded-full" style={{ width: "90%" }} />
                      </div>
                    </div>
                    <div className="bg-[#fcfbf9] p-3 rounded-xl border border-[#f3ede4] text-center">
                      <p className="text-[10px] font-mono text-[#e05934]">AVG SCORE</p>
                      <h4 className="font-display font-bold text-xl text-[#e05934]">82%</h4>
                      <p className="text-[9px] text-gray-400 mt-1 leading-none">+3% vs last test</p>
                    </div>
                    <div className="bg-[#fcfbf9] p-3 rounded-xl border border-[#f3ede4] text-center">
                      <p className="text-[10px] font-mono text-emerald-600">HIGHEST SCORE</p>
                      <h4 className="font-display font-bold text-xl text-emerald-600">95%</h4>
                      <p className="text-[9px] text-gray-400 mt-1 leading-none">Aarav Sharma</p>
                    </div>
                  </div>

                  {/* Visual Grade Segments */}
                  <div className="bg-[#fdfcfb] p-4 rounded-xl border border-[#f3ede4]">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-semibold text-gray-900 font-mono uppercase tracking-wide">Student Grade Segmentation</h5>
                      <span className="text-[11px] text-[#e05934]">Click grade for breakdown</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2.5">
                      {Object.entries(gradeStudents).map(([grade, details]) => (
                        <button
                          key={grade}
                          onClick={() => setSelectedSubGrade(grade)}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            selectedSubGrade === grade
                              ? "ring-2 ring-[#e05934] bg-white border-transparent shadow-sm"
                              : "bg-white border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <span className={`text-base font-extrabold block mb-1 ${
                            grade === "A" || grade === "B" ? "text-emerald-600" : grade === "C" ? "text-amber-500" : "text-rose-500"
                          }`}>{grade}</span>
                          <span className="text-xs text-gray-600 font-semibold block">{details.count}</span>
                          <span className="text-[9px] text-gray-400 uppercase font-mono tracking-tighter">students</span>
                        </button>
                      ))}
                    </div>

                    {/* Active sub breakdown */}
                    <div className={`mt-3 p-3 rounded-lg border ${gradeStudents[selectedSubGrade as keyof typeof gradeStudents].color} text-xs transition-all duration-300`}>
                      <span className="font-semibold uppercase tracking-wider font-mono mr-1.5">[Grade {selectedSubGrade} Recommendation]:</span>
                      {gradeStudents[selectedSubGrade as keyof typeof gradeStudents].label}
                    </div>
                  </div>
                </div>

                {/* Right column: Mini feedback tracker */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="bg-[#fcfbf9] p-4 rounded-xl border border-[#f3ede4] flex-1">
                    <div className="flex items-center space-x-1 mb-3">
                      <Sparkles className="w-4 h-4 text-[#e05934]" />
                      <h5 className="font-display font-semibold text-xs tracking-wide uppercase text-gray-900">AI Feedback Summary</h5>
                    </div>
                    <div className="space-y-3 font-sans">
                      <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Assignment Status</span>
                        <span className="font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Graded (45/50)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Overall Concept Grab</span>
                        <span className="font-semibold text-amber-600">Medium-High</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[11px] block mb-1 leading-none">Core Improvement Focus</span>
                        <div className="bg-amber-50 border border-amber-100 p-2 rounded text-xs text-amber-800">
                          <strong>Formula application</strong> needs brush up before board prep exams.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black text-white p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-mono">RECOMMENDED ACTION</p>
                      <p className="font-semibold text-xs mt-0.5 leading-snug">Reteach Parallel Resistances</p>
                    </div>
                    <button className="bg-[#e05934] p-2 rounded-lg text-white hover:bg-orange-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "gaps" && (
              <div className="lg:col-span-12 space-y-4">
                <div className="bg-[#fcfbf9] p-4 rounded-xl border border-[#f3ede4]">
                  <h4 className="font-display font-semibold text-sm mb-1 text-gray-900">Concept Map Gap Analysis</h4>
                  <p className="text-xs text-gray-500 mb-4">VidyaAI flags specific keywords and formulas misspelled or misunderstood across the standard text responses.</p>
                  
                  <div className="space-y-3">
                    {missedConcepts.map((concept, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-gray-900">{concept.name}</span>
                          <span className="font-mono text-[#e05934] bg-[#e05934]/10 px-1.5 py-0.5 rounded font-bold">
                            {concept.rate}% Student Gap
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 flex overflow-hidden">
                          <div className="bg-[#e05934] h-1.5" style={{ width: `${concept.rate * 3}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 italic font-sans">{concept.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "actions" && (
              <div className="lg:col-span-12 space-y-3">
                <div className="p-3 bg-white hover:bg-[#fcfbf9] border border-gray-100 rounded-lg flex items-start space-x-3 transition-colors">
                  <span className="p-1 px-2.5 bg-rose-50 border border-rose-200 text-rose-600 font-bold font-mono text-xs rounded mt-0.5">1</span>
                  <div>
                    <h5 className="font-semibold text-xs text-gray-900">Remedial Quiz for Grade D/F Students</h5>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">VidyaAI generated a auto-scored quiz addressing basic voltage ratios to clear baseline misconceptions before next project.</p>
                  </div>
                </div>

                <div className="p-3 bg-white hover:bg-[#fcfbf9] border border-gray-100 rounded-lg flex items-start space-x-3 transition-colors">
                  <span className="p-1 px-2.5 bg-amber-50 border border-amber-200 text-amber-600 font-bold font-mono text-xs rounded mt-0.5">2</span>
                  <div>
                    <h5 className="font-semibold text-xs text-gray-900">Custom Classroom Slide Support</h5>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">Download the 5-minute visual explanation slide outlining multi-loop battery currents that Ohm's Law requires.</p>
                  </div>
                </div>

                <div className="p-3 bg-white hover:bg-[#fcfbf9] border border-gray-100 rounded-lg flex items-start space-x-3 transition-colors">
                  <span className="p-1 px-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold font-mono text-xs rounded mt-0.5">3</span>
                  <div>
                    <h5 className="font-semibold text-xs text-gray-900">Advanced Project for Group A</h5>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">Assigned 3 advanced students an extra credit simulation to construct complex Kirchhoff-loop models online.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
