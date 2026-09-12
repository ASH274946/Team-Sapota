'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, ChevronDown, ChevronUp, FileText, User } from 'lucide-react';

export interface AttemptedStudent {
  id: string;
  studentName?: string;
  studentId: string;
  status: string;
  submittedAt: string;
  evaluations?: Array<{ score: number }>;
}

export interface GeneratedQuestionPaperPreview {
  title: string;
  totalMarks: number;
  pdfUrl?: string | null;
  sections: Array<{ title: string; instruction?: string; questions: Array<{ question: string; marks: number }> }>;
}

interface AssessmentUploadViewProps {
  assignmentTitle: string;
  onBack: () => void;
  questionPaper: GeneratedQuestionPaperPreview | null;
  questionPaperLoading?: boolean;
  attemptedStudents: AttemptedStudent[];
  submissionsLoading?: boolean;
  onStartMapping: (studentIds: string[]) => Promise<void>;
  onEvaluateSelected: (studentIds: string[]) => Promise<void>;
}

export function AssessmentUploadView({ assignmentTitle, onBack, questionPaper, questionPaperLoading, attemptedStudents, submissionsLoading, onStartMapping, onEvaluateSelected }: AssessmentUploadViewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  const start = async () => {
    if (!selectedStudents.length) return;
    setStarting(true);
    try {
      await onStartMapping(selectedStudents);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 w-full min-h-[calc(100vh-9rem)] select-none" id="assessment-upload-view">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center pt-2 pb-10">
        <button onClick={onBack} className="self-start inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to assignments
        </button>
        <div className="text-center flex flex-col items-center gap-1.5 mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight flex items-center justify-center gap-2.5 flex-wrap">
            <span>Upload</span>
            <span className="text-[#ea580c] underline decoration-[#ea580c] decoration-2 underline-offset-4 bg-[#ffedd5] px-3.5 py-1 rounded-lg inline-block">Question Paper &amp; Answer Sheets</span>
          </h1>
          <p className="text-neutral-600 text-sm">{assignmentTitle} · Upload both files to get started</p>
        </div>

        <div className="relative my-3 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full bg-[#ffedd5]/60 border border-[#fed7aa]/50 flex items-center justify-center p-3 relative shadow-2xs">
            <div className="w-20 h-20 rounded-full bg-[#1e293b] text-white flex items-center justify-center shadow-md"><BookOpen className="w-8 h-8" /></div>
            <div className="absolute top-3 right-8 w-3.5 h-3.5 rounded-full bg-[#f97316] ring-2 ring-white" />
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#f97316] ring-2 ring-white" />
            <div className="absolute bottom-4 right-4 w-3.5 h-3.5 rounded-full bg-[#f97316] ring-2 ring-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl my-5 px-2">
          <div className="border border-neutral-200 rounded-3xl p-5 bg-white shadow-2xs min-h-[150px] flex flex-col justify-between">
            <div className="flex items-center gap-3.5"><div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-orange-600" /></div><div className="min-w-0"><p className="text-xs font-bold text-neutral-900 truncate">{questionPaperLoading ? 'Loading generated paper…' : questionPaper?.title || 'Assignment question paper'}</p><p className="text-[11px] text-neutral-500 mt-0.5">{questionPaper ? `${questionPaper.totalMarks} marks · Already generated` : 'No generated paper found'}</p></div></div>
            <div className="flex items-center justify-between mt-4"><span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${questionPaper ? 'text-emerald-600' : 'text-amber-600'}`}>{questionPaper ? <><CheckCircle className="w-3 h-3" /> Ready for mapping</> : 'Generate the paper first'}</span>{questionPaper && <button onClick={() => setShowPreview((value) => !value)} className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1">Preview {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>}</div>
            {showPreview && questionPaper && <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-orange-100 bg-orange-50/40 p-3 text-xs text-neutral-700">{questionPaper.sections.map((section, sectionIndex) => <div key={`${section.title}-${sectionIndex}`} className="mb-3 last:mb-0"><p className="font-bold text-neutral-900">{section.title}</p>{section.questions.map((question, questionIndex) => <p key={`${question.question}-${questionIndex}`} className="mt-1">{questionIndex + 1}. {question.question} <span className="text-neutral-400">({question.marks})</span></p>)}</div>)}</div>}
          </div>

          <div className="border border-neutral-200 rounded-3xl p-5 bg-white shadow-2xs min-h-[150px] flex flex-col justify-between">
            <button onClick={() => setShowStudents((value) => !value)} className="w-full text-left"><div className="flex items-center gap-3.5"><div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-orange-600" /></div><div className="min-w-0"><p className="text-xs font-bold text-neutral-900">Upload Answer Sheets</p><p className="text-[11px] text-neutral-500 mt-0.5">{submissionsLoading ? 'Loading attempted students…' : `${attemptedStudents.length} student${attemptedStudents.length === 1 ? '' : 's'} already attempted`}</p></div></div></button>
            <div className="flex items-center justify-between mt-4"><span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><CheckCircle className="w-3 h-3" /> Select students to evaluate</span><span className="text-xs font-bold text-orange-600 inline-flex items-center gap-1">Choose {showStudents ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span></div>
            {showStudents && <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/40 p-3"><div className="flex items-center justify-between mb-2 gap-2"><label className="text-xs font-bold text-neutral-900 inline-flex items-center gap-2"><input type="checkbox" checked={selectedStudents.length === attemptedStudents.length && attemptedStudents.length > 0} onChange={(event) => setSelectedStudents(event.target.checked ? attemptedStudents.map((student) => student.id) : [])} /> Select all</label><div className="flex items-center gap-2"><button disabled={!selectedStudents.length || starting} onClick={() => onEvaluateSelected(selectedStudents)} className="text-xs font-bold text-orange-600 disabled:text-neutral-400">Evaluate selected</button><button disabled={!attemptedStudents.length || starting} onClick={() => onEvaluateSelected(attemptedStudents.map((student) => student.id))} className="text-xs font-bold text-neutral-800 disabled:text-neutral-400">Evaluate all</button></div></div><div className="max-h-44 overflow-y-auto space-y-1">{attemptedStudents.map((student) => <div key={student.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 text-xs"><label className="inline-flex items-center gap-2 min-w-0"><input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={(event) => setSelectedStudents((current) => event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id))} /><span className="truncate">{student.studentName || student.studentId}</span></label><div className="flex items-center gap-2"><span className="text-[10px] text-neutral-400">{student.evaluations?.[0] ? `${student.evaluations[0].score} marks` : student.status}</span><button disabled={starting} onClick={() => onEvaluateSelected([student.id])} className="text-[10px] font-bold text-orange-600 disabled:text-neutral-400">Evaluate</button></div></div>)}</div>{attemptedStudents.length === 0 && <p className="text-xs text-neutral-500 py-2">No attempted students found for this assignment.</p>}</div>}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 mt-2 pb-2">
          <button disabled={!questionPaper || !selectedStudents.length || starting} onClick={start} className={`py-2.5 px-8 rounded-full flex items-center justify-center gap-2 font-bold text-sm transition-all ${questionPaper && selectedStudents.length && !starting ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-md' : 'bg-[#cbd5e1] text-white cursor-not-allowed'}`}>
            <span>{starting ? 'Mapping & Evaluating...' : 'Start Mapping'}</span><ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-neutral-400 text-center max-w-md">{questionPaper && selectedStudents.length ? 'Paper ready — Click to evaluate the selected attempted students' : 'Select attempted students to get started'}</p>
        </div>
      </div>
    </div>
  );
}
