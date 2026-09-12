import React, { useState } from "react";
import { 
  Zap, 
  Scale, 
  Sparkles, 
  Users2, 
  ShieldCheck, 
  Landmark, 
  TrendingUp, 
  CheckCircle2, 
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GainData {
  title: string;
  shortLabel: string;
  desc: string;
  icon: React.ReactNode;
  roiBadge: string;
  statsValue: string;
  metricLabel: string;
}

export default function LeadersGain() {
  const [activeIndex, setActiveIndex] = useState(0);

  const keyGains: GainData[] = [
    {
      title: "Faster assessment cycles & result declaration",
      shortLabel: "Assessment Velocity",
      desc: "Delivering fully compiled school report sheets in record time. Cut grade compilation stress and operational bottlenecks immediately.",
      icon: <Zap className="w-4.5 h-4.5 text-[#e05934]" />,
      roiBadge: "92% Speedup",
      statsValue: "0.4 days",
      metricLabel: "Average result turnaround (vs 5.2 days manually)"
    },
    {
      title: "Standardised evaluation across school sections",
      shortLabel: "Standard Deviation",
      desc: "Eliminate personal grading biases and evaluation variance across classroom divisions. Perfect curriculum rubrics compliance.",
      icon: <Scale className="w-4.5 h-4.5 text-[#e05934]" />,
      roiBadge: "Zero Variance",
      statsValue: "0.0σ",
      metricLabel: "Consistent grade application across all branches"
    },
    {
      title: "Improved student performance with rich insights",
      shortLabel: "Academic Progression",
      desc: "Instant flags detect weak formula concepts early. Empirical diagnostic summaries let teachers target key topics pre-exams.",
      icon: <Sparkles className="w-4.5 h-4.5 text-[#e05934]" />,
      roiBadge: "+14.2% Scores",
      statsValue: "+14.2%",
      metricLabel: "Average grade points increase verified in term test"
    },
    {
      title: "Higher parent satisfaction & detailed reports",
      shortLabel: "Parent Confidence",
      desc: "Transition from vague grade numbers to detailed conceptual progress bars. Build powerful trust with transparent growth tracking.",
      icon: <Users2 className="w-4.5 h-4.5 text-[#e05934]" />,
      roiBadge: "96% Approval",
      statsValue: "96.4%",
      metricLabel: "Parents endorsing report granularity and clarity"
    },
    {
      title: "Reduced dependency on manual paper checking",
      shortLabel: "Staff Preservation",
      desc: "Eliminate repetitive mark copying and red-pen fatigue. Empower teachers to restore focus on interactive teaching and mentoring.",
      icon: <ShieldCheck className="w-4.5 h-4.5 text-[#e05934]" />,
      roiBadge: "+32 hrs / mo",
      statsValue: "32.5 hrs",
      metricLabel: "Recovered time per teacher every single month"
    },
    {
      title: "Scalable across classes, subjects, and boards",
      shortLabel: "Institutional Scale",
      desc: "Fully compliant with CBSE, ICSE, and custom international rubrics. Dynamically scale parameters with zero friction.",
      icon: <Landmark className="w-4.5 h-4.5 text-[#e05934]" />,
      roiBadge: "100% Compliant",
      statsValue: "Multi-Board",
      metricLabel: "Seamless curriculum alignment checked instantly"
    }
  ];

  return (
    <section className="py-24 bg-[#FAF7F2] border-b border-[#f3ede4] relative overflow-hidden" id="about">
      {/* Dynamic Background Premium Accents */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-radial from-[#e05934]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2/5 h-2/5 bg-radial from-orange-100/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Core Narrative Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20 px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-widest text-[#e05934] uppercase bg-orange-150/10 border border-orange-200/30 mb-4 shadow-3xs">
            <TrendingUp className="w-3.5 h-3.5" /> EXECUTIVE COMMAND
          </span>
          <h2 className="font-display font-medium text-3xl sm:text-4xl text-gray-950 tracking-tight leading-tight">
            Institutional Return on Investment
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 max-w-xl mx-auto leading-relaxed">
            A premium diagnostic command suite engineered to deliver clear, auditable operational results for modern school administrative boards.
          </p>
        </div>

        {/* Premium Bento Split Interactive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2 max-w-6xl mx-auto">
          
          {/* LEFT SIDE: Highly Styled Value Driver Levers (Col-Span-5) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-2 px-1">
                Value Driver Switchboards
              </span>

              {keyGains.map((gain, index) => {
                const isActive = activeIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden flex items-start space-x-3.5 group cursor-pointer ${
                      isActive 
                        ? "bg-white border-[#e05934] shadow-md shadow-orange-500/5 translate-x-1" 
                        : "bg-white/80 border-[#e3dac9] hover:border-gray-400 hover:bg-white"
                    }`}
                  >
                    {/* Active accent side strip */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#e05934]" />
                    )}

                    <div className={`p-2 rounded-lg shrink-0 transition-colors duration-200 ${
                      isActive ? "bg-[#e05934] text-white" : "bg-orange-50 text-[#e05934]"
                    }`}>
                      {React.isValidElement(gain.icon)
                        ? React.cloneElement(gain.icon as React.ReactElement<any>, {
                            className: `w-4.5 h-4.5 ${isActive ? "text-white" : "text-[#e05934]"}`
                          })
                        : gain.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-1">
                        <span className="font-mono text-[9px] font-bold text-[#e05934] uppercase tracking-tight bg-orange-50 px-1.5 py-0.5 rounded">
                          {gain.shortLabel}
                        </span>
                        <span className={`text-[9px] font-mono leading-none ${isActive ? "text-gray-900 font-bold" : "text-gray-400"}`}>
                          {gain.roiBadge}
                        </span>
                      </div>
                      <h4 className="font-display font-semibold text-xs sm:text-sm text-gray-950 leading-tight">
                        {gain.title}
                      </h4>
                      
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-xs text-gray-500 leading-normal mt-2 pt-1 border-t border-gray-50">
                              {gain.desc}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE: The "$10,000 Administrator Control Room Simulator" (Col-Span-7) */}
          <div className="lg:col-span-7 bg-white border border-[#e3dac9] rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[480px]">
            
            {/* Command-Center Ambient Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#f3ede4_1px,transparent_1px)] [background-size:16px_16px] opacity-40 -z-1" />

            {/* Simulated Head-up Screen Top line */}
            <div className="border-b border-stone-100 pb-4 mb-5 flex items-center justify-between font-mono text-[10px] text-gray-400 select-none">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="font-bold text-gray-800 tracking-wider">BOARD EXECUTIVE DIAGNOSTIC ROOM</span>
              </div>
              <div className="text-right flex items-center space-x-1 text-emerald-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>ROI ESTIMATE COMPLETED</span>
              </div>
            </div>

            {/* Dynamic Screen Content Frame */}
            <div className="flex-1 flex flex-col justify-between relative z-10">
              
              {/* Highlight Dashboard Hero Block */}
              <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-100 space-y-1">
                <span className="text-[9px] font-mono text-[#e05934] uppercase tracking-widest block font-bold">
                  PROJECTED VALUE ADDED
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl sm:text-4xl font-display font-extrabold text-gray-950 tracking-tight">
                    {keyGains[activeIndex].statsValue}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {keyGains[activeIndex].roiBadge} ACHIEVED
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium font-mono pt-1">
                  {keyGains[activeIndex].metricLabel}
                </p>
              </div>

              {/* Dynamic Sub-Visualizations depending on active lever */}
              <div className="my-5 flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  
                  {activeIndex === 0 && (
                    <motion.div
                      key="lead-velocity"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">Result Compilation Timeline</span>
                        <span className="text-[#e05934] font-mono font-bold">-4.8 Days Less Waiting</span>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100/60">
                          <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-1.5">
                            <span>Traditional Manual Flow</span>
                            <span>5.2 Days average</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400 w-full rounded-full" />
                          </div>
                        </div>

                        <div className="bg-orange-50/30 p-3 rounded-lg border border-orange-100/50 relative">
                          <div className="flex justify-between text-[10px] text-[#e05934] font-mono mb-1.5 font-bold">
                            <span>🔄 VidyaAI Accelerated Path</span>
                            <span>0.4 Days instantly</span>
                          </div>
                          <div className="w-full bg-orange-100/50 h-2.5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "8%" }}
                              className="h-full bg-[#e05934] rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeIndex === 1 && (
                    <motion.div
                      key="lead-bias"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">Section-on-Section Bias Matrix</span>
                        <span className="text-emerald-600 font-mono font-bold">Uniform Standard Delta</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="bg-white border border-gray-100 p-2.5 rounded-lg text-center">
                          <span className="text-[9px] text-gray-400 font-mono block">SEC A ACCURACY</span>
                          <span className="text-xs font-bold text-gray-900 block mt-1">98.5%</span>
                          <span className="text-[8px] text-emerald-600 font-mono block mt-0.5">Checked</span>
                        </div>
                        <div className="bg-white border border-gray-100 p-2.5 rounded-lg text-center">
                          <span className="text-[9px] text-gray-400 font-mono block">SEC B ACCURACY</span>
                          <span className="text-xs font-bold text-gray-900 block mt-1">98.5%</span>
                          <span className="text-[8px] text-emerald-600 font-mono block mt-0.5">Checked</span>
                        </div>
                        <div className="bg-white border border-gray-100 p-2.5 rounded-lg text-center">
                          <span className="text-[9px] text-gray-400 font-mono block">SEC C ACCURACY</span>
                          <span className="text-xs font-bold text-gray-900 block mt-1">98.5%</span>
                          <span className="text-[8px] text-emerald-600 font-mono block mt-0.5">Checked</span>
                        </div>
                      </div>

                      <div className="bg-stone-50 p-2 text-[10px] text-gray-500 rounded text-center font-mono">
                        System locked: All subjective grading calibrated directly against central key guidelines. 
                      </div>
                    </motion.div>
                  )}

                  {activeIndex === 2 && (
                    <motion.div
                      key="lead-progression"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">Concept Mastery Velocity</span>
                        <span className="text-[#e05934] font-mono font-bold">+14.2% Growth Index</span>
                      </div>

                      <div className="bg-[#fcfbf9] border border-stone-100 p-3 rounded-lg flex items-center justify-around h-16">
                        <div className="text-center">
                          <span className="text-gray-400 text-[9px] block uppercase font-mono">Initial Score</span>
                          <span className="text-sm font-bold text-gray-500 block">68.2%</span>
                        </div>
                        <div className="text-orange-300 text-xl font-bold">➔</div>
                        <div className="text-center">
                          <span className="text-[#e05934] text-[9px] block uppercase font-mono">remedial target</span>
                          <span className="text-sm font-bold text-[#e05934] block">82.4%</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeIndex === 3 && (
                    <motion.div
                      key="lead-parent"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">Parent Net Promoter Score (NPS)</span>
                        <span className="text-emerald-600 font-bold font-mono">9.6/10 rating</span>
                      </div>

                      <div className="flex items-center space-x-4 p-3 bg-stone-50 rounded-lg border border-stone-100/60">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0 select-none">
                          96%
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-900 leading-snug">Empirical Progress Transparency</p>
                          <p className="text-[10px] text-gray-500">Parents reported substantial clarity gain in identifying child struggle patterns.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeIndex === 4 && (
                    <motion.div
                      key="lead-hours"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">Returned Time Allocation (Monthly)</span>
                        <span className="text-emerald-600 font-bold font-mono">+32.5 Hours Retained</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="bg-stone-50/70 p-3 rounded-lg text-center border border-stone-100">
                          <span className="text-[9px] text-[#e05934] block font-mono">BEFORE VIDYAAI</span>
                          <span className="text-sm font-bold text-gray-900 block mt-1">45.0 hrs / mo</span>
                          <span className="text-[9px] text-gray-400 block mt-0.5">Paper counting / sorting</span>
                        </div>
                        <div className="bg-emerald-50/40 p-3 rounded-lg text-center border border-emerald-100/50">
                          <span className="text-[9px] text-emerald-700 block font-mono">AFTER VIDYAAI</span>
                          <span className="text-sm font-bold text-emerald-600 block mt-1">12.5 hrs / mo</span>
                          <span className="text-[9px] text-emerald-500 block mt-0.5">Quick diagnostic validation</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeIndex === 5 && (
                    <motion.div
                      key="lead-scale"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs col-span-2">
                        <span className="font-semibold text-gray-800">Curriculum Compliance Matrices</span>
                        <span className="text-emerald-600 font-mono font-bold">100% Alignment verified</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                        <div className="p-2 border border-stone-100 bg-white rounded-md flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>CBSE Competency Matrix</span>
                        </div>
                        <div className="p-2 border border-stone-100 bg-white rounded-md flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>NEP 2020 Pedagogical standards</span>
                        </div>
                        <div className="p-2 border border-stone-100 bg-white rounded-md flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Custom Board Rubrics mapper</span>
                        </div>
                        <div className="p-2 border border-stone-100 bg-white rounded-md flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Subjective grading parameters checklist</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Mockup Screen Footer details block */}
              <div className="bg-stone-50 border border-stone-100/50 p-3 rounded-lg flex items-center justify-between text-[10px] text-gray-500 select-none">
                <span className="font-mono">PROJECTED ANNUAL SAVINGS PER SECTION:</span>
                <span className="text-[#e05934] font-extrabold font-mono flex items-center gap-0.5">
                  <DollarSign className="w-3 h-3 text-[#e05934]" /> 3,400+
                </span>
              </div>

            </div>

            {/* Bottom device stats parameters */}
            <div className="border-t border-stone-100 pt-3 mt-4 text-[9px] font-mono text-gray-400 flex justify-between select-none">
              <span>SECURITY CERTIFIED SSL</span>
              <span>CALIBRATED FOR NATIONAL CURRICULA</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
