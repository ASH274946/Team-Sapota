'use client';

import React, { useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  X,
  Award,
  BookOpen,
  Layers,
  Sparkles,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface BlueprintQuestionItem {
  id: string;
  qNo: string;
  questionText: string;
  coId: string;
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  marks: number;
  isChoice?: boolean;
}

export interface BlueprintSectionData {
  sectionName: string;
  instructions: string;
  totalSectionMarks: number;
  questions: BlueprintQuestionItem[];
}

export interface ComprehensiveBlueprint {
  id: string;
  title: string;
  examType: string;
  duration: string;
  totalMarks: number;
  difficulty: 'EASY' | 'MODERATE' | 'CHALLENGING';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED';
  createdAt: string;
  sections: BlueprintSectionData[];
  bloomDistribution: {
    rememberUnderstand: number;
    applyAnalyze: number;
    evaluateCreate: number;
  };
  coMarksDistribution: Record<string, number>;
}

interface ExamPaperBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: ComprehensiveBlueprint | null;
  courseCode: string;
  courseName: string;
  academicYear?: string;
  department?: string;
  onRegenerateQuestions?: (bpId: string) => void;
}

export const ExamPaperBlueprintModal: React.FC<ExamPaperBlueprintModalProps> = ({
  isOpen,
  onClose,
  blueprint,
  courseCode,
  courseName,
  academicYear = '2025-2026',
  department = 'Computer Science & Engineering',
  onRegenerateQuestions
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !blueprint) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = `UNIVERSITY ASSESSMENT QUESTION PAPER BLUEPRINT SPECIFICATION\n`;
    csv += `Exam Title: ${blueprint.title}, Course: ${courseCode} - ${courseName}, Duration: ${blueprint.duration}, Total Marks: ${blueprint.totalMarks}\n\n`;
    csv += `Section,Question No,Question Text,Course Outcome (CO),Bloom Level,Marks\n`;

    blueprint.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        csv += `"${sec.sectionName}","${q.qNo}","${q.questionText.replace(/"/g, '""')}","${q.coId}","${q.bloomLevel}",${q.marks}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Blueprint_${blueprint.title.replace(/\s+/g, '_')}_${courseCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported Question Paper Blueprint CSV!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500 text-white">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Question Paper Blueprint & Specification Dossier
              </h3>
              <p className="text-xs text-neutral-400">
                Official NBA Criterion 4 & Bloom's Taxonomy Cognitive Weightage Specification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRegenerateQuestions && (
              <button
                onClick={() => onRegenerateQuestions(blueprint.id)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="size-3.5" /> ⚡ AI Regenerate Questions
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white flex items-center gap-1.5 border border-neutral-700 cursor-pointer"
            >
              <Download className="size-3.5" /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="size-3.5" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content */}
        <div ref={printRef} className="p-8 overflow-y-auto space-y-8 bg-white text-slate-900">
          {/* Header Metadata */}
          <div className="border-b-2 border-neutral-900 pb-6 text-center space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              DEPARTMENT OF {department.toUpperCase()} — EXAMINATION BLUEPRINT
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase">
              {blueprint.title}
            </h1>
            <p className="text-xs font-medium text-neutral-600">
              Outcome-Based Assessment Question Paper & Cognitive Mapping Specification
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 mt-4 border-t border-neutral-200 text-left text-xs">
              <div>
                <span className="font-bold text-neutral-400 uppercase text-[10px]">Course Code & Title</span>
                <p className="font-extrabold text-neutral-900">{courseCode}: {courseName}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase text-[10px]">Duration & Total Marks</span>
                <p className="font-extrabold text-neutral-900">{blueprint.duration} • {blueprint.totalMarks} Marks</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase text-[10px]">Difficulty Rating</span>
                <p className="font-extrabold text-orange-600">{blueprint.difficulty}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase text-[10px]">Approval Status</span>
                <p className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> {blueprint.status}
                </p>
              </div>
            </div>
          </div>

          {/* Cognitive Weightage Distribution Summary */}
          <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
              <BarChart3 className="size-4 text-orange-500" /> Bloom's Cognitive Level Weightage Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-neutral-200">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Remember & Understand</div>
                <div className="text-lg font-black text-blue-600">{blueprint.bloomDistribution.rememberUnderstand}%</div>
                <div className="text-[10px] text-neutral-400">Target: ~20%</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-neutral-200">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Apply & Analyze</div>
                <div className="text-lg font-black text-indigo-600">{blueprint.bloomDistribution.applyAnalyze}%</div>
                <div className="text-[10px] text-neutral-400">Target: ~50%</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-neutral-200">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Evaluate & Create</div>
                <div className="text-lg font-black text-emerald-600">{blueprint.bloomDistribution.evaluateCreate}%</div>
                <div className="text-[10px] text-neutral-400">Target: ~30%</div>
              </div>
            </div>
          </div>

          {/* Formatted Question Paper Breakdown per Section */}
          <div className="space-y-6">
            {blueprint.sections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-neutral-900 uppercase">{sec.sectionName}</h3>
                    <p className="text-xs text-neutral-500 italic">{sec.instructions}</p>
                  </div>
                  <span className="text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded border border-orange-200">
                    {sec.totalSectionMarks} Marks
                  </span>
                </div>

                <div className="space-y-2.5">
                  {sec.questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 bg-white rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-neutral-900 min-w-[32px]">{q.qNo}.</span>
                          <span className="font-semibold text-neutral-800">{q.questionText}</span>
                        </div>
                        {q.isChoice && (
                          <div className="text-[11px] text-amber-700 font-bold pl-10 italic">
                            [ OR Alternative Choice Question ]
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                        <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {q.coId}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-600 uppercase bg-neutral-100 px-2 py-0.5 rounded">
                          {q.bloomLevel}
                        </span>
                        <span className="font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {q.marks} Marks
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Official Signatures */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs border-t border-neutral-200">
            <div>
              <div className="h-10 border-b border-dashed border-neutral-400 mb-2 max-w-[200px] mx-auto"></div>
              <p className="font-bold text-neutral-900">Question Paper Setter Signature</p>
              <p className="text-neutral-500 text-[11px]">Subject Matter Expert</p>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-neutral-400 mb-2 max-w-[200px] mx-auto"></div>
              <p className="font-bold text-neutral-900">Moderator / HOD Approval Signature</p>
              <p className="text-neutral-500 text-[11px]">Academic Audit Committee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
