import React, { useState } from "react";
import { Sparkles, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface QuestionGrading {
  num: string;
  qn: string;
  answer: string;
  score: string;
  points: string;
  feedback: string;
  status: "correct" | "incorrect" | "partial";
}

interface StudentSubmission {
  student: string;
  scannedImage: string;
  totalGrade: string;
  questions: QuestionGrading[];
}

interface AssignmentData {
  title: string;
  class: string;
  avgGrade: string;
  submissions: string;
  dueDate: string;
  submissionsList: StudentSubmission[];
}

export default function AssessmentGrader() {
  const assignments: AssignmentData[] = [
    {
      title: "Assignment on Motion",
      class: "Class 10 - Section A",
      avgGrade: "74%",
      submissions: "28/30",
      dueDate: "June 15, 2026",
      submissionsList: [
        {
          student: "Aarav Sharma",
          scannedImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
          totalGrade: "28/30",
          questions: [
            {
              num: "Q1",
              qn: "State Newton's First Law and write an example from daily life.",
              answer: "An object will remain at rest or move in a straight line unless acted upon by an external net force. Example: A dining cup is steady on the table until pushed.",
              score: "10/10",
              points: "10 pts",
              feedback: "Accurate theoretical formulation and clear everyday experience example. Exemplary placement.",
              status: "correct"
            },
            {
              num: "Q2",
              qn: "Calculate acceleration if speed increases from 0m/s to 20m/s in 4 seconds.",
              answer: "using a = (v - u) / t, we get a = (20 - 0)/4 = 5 m/s^2.",
              score: "10/10",
              points: "10 pts",
              feedback: "Excellent. Step-by-step formula and values substituted perfectly. Unit included.",
              status: "correct"
            },
            {
              num: "Q3",
              qn: "Does uniform speed imply constant velocity?",
              answer: "Yes, because if the speed doesn't change, the velocity stays identical.",
              score: "8/10",
              points: "10 pts",
              feedback: "Requires caution. Direct velocity can transform if direction alters, even when speed is uniform (e.g. circular motion).",
              status: "partial"
            }
          ]
        },
        {
          student: "Kunal Verma",
          scannedImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop",
          totalGrade: "15/30",
          questions: [
            {
              num: "Q1",
              qn: "State Newton's First Law and write an example from daily life.",
              answer: "Objects don't change states unless pushed. Example: Moving car.",
              score: "5/10",
              points: "10 pts",
              feedback: "Vague. Rephrase to clearly outline 'inertia' or 'unbalanced external net forces'. Example needs more detail.",
              status: "partial"
            },
            {
              num: "Q2",
              qn: "Calculate acceleration if speed increases from 0m/s to 20m/s in 4 seconds.",
              answer: "Acceleration is velocity times time. So 20 * 4 = 80 m/s^2.",
              score: "0/10",
              points: "10 pts",
              feedback: "Incorrect formula. Acceleration is velocity rate change, divided by time, not multiplied.",
              status: "incorrect"
            },
            {
              num: "Q3",
              qn: "Does uniform speed imply constant velocity?",
              answer: "No, because circular tracks have changing direction.",
              score: "10/10",
              points: "10 pts",
              feedback: "Perfect. Correctly identified direction vectors.",
              status: "correct"
            }
          ]
        }
      ]
    },
    {
      title: "Quiz on Electricity",
      class: "Class 10 - Section B",
      avgGrade: "82%",
      submissions: "24/25",
      dueDate: "June 18, 2026",
      submissionsList: [
        {
          student: "Ananya Saxena",
          scannedImage: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop",
          totalGrade: "18/20",
          questions: [
            {
              num: "Q1",
              qn: "Define Ohm's Law and its mathematical formula.",
              answer: "Voltage is directly proportional to current. V = I * R.",
              score: "10/10",
              points: "10 pts",
              feedback: "Excellent accuracy. Constant temperature assumption wasn't mentioned but math equation is spot-on.",
              status: "correct"
            },
            {
              num: "Q2",
              qn: "What is equivalent resistance of 2 ohm and 3 ohm in parallel?",
              answer: "Req = 2 + 3 = 5 ohm.",
              score: "8/10",
              points: "10 pts",
              feedback: "Caution. That is the series formula. Parallel should be 1/Req = 1/2 + 1/3 = 5/6, so Req = 1.2 ohm.",
              status: "partial"
            }
          ]
        },
        {
          student: "Rohan Kapoor",
          scannedImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop",
          totalGrade: "20/20",
          questions: [
            {
              num: "Q1",
              qn: "Define Ohm's Law and its mathematical formula.",
              answer: "At constant temperature, the current passing through a conductor is directly proportional to the potential difference across its terminals. V = I * R.",
              score: "10/10",
              points: "10 pts",
              feedback: "Flawless theoretical definition including the critical temperature constraint.",
              status: "correct"
            },
            {
              num: "Q2",
              qn: "What is equivalent resistance of 2 ohm and 3 ohm in parallel?",
              answer: "1/Rp = 1/2 + 1/3 = 3/6 + 2/6 = 5/6. Therefore, Rp = 6/5 = 1.2 ohms.",
              score: "10/10",
              points: "10 pts",
              feedback: "Beautiful step-by-step fraction conversion and correct final unit representation.",
              status: "correct"
            }
          ]
        }
      ]
    }
  ];

  const [selectedAsgIndex, setSelectedAsgIndex] = useState(0);
  const [selectedStudIndex, setSelectedStudIndex] = useState(0);

  const activeAsg = assignments[selectedAsgIndex];
  // Guard student indices
  const activeStud = activeAsg.submissionsList[selectedStudIndex] || activeAsg.submissionsList[0];

  return (
    <section className="py-24 bg-white" id="teachers">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Block */}
        <div className="text-center max-w-4xl mx-auto mb-16 px-4">
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[#e05934] uppercase bg-orange-100/50 border border-orange-200/50 px-3 py-1.5 rounded-full inline-block mb-3">
            Core Interface
          </span>
          <h2 className="font-display font-medium text-2xl sm:text-3xl md:text-4xl text-gray-900 tracking-tight leading-snug">
            AI Assignment & Assessment Grader
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-lg mx-auto">
            A clear, intuitive dashboard reveals performance trends, learning gaps, and data-driven recommendations for every class.
          </p>
        </div>

        {/* Outer Grid Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto lg:h-[660px] min-h-[auto]">
          
          {/* Left Column: Grade Deck Selection list (4 columns) */}
          <div className="lg:col-span-4 flex flex-col h-full bg-white border border-[#f3ede4] rounded-2xl shadow-md overflow-hidden">
            
            {/* Top portion: Select Assessment */}
            <div className="p-4 border-b border-gray-100 flex flex-col flex-1 min-h-0">
              <h4 className="text-xs font-semibold uppercase font-mono tracking-widest text-gray-400 mb-2.5 pl-1">
                Select Assessment
              </h4>
              <div className="space-y-2.5 overflow-y-auto pr-1.5 flex-1 scrollbar-thin">
                {assignments.map((asg, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedAsgIndex(idx);
                      setSelectedStudIndex(0);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 ${
                      selectedAsgIndex === idx
                        ? "bg-[#e05934]/5 border-[#e05934] shadow-2xs"
                        : "bg-[#fcfbf9] border-gray-150 hover:bg-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#e05934]">{asg.class}</p>
                    <h5 className="font-display font-bold text-gray-905 mt-0.5 text-xs sm:text-sm">{asg.title}</h5>
                    
                    <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500 font-mono">
                      <span>Avg: <strong className="text-gray-850 font-bold">{asg.avgGrade}</strong></span>
                      <span>Graded: <strong className="text-[#e05934] font-bold">{asg.submissions}</strong></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Middle portion: Students submission selectors */}
            <div className="p-4 border-b border-gray-100 h-[190px] flex flex-col min-h-0 bg-[#fcfbf9]/50">
              <h5 className="text-[9px] font-mono font-bold uppercase tracking-wide text-gray-400 mb-2.5 pl-1 block">Submissions evaluated</h5>
              <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 scrollbar-thin">
                {activeAsg.submissionsList.map((sub, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedStudIndex(idx)}
                    className={`w-full text-xs font-medium py-2 px-2.5 rounded-lg flex items-center justify-between transition-colors ${
                      selectedStudIndex === idx
                        ? "bg-black text-white shadow-xs"
                        : "bg-white border border-gray-150 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span>{sub.student}</span>
                    <span className="font-mono text-[9px] bg-[#e05934]/10 text-[#e05934] px-1.5 py-0.5 rounded-md font-bold">
                      {sub.totalGrade}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom portion: Class overview metrics summary */}
            <div className="bg-[#fcfbf9] p-4 space-y-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 uppercase font-mono tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-[#e05934]" /> Metrics Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-gray-50 shadow-3xs">
                  <span className="text-[8px] font-mono text-gray-400 uppercase block">Class Avg</span>
                  <span className="text-xs font-bold text-gray-900">{activeAsg.avgGrade}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-50 shadow-3xs">
                  <span className="text-[8px] font-mono text-gray-400 uppercase block">Completed</span>
                  <span className="text-xs font-bold text-emerald-600 font-mono">100%</span>
                </div>
              </div>
              <div className="space-y-1.5 text-[9px] text-gray-500 font-sans leading-relaxed pt-1.5 border-t border-gray-100">
                <p className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0"></span> High score in batch: <strong className="text-gray-800 font-mono">28/30</strong>
                </p>
                <p className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span> Primary concept gap: <strong className="text-gray-800 font-sans font-medium">Newtonian vectors</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Active scanned paper evaluations (8 columns) */}
          <div className="lg:col-span-8 bg-white border border-[#f3ede4] rounded-2xl shadow-lg flex flex-col h-full overflow-hidden">
              
              {/* Header inside paper evaluation */}
              <div className="bg-[#fcfbf9] px-6 py-4 border-b border-[#f3ede4] flex items-center justify-between flex-wrap gap-2 shrink-0">
                <div>
                  <span className="text-[10px] font-mono text-[#e05934] uppercase font-bold tracking-wider">VEDAAI RUBRIC EVALUATION</span>
                  <h4 className="font-display font-medium text-gray-900 text-sm sm:text-base leading-snug mt-0.5">
                    {activeStud?.student}'s Sheet — {activeAsg.title}
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400 font-mono">Total score:</span>
                  <span className="bg-emerald-500 text-white font-mono font-extrabold text-sm px-2.5 py-1 rounded">
                    {activeStud?.totalGrade}
                  </span>
                </div>
              </div>

              {/* Inner evaluations content */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-thin">
                {activeStud?.questions.map((qn, idx) => (
                  <div key={idx} className="border-l-2 pl-4 border-gray-100 hover:border-[#e05934] transition-colors relative space-y-2.5">
                    
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold bg-[#fcfbf9] border border-gray-100 rounded px-1.5 py-0.5 text-[#e05934]">
                          {qn.num}
                        </span>
                        <span className="text-xs font-semibold text-gray-700 font-mono">
                          {qn.points}
                        </span>
                      </div>

                      {/* Status badge representation */}
                      {qn.status === "correct" ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 font-mono uppercase">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Full Credit
                        </span>
                      ) : qn.status === "partial" ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 font-mono uppercase">
                          <AlertCircle className="w-3.5 h-3.5 mr-1" /> Partial Credit
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 font-mono uppercase">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> No Credit
                        </span>
                      )}
                    </div>

                    {/* Question text */}
                    <div>
                      <p className="text-xs text-gray-400 font-medium font-mono leading-none">QUESTION</p>
                      <p className="text-xs sm:text-sm text-gray-800 font-semibold mt-1 leading-snug">{qn.qn}</p>
                    </div>

                    {/* Student handwritten representation */}
                    <div className="bg-[#fcfbf9] p-3.5 rounded-lg border border-dashed border-[#f3ede4] relative">
                      <p className="text-[10px] text-gray-400 font-medium font-mono leading-none">STUDENT RESPONSE</p>
                      <p className="text-xs sm:text-sm text-gray-750 font-serif leading-relaxed italic mt-1.5 pr-8">
                        "{qn.answer}"
                      </p>
                      
                      {/* Floating red pen trace illustration */}
                      <span className="absolute bottom-2.5 right-3 text-[10px] text-emerald-600 font-bold font-mono tracking-tight bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                        {qn.score}
                      </span>
                    </div>

                    {/* Custom AI Feedback */}
                    <div className="bg-orange-50/40 p-3.5 rounded-lg border border-orange-100/30 flex items-start space-x-2.5">
                      <Sparkles className="w-4 h-4 text-[#e05934] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-[#e05934] font-bold font-mono tracking-wide leading-none uppercase">AI feedback & recommendation</p>
                        <p className="text-xs text-gray-700 leading-relaxed mt-1">{qn.feedback}</p>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Bottom Quick Bar inside card */}
              <div className="bg-[#fcfbf9] px-6 py-4 border-t border-gray-100 text-xs flex justify-between items-center text-gray-400 font-sans">
                <span className="inline-flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Checked in 0.4 seconds via VidyaAI Evaluation engine.
                </span>
                <span className="font-mono text-[10px]">VERB_VECT: 8B_L2</span>
              </div>

            </div>

          </div>

      </div>
    </section>
  );
}
