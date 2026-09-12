import React, { useState } from "react";
import { 
  Clock, 
  Award, 
  Star, 
  TrendingUp, 
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MetricData {
  id: string;
  title: string;
  metric: string;
  desc: string;
  icon: React.ReactNode;
  badge: string;
}

export default function PhoneMockupSection() {
  const [activeTab, setActiveTab] = useState<string>("efficiency");

  const metricsList: MetricData[] = [
    {
      id: "efficiency",
      metric: "32+ Hours",
      title: "Hours Saved per Teacher",
      desc: "By automating repetitive objective and step-by-step subjective grading.",
      icon: <Clock className="w-5 h-5" />,
      badge: "-85% Checking Time",
    },
    {
      id: "gains",
      metric: "87% Progress",
      title: "Measurable Academic Gains",
      desc: "Students showing improvement after receiving personalized diagnostic reports.",
      icon: <Award className="w-5 h-5" />,
      badge: "+14% Avg Score",
    },
    {
      id: "approval",
      metric: "98% Agreed",
      title: "AI Marking Accuracy",
      desc: "Evaluation scores approved immediately by senior curriculum examiners.",
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: "Verified Trust",
    },
    {
      id: "clarity",
      metric: "85% Score",
      title: "Clear Parent Satisfaction",
      desc: "Parents stating significant improvement in homework accountability.",
      icon: <Star className="w-5 h-5" />,
      badge: "Strengthened Trust",
    },
  ];

  return (
    <section className="py-24 bg-white border-b border-[#f3ede4] relative overflow-hidden" id="impact-metrics">
      {/* Structural ambient styling */}
      <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-orange-100/20 blur-3xl -z-1" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-orange-50/30 blur-3xl -z-1" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core Narrative Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider text-[#e05934] bg-[#e05934]/10 uppercase mb-4">
            <TrendingUp className="w-3.5 h-3.5" /> Institutional Impact
          </span>
          <p className="text-xl sm:text-2xl md:text-3.5xl font-display font-medium tracking-tight text-gray-900 leading-snug">
            VidyaAI is an AI Academic Assessment system that enables educational institutions to{" "}
            <span className="text-[#e05934] font-semibold underline decoration-orange-200/60 decoration-4">
              deliver stronger academic results
            </span>
            , increase parent confidence, and build long-term institutional reputation.
          </p>
        </div>

        {/* Dynamic Bento Panel Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch pt-2">
          
          {/* LEFT: Metric Selector Stack (Col-Span-5) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="mb-4">
                <h3 className="font-display font-medium text-xs text-gray-400 uppercase tracking-widest">
                  Select Metric to View Diagnostic
                </h3>
              </div>

              {metricsList.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start space-x-4 relative overflow-hidden group ${
                      isActive 
                        ? "bg-[#fcfbf9] border-[#e05934] shadow-md shadow-orange-500/5 translate-x-1" 
                        : "bg-white border-[#f3ede4] hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                  >
                    {/* Active accent strip */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#e05934]" />
                    )}

                    <div className={`p-2.5 rounded-lg shrink-0 transition-colors duration-200 ${
                      isActive ? "bg-[#e05934] text-white" : "bg-orange-50 text-[#e05934]"
                    }`}>
                      {item.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-[#e05934] tracking-tight bg-orange-100/40 px-2 py-0.5 rounded">
                          {item.metric}
                        </span>
                        <span className={`text-[10px] font-mono leading-none ${isActive ? "text-gray-900 font-bold" : "text-gray-400"}`}>
                          {item.badge}
                        </span>
                      </div>
                      <h4 className="font-display font-semibold text-sm text-gray-900 leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 leading-normal mt-1.5 transition-colors duration-200">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Live Showcase Screen Simulator (Col-Span-7) */}
          <div className="lg:col-span-7 bg-[#fcfbf9] border border-[#f3ede4] rounded-2xl p-6 flex flex-col justify-between min-h-[auto] lg:min-h-[460px] relative overflow-hidden shadow-xs">
            
            {/* Top Device Header Mimic */}
            <div className="border-b border-gray-100 pb-4 mb-4 flex items-center justify-between font-mono text-[11px] text-gray-400 select-none">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-gray-650 pl-1 capitalize">Simulator: {activeTab} mode</span>
              </div>
              <div className="text-right text-[#e05934] font-bold">● SIMULATOR ONLINE</div>
            </div>

            {/* Screen Content Window */}
            <div className="flex-1 flex flex-col relative z-10 px-2">
              <AnimatePresence mode="wait">
                {activeTab === "efficiency" && (
                  <motion.div
                    key="efficiency"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-[#e05934] font-mono font-bold uppercase tracking-wider mb-0.5">Time Allocation Analysis</p>
                          <h4 className="font-display font-bold text-gray-900 text-lg leading-tight">Teacher Workload Breakdown</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200">
                          32 hrs returned
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        By automating paper sorting, handwriting character mapping, and grading rubrics, teachers regain invaluable planning time.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                        <span className="text-[10px] font-mono font-medium text-gray-400 block uppercase">Manual Checking</span>
                        <div className="text-xl font-display font-bold text-rose-500 mt-1">
                          35 mins <span className="text-xs font-normal text-gray-400">/ sheet</span>
                        </div>
                        <div className="w-full bg-rose-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                          <div className="h-full bg-rose-500 w-[90%]" />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1.5 leading-tight">Requires matching steps, scoring lists, logging logs manually.</p>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs relative overflow-hidden">
                        <div className="absolute top-2 right-2">
                          <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-mono font-medium text-[#e05934] block uppercase">VidyaAI Workflow</span>
                        <div className="text-xl font-display font-bold text-emerald-600 mt-1">
                          0.4 seconds <span className="text-xs font-normal text-gray-400">/ sheet</span>
                        </div>
                        <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[5%]" />
                        </div>
                        <p className="text-[9px] text-[#e05934] mt-1.5 leading-tight font-medium">Automatic recognition, item scoring, and instantly synced charts.</p>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="font-semibold text-[11px]">Instant Rubric Validation Active</span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">100% cloud latency offset</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === "gains" && (
                  <motion.div
                    key="gains"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-[10px] text-[#e05934] font-mono font-bold uppercase tracking-wider mb-0.5">Academic Progress telemetry</p>
                      <h4 className="font-display font-bold text-gray-900 text-lg leading-tight">Classroom Performance Analytics</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Personalized correction summaries and remedial assignments directly correlate to elevated term-on-term CBSE metrics.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-800 font-sans">Maths & Physics average scores (Grade 10)</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> +14.2% gains
                        </span>
                      </div>

                      {/* Customized simple visual micro line timeline */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>Diagnostic Pre-test</span>
                          <span>Unit Assessment</span>
                          <span>Final Term Assessment</span>
                        </div>
                        <div className="relative h-16 w-full flex items-end">
                          {/* Visual Grid Line lines */}
                          <div className="absolute inset-x-0 bottom-1/3 border-t border-gray-100" />
                          <div className="absolute inset-x-0 bottom-2/3 border-t border-gray-100" />
                          
                          {/* Progress bar charts columns */}
                          <div className="w-full flex justify-between items-end px-2 z-10">
                            <div className="flex flex-col items-center space-y-1.5 w-16">
                              <span className="text-[10px] font-bold text-gray-500">68%</span>
                              <div className="w-10 bg-gray-200 h-9 rounded-t transition-all" />
                            </div>
                            <div className="flex flex-col items-center space-y-1.5 w-16">
                              <span className="text-[10px] font-bold text-[#e05934]">76%</span>
                              <div className="w-10 bg-orange-100 h-11 rounded-t transition-all" />
                            </div>
                            <div className="flex flex-col items-center space-y-1.5 w-16">
                              <span className="text-[10px] font-bold text-emerald-600">82.2%</span>
                              <div className="w-10 bg-emerald-500 h-14 rounded-t transition-all" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-500 italic bg-amber-50/50 border border-amber-100 p-2 rounded text-center">
                      * Data verified against 240+ students at Horizon International and affiliated institutions.
                    </div>
                  </motion.div>
                )}

                {activeTab === "approval" && (
                  <motion.div
                    key="approval text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-[10px] text-[#e05934] font-mono font-bold uppercase tracking-wider mb-0.5">Reliability Registry</p>
                      <h4 className="font-display font-bold text-gray-900 text-lg leading-tight">Human-in-the-Loop Verification</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Instantly aligning with institutional standards. Marks are drafts for teacher review. 98% pass directly without changes.
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                          98%
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-950">Approved without Modification</p>
                          <p className="text-[10px] text-gray-500">Only 2% of marks adjusted slightly for handwriting edge cases.</p>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-600 bg-emerald-50/70 border border-emerald-100 font-bold px-2 py-1 rounded">
                        TRUSTWORTHY
                      </span>
                    </div>

                    <div className="p-3 bg-[#fcfbf9] rounded-xl border border-[#f3ede4] text-xs space-y-1.5">
                      <p className="font-semibold text-gray-800">Verified Rubric Controls</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>CBSE Alignment (Checked)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Custom Marking Schemes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Pen-stroke Level Parsing</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Total Double-Pass Check</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "clarity" && (
                  <motion.div
                    key="clarity info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-[10px] text-[#e05934] font-mono font-bold uppercase tracking-wider mb-0.5">Parent Engagement logs</p>
                      <h4 className="font-display font-bold text-gray-900 text-lg leading-tight">Instantly Generated Accountability reports</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Rather than vague grades, parents get fully contextual highlights detailing exactly what formulas or math steps need focus.
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs space-y-3">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                        <span>SENT TO: RAJESH GUPTA (FATHER)</span>
                        <span>DELIVERED INSTANTLY</span>
                      </div>
                      
                      <div className="bg-orange-50/40 p-2.5 rounded-lg border border-orange-50 text-xs">
                        <p className="font-semibold text-gray-950 mb-1">📝 Homework Summary: Physics 10B</p>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                          "Rohit scored <strong className="text-emerald-700">8/10</strong> on electricity worksheet. He mapped the series equations flawlessly, but requires home practice matching parallel formula ratios before Friday."
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400">Response from Parent:</span>
                        <span className="text-[#e05934] font-semibold bg-orange-100/30 px-2 py-0.5 rounded">
                          "Highly clear & constructive"
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Simulated Frame Footer */}
            <div className="border-t border-gray-150 pt-3 mt-4 text-[10px] font-mono text-gray-400 flex justify-between select-none">
              <span>DEPLOYED MODULE: VERSION_CB_3.4</span>
              <span>SECURE DATA STREAM</span>
            </div>

          </div>
        </div>

        {/* Small Bottom Quote text */}
        <div className="max-w-3xl mx-auto text-center mt-12 px-6">
          <p className="text-xs sm:text-sm italic text-gray-500 leading-relaxed font-sans max-w-2xl mx-auto">
            "By implementing VidyaAI, we've successfully addressed the two biggest challenges in our institution: teacher workload and personalized feedback for students. It's the perfect balance of automation and human oversight."
          </p>
        </div>

        {/* Testimonial Dr. A Sharma block */}
        <div className="max-w-3xl mx-auto mt-20 bg-[#fcfbf9]/60 border border-[#f3ede4] rounded-2xl p-6 sm:p-10 text-center relative shadow-xs">
          <span className="absolute top-4 left-6 text-orange-200 font-serif text-8xl leading-none select-none">“</span>
          
          <p className="font-sans font-medium text-gray-800 text-sm sm:text-base leading-relaxed relative z-10 px-4">
            Since integrating <span className="text-[#e05934] font-semibold">VidyaAI</span>, our teachers spend significantly less time grading and more time on high-impact teaching. The detailed analytics give us unprecedented visibility into student performance, allowing us to intervene early and improve overall academic results. It's a game-changer for our school's efficiency.
          </p>

          <div className="mt-8 flex flex-col items-center">
            {/* Avatar block */}
            <div className="w-12 h-12 rounded-full border border-orange-200 overflow-hidden bg-orange-50 flex items-center justify-center font-display font-bold text-[#e05934] mb-3 text-sm tracking-wide shadow-xs">
              JD
            </div>
            <h6 className="font-display font-semibold text-xs sm:text-sm text-gray-900">Dr. James Doe</h6>
            <p className="text-[11px] text-[#e05934] font-medium leading-none mt-1">Director of Academics, Excel Global School</p>
          </div>
        </div>

      </div>
    </section>
  );
}
