'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  Zap,
  Star,
  Edit3,
  Eye,
  Check,
  Download,
  Upload,
  ArrowLeft,
  Send,
  HelpCircle,
} from 'lucide-react';
import {
  fetchAssignment,
  generateAssignment,
  fetchAssignmentHistory,
} from '@/services/assignment.service';
import { fetchPaper } from '@/services/paper.service';
import { useGenerationSocket } from '@/hooks/useSocket';
import { useGenerationStore } from '@/store/generation.store';
import { GenerationScreen } from '@/components/generation/GenerationScreen';
import { useAssignmentPhase } from '@/hooks/useAssignmentPhase';
import { useAuthStore } from '@/store/auth.store';
import type { Assignment } from '@/types/assignment.types';
import type { GeneratedPaper } from '@/types/paper.types';

const WORKFLOW_STEPS = [
  { key: 'DRAFT', label: 'Draft', icon: FileText },
  { key: 'generated', label: 'Generated', icon: Zap },
  { key: 'COMPLETED', label: 'Completed', icon: Check },
];

const BADGE_MAP: Record<string, string> = {
  draft: 'badge-draft',
  queued: 'badge-queued',
  generating: 'badge-generating',
  completed: 'badge-completed',
  failed: 'badge-failed',
  partially_generated: 'badge-warning',
  approved: 'badge-completed',
  published: 'badge-completed',
  active: 'badge-completed',
};

function getWorkflowStep(status: string | Assignment['status']): number {
  if (status === 'DRAFT') return 0;
  if (['QUEUED', 'GENERATING'].includes(status)) return 1;
  if (['COMPLETED', 'PARTIALLY_GENERATED', 'APPROVED', 'PUBLISHED', 'ACTIVE'].includes(status)) return 2;
  return 0;
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, hasPermission } = useAuthStore();
  const isFaculty = user?.role === 'TEACHER' || user?.role === 'FACULTY';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN';
  const canApprove = hasPermission(['ADMIN', 'SUPER_ADMIN']);
  const isStudent = user?.role === 'STUDENT';

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [paperHistory, setPaperHistory] = useState<any[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showGenScreen, setShowGenScreen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Student specific submission state
  const [submissionMode, setSubmissionMode] = useState<'ONLINE' | 'UPLOAD'>('ONLINE');
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  const hasAutoQueuedRef = useRef(false);
  const wasGeneratingRef = useRef(false);
  const retryCooldownRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollErrorsRef = useRef(0);
  const { stage, status, message, error, reset, setQueued, setWarning } = useGenerationStore();

  useGenerationSocket(id);

  const loadAssignmentData = useCallback(async () => {
    try {
      const data = await fetchAssignment(id);
      setAssignment(data);
      setFetchError(null);
    } catch (e: any) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAssignmentData();
    if (!isStudent) {
      fetchAssignmentHistory(id).then(setPaperHistory).catch(console.error);
    }
  }, [id, isStudent, loadAssignmentData]);

  // Try to load saved draft from local storage for students
  useEffect(() => {
    if (isStudent && id) {
      const saved = localStorage.getItem(`vidya_draft_${id}`);
      if (saved) {
        try {
          setStudentAnswers(JSON.parse(saved));
        } catch {
          // ignore parsing error
        }
      }
    }
  }, [isStudent, id]);

  const updateAnswer = (qKey: string, val: string) => {
    const updated = { ...studentAnswers, [qKey]: val };
    setStudentAnswers(updated);
    if (id) {
      localStorage.setItem(`vidya_draft_${id}`, JSON.stringify(updated));
    }
  };

  // Listen for generation completion events and refresh assignment immediately
  useEffect(() => {
    const { status: currentStatus } = useGenerationStore.getState();
    if (currentStatus === 'completed' || currentStatus === 'partial_success') {
      loadAssignmentData();
      if (!isStudent) {
        fetchAssignmentHistory(id).then(setPaperHistory).catch(console.error);
      }
    }
  }, [id, status, isStudent, loadAssignmentData]);

  useEffect(() => {
    if (!assignment) return;
    const loadPaperAndQuestions = async () => {
      if (['COMPLETED', 'PARTIALLY_GENERATED', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE'].includes(assignment.status)) {
        try {
          const p = await fetchPaper(id, selectedPaperId);
          setPaper(p);
        } catch {
          /* ignore */
        }
      }
    };
    void loadPaperAndQuestions();
  }, [assignment, id, selectedPaperId]);

  useEffect(() => {
    if (fetchError) toast.error(fetchError, { id: 'fetch-error', position: 'bottom-center' });
  }, [fetchError]);

  useEffect(() => {
    if (error) toast.error(error, { id: 'generation-error', position: 'bottom-center' });
  }, [error]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const [isSubmittingForApproval, setIsSubmittingForApproval] = useState(false);

  const handleSendForApproval = async () => {
    setIsSubmittingForApproval(true);
    try {
      await api.post(`/assignments/${id}/submit`);
      toast.success('Submitted for approval');
      setAssignment((prev) => (prev ? { ...prev, status: 'PENDING_APPROVAL' as any } : prev));
    } catch {
      toast.error('Failed to submit for approval');
    } finally {
      setIsSubmittingForApproval(false);
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handleStudentSubmit = async () => {
    if (submissionMode === 'UPLOAD') {
      if (!submissionFile) {
        toast.error('Please select a solution file to upload');
        return;
      }
      if (submissionFile.size > 25 * 1024 * 1024) {
        toast.error('File size cannot exceed 25MB');
        return;
      }
    } else {
      const answeredCount = Object.values(studentAnswers).filter((a) => a && a.trim().length > 0).length;
      if (answeredCount === 0) {
        toast.error('Please write at least one answer before submitting');
        return;
      }
    }

    setIsSubmittingTest(true);
    try {
      if (submissionMode === 'UPLOAD' && submissionFile) {
        const formData = new FormData();
        formData.append('files', submissionFile);
        await api.post(`/student/assessments/${id}/submit`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/student/assessments/${id}/submit`, {
          answers: studentAnswers,
        });
      }

      toast.success('Assessment submitted successfully!');
      if (id) {
        localStorage.removeItem(`vidya_draft_${id}`);
      }
      setAssignment((prev) =>
        prev
          ? {
              ...prev,
              studentSubmission: {
                id: 'sub-new',
                assignmentId: id,
                studentId: user?.id || '',
                organizationId: (prev as any).organizationId || '',
                fileUrl: '',
                fileType: submissionMode === 'UPLOAD' ? 'FILE_UPLOAD' : 'ONLINE_SUBMISSION',
                status: 'SUBMITTED',
                submittedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as any,
            }
          : prev
      );
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to submit assignment');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await api.post(`/assignments/${id}/publish`);
      toast.success('Assignment published to students');
      setAssignment((prev) => (prev ? { ...prev, status: 'PUBLISHED' as any } : prev));
    } catch {
      toast.error('Failed to publish assignment');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAdminApprove = async () => {
    setIsPublishing(true);
    try {
      await api.post(`/admin/approvals/${id}/approve`);
      toast.success('Assignment approved and published to students');
      setAssignment((prev) => (prev ? { ...prev, status: 'PUBLISHED' as any } : prev));
    } catch {
      toast.error('Failed to approve and publish assignment');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (retryCooldownRef.current) return;
    retryCooldownRef.current = true;
    wasGeneratingRef.current = true;
    setIsRetrying(true);
    setShowGenScreen(true);
    try {
      const queued = await generateAssignment(id);
      setQueued(queued.jobRecordId, queued.generationSeq, 0, Date.now());
      setAssignment((prev) => (prev ? { ...prev, status: 'QUEUED' } : prev));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to queue generation';
      if (msg.toLowerCase().includes('already in progress')) {
        setAssignment((prev) => (prev ? { ...prev, status: 'QUEUED' } : prev));
        return;
      }
      toast.error(msg);
    } finally {
      setIsRetrying(false);
      setTimeout(() => {
        retryCooldownRef.current = false;
      }, 3000);
    }
  }, [id, setQueued]);

  const handleViewPaper = useCallback(() => {
    router.push(`/assignments/${id}/paper`);
  }, [id, router]);

  const showGeneration = ['QUEUED', 'GENERATING'].includes(assignment?.status ?? '');
  const genMeta = assignment?.generationMeta;
  const canonical = assignment?.generationState?.canonicalMetadata ?? paper?.canonicalMetadata;
  const requestedQuestionCount = canonical?.requestedQuestionCount ?? assignment?.questionConfig?.count ?? 0;
  const generatedQuestionCount = canonical?.generatedQuestionCount ?? genMeta?.generatedQuestionCount ?? null;
  const generatedMarks = canonical?.generatedMarks ?? genMeta?.generatedMarks ?? null;
  const requestedMarks = canonical?.requestedMarks ?? assignment?.totalMarks;
  const isPartial = assignment?.status === 'PARTIALLY_GENERATED';
  const failureReason = genMeta?.failureReason || error || null;

  const isGenActive =
    showGenScreen &&
    stage !== null &&
    [
      'QUEUED',
      'EXTRACTING_CONTENT',
      'TOPIC_PREPROCESSING',
      'GENERATION_PLANNING',
      'BATCH_GENERATING',
      'VALIDATING',
      'ANSWER_KEY_GENERATING',
      'PDF_COMPOSING',
      'PERSISTING',
      'PDF-GENERATING',
    ].includes(stage as string);

  const phase = useAssignmentPhase({
    isLoading: loading,
    error: fetchError,
    isProcessing: isGenActive || showGeneration,
    isComplete:
      !isGenActive &&
      !showGeneration &&
      ['COMPLETED', 'PARTIALLY_GENERATED', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE'].includes(
        assignment?.status ?? ''
      ),
  });

  if (loading) {
    return (
      <div className="assignment-page max-w-[1200px] mx-auto p-4 md:p-8">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 36, width: '180px', borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-24 h-24 mb-4 relative opacity-80">
          <Image src="/empty-state.png" alt="" fill sizes="100px" style={{ objectFit: 'contain' }} />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-1">Assignment Not Available</h2>
        <p className="text-sm text-neutral-500 max-w-md mb-6">
          The requested assignment could not be retrieved. It may still be in preparation or assigned to a different class.
        </p>
        <Link
          href={isStudent ? '/student/assessments' : '/dashboard'}
          className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition-colors"
        >
          Back to {isStudent ? 'Assessments' : 'Dashboard'}
        </Link>
      </div>
    );
  }

  const currentStep = getWorkflowStep(assignment.status);

  return (
    <>
      <AnimatePresence>
        {phase === 'processing' && (
          <GenerationScreen
            assignmentTitle={assignment.title}
            assignmentSubject={assignment.subject}
            assignmentId={id}
            duration={assignment.duration}
            generatedQuestionCount={generatedQuestionCount}
            requestedQuestionCount={requestedQuestionCount}
            generatedMarks={generatedMarks}
            requestedMarks={requestedMarks}
            schoolName=""
            className=""
            isPartial={isPartial}
            onRetry={handleGenerate}
            isRetrying={isRetrying}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase !== 'processing' && (
          <motion.div
            className="assignment-page max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-6 text-slate-900 font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
              <Link
                href={isStudent ? '/student/assessments' : '/assignments'}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to {isStudent ? 'Assessments' : 'Assignments'}</span>
              </Link>
              {isStudent && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Enrolled Student View
                </span>
              )}
            </div>

            {/* Main Assignment Banner Card */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#e05934] border border-orange-100 flex items-center justify-center shrink-0">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
                      {assignment.title}
                    </h1>
                    <p className="text-xs text-neutral-500 font-medium mt-1">
                      {assignment.subject} • Due on {new Date(assignment.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  <span
                    className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border ${
                      BADGE_MAP[assignment.status.toLowerCase()] || 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {assignment.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-neutral-100">
                {[
                  {
                    icon: Star,
                    label: 'Total Marks',
                    value: generatedMarks !== null ? `${generatedMarks}/${requestedMarks}` : `${requestedMarks} Marks`,
                  },
                  { icon: Clock, label: 'Duration', value: `${assignment.duration} Mins` },
                  {
                    icon: FileText,
                    label: 'Questions',
                    value:
                      generatedQuestionCount !== null
                        ? `${generatedQuestionCount}/${requestedQuestionCount}`
                        : `${requestedQuestionCount} Qs`,
                  },
                  {
                    icon: CheckCircle2,
                    label: 'Status',
                    value: assignment.studentSubmission ? 'Submitted' : 'Ready to Attempt',
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center p-3 rounded-xl bg-neutral-50/60 border border-neutral-100">
                    <Icon className="size-4 text-neutral-400 mx-auto mb-1" />
                    <div className="text-base font-bold text-neutral-900">{value}</div>
                    <div className="text-[11px] text-neutral-500 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Workflow & Actions for Faculty/Admin */}
            {!isStudent && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col gap-4"
              >
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Lifecycle Workflow
                </h3>
                <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isActive = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div
                        key={step.key}
                        className={`flex-1 flex flex-col items-center gap-1.5 p-3 transition-colors ${
                          isCurrent ? 'bg-orange-50/80 text-[#e05934]' : 'text-neutral-500'
                        } ${idx < WORKFLOW_STEPS.length - 1 ? 'border-r border-neutral-200' : ''}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isActive ? 'bg-[#e05934] text-white' : 'bg-neutral-200 text-neutral-500'
                          }`}
                        >
                          <StepIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-bold">{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {isFaculty && (assignment.status === 'DRAFT' || assignment.status === 'REJECTED') && (
                    <button
                      className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-1.5"
                      onClick={() => router.push(`/assignments/create?id=${assignment.id}`)}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {['COMPLETED', 'PARTIALLY_GENERATED', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE'].includes(
                    assignment.status
                  ) && (
                    <>
                      <button
                        onClick={handleViewPaper}
                        className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview Full Paper
                      </button>
                      <button
                        onClick={async () => {
                          setDownloading(true);
                          try {
                            const res = await api.get(`/papers/${assignment.id}/pdf`, { responseType: 'blob' });
                            if (!res.data) throw new Error('PDF not available');
                            const blob = new Blob([res.data], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `paper-${(assignment.title || assignment.id).replace(/\s+/g, '_')}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            toast.success('PDF downloaded');
                          } catch {
                            toast.error('PDF not yet generated or available');
                          } finally {
                            setDownloading(false);
                          }
                        }}
                        className="px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-1.5"
                        disabled={downloading}
                      >
                        <Download className="w-3.5 h-3.5" /> {downloading ? 'Downloading...' : 'Download PDF'}
                      </button>
                      {isFaculty &&
                        ['DRAFT', 'COMPLETED', 'PARTIALLY_GENERATED', 'REJECTED'].includes(assignment.status) && (
                          <button
                            onClick={handleSendForApproval}
                            className="px-4 py-2 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold flex items-center gap-1.5"
                            disabled={isSubmittingForApproval}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isSubmittingForApproval ? 'Sending...' : 'Send for Approval'}
                          </button>
                        )}
                      {canApprove && ['PENDING_APPROVAL'].includes(assignment.status) && (
                        <>
                          <button
                            onClick={handleAdminApprove}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                            disabled={isPublishing}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                          </button>
                        </>
                      )}
                      {(isFaculty || canApprove) && assignment.status === 'APPROVED' && (
                        <button
                          onClick={handlePublish}
                          className="px-4 py-2 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold flex items-center gap-1.5"
                          disabled={isPublishing}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Publish to Students
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Question Paper Display & Interactive Exam Sheet */}
            {paper && paper.sections && paper.sections.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-neutral-200/90 bg-white p-6 md:p-8 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-neutral-200">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">
                      Official Assessment Paper
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {isStudent
                        ? 'Read all questions carefully and write your answers in the input boxes below or upload your solution'
                        : 'Review questions, marks breakdown, and rubric structure'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleViewPaper}
                      className="px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Standard Format View
                    </button>
                  </div>
                </div>

                {/* Question Sections Loop */}
                <div className="space-y-8">
                  {(() => {
                    let globalQNum = 1;
                    return paper.sections.map((section: any, sIdx: number) => {
                      const currentGlobalNum = globalQNum;
                      globalQNum += (section.questions || []).length;
                      return (
                        <div key={sIdx} className="space-y-4">
                          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-neutral-900">{section.title}</h3>
                              {section.instruction && (
                                <p className="text-xs text-neutral-500 italic mt-0.5">{section.instruction}</p>
                              )}
                            </div>
                            <span className="text-xs font-extrabold text-neutral-600 px-2.5 py-0.5 rounded-md bg-white border border-neutral-200">
                              {(section.questions || []).length} Questions
                            </span>
                          </div>

                          <div className="space-y-5">
                            {(section.questions || []).map((q: any, qIdx: number) => {
                              const qNumber = currentGlobalNum + qIdx;
                              const qKey = `q_${qNumber}`;
                              const currentAnswer = studentAnswers[qKey] || '';

                              return (
                                <div
                                  key={q.id || qIdx}
                                  className="p-5 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 transition-all shadow-2xs space-y-3.5"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <span className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-800 text-xs font-bold flex items-center justify-center shrink-0">
                                        Q{qNumber}
                                      </span>
                                      <div className="text-sm font-semibold text-neutral-900 whitespace-pre-wrap leading-relaxed">
                                        {q.question}
                                      </div>
                                    </div>
                                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 shrink-0">
                                      {q.marks || 1} Marks
                                    </span>
                                  </div>

                                  {/* MCQ Options Display */}
                                  {q.type === 'mcq' && q.options && q.options.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                      {q.options.map((opt: any) => {
                                        const isSelected = currentAnswer === opt.key;
                                        return (
                                          <button
                                            key={opt.key}
                                            type="button"
                                            disabled={!isStudent || !!assignment.studentSubmission}
                                            onClick={() => updateAnswer(qKey, opt.key)}
                                            className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-3 ${
                                              isSelected
                                                ? 'bg-orange-50 border-[#e05934] text-[#e05934] font-bold shadow-2xs'
                                                : 'bg-neutral-50/60 border-neutral-200 hover:border-neutral-300 text-neutral-800'
                                            }`}
                                          >
                                            <span
                                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-extrabold ${
                                                isSelected
                                                  ? 'bg-[#e05934] text-white'
                                                  : 'bg-white border border-neutral-200 text-neutral-700'
                                              }`}
                                            >
                                              {opt.key}
                                            </span>
                                            <span className="flex-1">{opt.text}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Student Online Answer Box */}
                                  {isStudent && !assignment.studentSubmission && (
                                    <div className="pt-2">
                                      {q.type === 'mcq' ? (
                                        <div className="text-[11px] text-neutral-400 flex items-center gap-1 font-medium">
                                          <HelpCircle className="w-3.5 h-3.5" />
                                          <span>Click an option above to select your answer.</span>
                                        </div>
                                      ) : (
                                        <div className="space-y-1.5">
                                          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
                                            <span>Your Answer:</span>
                                            <span>{currentAnswer.length} characters</span>
                                          </div>
                                          <textarea
                                            value={currentAnswer}
                                            onChange={(e) => updateAnswer(qKey, e.target.value)}
                                            placeholder="Write your explanation or mathematical solution step by step..."
                                            rows={3}
                                            className="w-full p-3 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e05934] focus:bg-white transition-all text-neutral-900 placeholder:text-neutral-400 font-sans"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </motion.div>
            )}

            {/* Student Submission Card */}
            {isStudent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-neutral-200/90 bg-white p-6 md:p-8 shadow-xs"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">Student Submission Center</h3>
                    <p className="text-xs text-neutral-500">
                      Submit your completed test answers online or upload handwritten/scanned documents
                    </p>
                  </div>
                  {assignment.studentSubmission ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                      Pending Submission
                    </span>
                  )}
                </div>

                {assignment.studentSubmission ? (
                  <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Assessment Successfully Submitted</span>
                      </div>
                      <p className="text-xs text-emerald-800">
                        Submitted on{' '}
                        {new Date(
                          assignment.studentSubmission.submittedAt || assignment.studentSubmission.createdAt
                        ).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}{' '}
                        • Type: <strong>{assignment.studentSubmission.fileType}</strong>
                      </p>
                    </div>
                    <Link
                      href={`/student/results?id=${assignment.id}`}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors text-center shrink-0"
                    >
                      View Results & Grades
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Submission Mode Selector */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSubmissionMode('ONLINE')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          submissionMode === 'ONLINE'
                            ? 'bg-neutral-900 text-white shadow-2xs'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        Write & Submit Online Answers
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionMode('UPLOAD')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          submissionMode === 'UPLOAD'
                            ? 'bg-neutral-900 text-white shadow-2xs'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        Upload Solution File (PDF/DOCX)
                      </button>
                    </div>

                    {submissionMode === 'ONLINE' ? (
                      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                        <div className="flex items-center justify-between text-xs text-neutral-600">
                          <span>
                            Answered Questions:{' '}
                            <strong>
                              {Object.values(studentAnswers).filter((a) => a && a.trim().length > 0).length}
                            </strong>
                          </span>
                          <span className="text-emerald-600 font-semibold">● Auto-saving draft locally</span>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                          Your answers entered in the question sections above will be compiled and evaluated by your
                          instructor upon submission.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 text-center hover:border-neutral-300 transition-colors bg-neutral-50/40">
                          <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                          <p className="text-xs font-bold text-neutral-800">
                            Upload your handwritten answer sheets or typed solution file
                          </p>
                          <p className="text-[11px] text-neutral-400 mt-0.5 mb-4">
                            PDF, Word (.docx), or Text files up to 25MB accepted
                          </p>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                            className="text-xs text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Final Action Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <p className="text-xs text-neutral-400">
                        Once submitted, your response will be locked for grading.
                      </p>
                      <button
                        onClick={handleStudentSubmit}
                        disabled={isSubmittingTest}
                        className="px-6 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSubmittingTest ? 'Submitting Assessment...' : 'Submit Assessment'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
