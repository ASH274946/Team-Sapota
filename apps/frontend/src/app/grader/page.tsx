'use client';
import { NativeSelect } from '@/components/ui/native-select';

 

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, Plus, Loader2,
  FileText, Upload, ChevronRight, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';
import Link from 'next/link';
import { AssessmentUploadView } from '@/components/grader/AssessmentUploadView';
import { fetchPaper } from '@/services/paper.service';
import type { GeneratedPaper } from '@/types/paper.types';

interface Rubric {
  id: string;
  title: string;
  description: string;
  criteria: Array<{ name: string; maxMarks: number; description: string }>;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  totalMarks: number;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  fileUrl: string;
  fileType: string;
  status: string;
  submittedAt: string;
  evaluations?: Array<{ score: number }>;
}

interface GradingConfig {
  rubricId?: string | null;
  answerKeyText?: string;
  questionPaperName?: string | null;
  autoEvaluate?: boolean;
}

export default function GraderDashboard() {
  const [activeTab, setActiveTab] = useState<'assignments' | 'rubrics'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);

  // Grading config modal states
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showUploadWorkspace, setShowUploadWorkspace] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);
  const [paperLoading, setPaperLoading] = useState(false);
  const [rubricId, setRubricId] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [questionPaperName, setQuestionPaperName] = useState<string | null>(null);
  const [autoEvaluate, setAutoEvaluate] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // Submissions states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Rubric creation states
  const [showCreateRubric, setShowCreateRubric] = useState(false);
  const [rubricTitle, setRubricTitle] = useState('');
  const [rubricDesc, setRubricDesc] = useState('');
  const [criteria, setCriteria] = useState([{ name: 'Accuracy', maxMarks: 10, description: 'Correct answer structure' }]);
  const [creatingRubric, setCreatingRubric] = useState(false);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [assignRes, rubRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: any }>('/assignments'),
        apiClient.get<{ success: boolean; data: Rubric[] }>('/grader/rubrics'),
      ]);
      const fetchedAssignments = assignRes.data.data.assignments || assignRes.data.data || [];
      setAssignments(fetchedAssignments);
      setRubrics(rubRes.data.data);
    } catch {
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadSubmissions = async (assignmentId: string) => {
    try {
      setSubmissionsLoading(true);
      const res = await apiClient.get<{ success: boolean; data: Submission[] }>(`/grader/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data.data);
    } catch {
      toast.error('Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleOpenConfig = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowUploadWorkspace(true);
    setGeneratedPaper(null);
    setPaperLoading(true);
    loadSubmissions(assignment.id);
    fetchPaper(assignment.id)
      .then((paper) => setGeneratedPaper(paper))
      .catch(() => setGeneratedPaper(null))
      .finally(() => setPaperLoading(false));
    try {
      const res = await apiClient.get<{ success: boolean; data: GradingConfig | null }>(`/grader/assignments/${assignment.id}/config`);
      if (res.data.data) {
        setRubricId(res.data.data.rubricId || '');
        setAnswerKey(res.data.data.answerKeyText || '');
        setQuestionPaperName(res.data.data.questionPaperName || null);
        setAutoEvaluate(res.data.data.autoEvaluate !== false);
      } else {
        setRubricId('');
        setAnswerKey('');
        setQuestionPaperName(null);
        setAutoEvaluate(true);
      }
    } catch {
      setRubricId('');
      setAnswerKey('');
      setQuestionPaperName(null);
      setAutoEvaluate(true);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedAssignment) return;
    setSavingConfig(true);
    try {
      await apiClient.post(`/grader/assignments/${selectedAssignment.id}/config`, {
        rubricId: rubricId || null,
        answerKeyText: answerKey,
        autoEvaluate,
      });
      toast.success('Grading configuration saved successfully');
    } catch {
      toast.error('Failed to save grading configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleEvaluateSelected = async (submissionIds: string[]) => {
    if (!selectedAssignment || submissionIds.length === 0) return;
    try {
      for (const submissionId of submissionIds) {
        await apiClient.post(`/grader/submissions/${submissionId}/evaluate`);
      }
      toast.success(`${submissionIds.length} student${submissionIds.length === 1 ? '' : 's'} evaluated successfully`);
      await loadSubmissions(selectedAssignment.id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'One or more evaluations failed');
    }
  };

  const handleStartMapping = async (submissionIds: string[]) => {
    if (!selectedAssignment) return;
    // Ensure the assignment has an active grading config, while the generated paper
    // remains the source of truth for the question context.
    await apiClient.post(`/grader/assignments/${selectedAssignment.id}/config`, {
      rubricId: rubricId || null,
      answerKeyText: answerKey,
      autoEvaluate: true,
    });
    await handleEvaluateSelected(submissionIds);
    setShowUploadWorkspace(false);
  };

  const handleQuestionPaperUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!selectedAssignment || !file) return;
    const formData = new FormData();
    formData.append('questionPaper', file);
    setSavingConfig(true);
    try {
      await apiClient.post(`/grader/assignments/${selectedAssignment.id}/question-paper`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setQuestionPaperName(file.name);
      toast.success('Question paper uploaded and mapped to this evaluation');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload question paper');
    } finally {
      setSavingConfig(false);
      event.target.value = '';
    }
  };

  const handleAddCriterion = () => {
    setCriteria([...criteria, { name: '', maxMarks: 10, description: '' }]);
  };

  const handleDeleteRubric = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rubric?')) return;
    try {
      await apiClient.delete(`/grader/rubrics/${id}`);
      setRubrics(rubrics.filter(r => r.id !== id));
      toast.success('Rubric deleted successfully');
      if (rubricId === id) setRubricId('');
    } catch (error) {
      toast.error('Failed to delete rubric');
    }
  };

  const handleCreateRubric = async () => {
    if (!rubricTitle.trim()) {
      toast.error('Rubric title is required');
      return;
    }
    setCreatingRubric(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: Rubric }>('/grader/rubrics', {
        title: rubricTitle,
        description: rubricDesc,
        criteria,
      });
      setRubrics([res.data.data, ...rubrics]);
      toast.success('Rubric created successfully');
      setShowCreateRubric(false);
      setRubricTitle('');
      setRubricDesc('');
      setCriteria([{ name: 'Accuracy', maxMarks: 10, description: 'Correct answer structure' }]);
    } catch {
      toast.error('Failed to create rubric');
    } finally {
      setCreatingRubric(false);
    }
  };

  const handleUploadSubmission = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAssignment || !e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    setUploading(true);
    try {
      const response = await apiClient.post<{ success: boolean; data: Array<{ evaluated: boolean; error?: string; pendingReason?: string }> }>(`/grader/assignments/${selectedAssignment.id}/submissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const evaluated = response.data.data.filter((item) => item.evaluated).length;
      const failed = response.data.data.filter((item) => item.error).length;
      toast.success(evaluated ? `${evaluated} answer sheet${evaluated === 1 ? '' : 's'} uploaded and evaluated` : `${files.length} answer sheet${files.length === 1 ? '' : 's'} uploaded`);
      if (failed) toast.error(`${failed} sheet${failed === 1 ? '' : 's'} could not be evaluated; use Regrade after checking the configuration.`);
      loadSubmissions(selectedAssignment.id);
    } catch {
      toast.error('Failed to upload submission');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleEvaluateSubmission = async (submissionId: string) => {
    toast.loading('AI Evaluation in progress...', { id: submissionId });
    try {
      await apiClient.post(`/grader/submissions/${submissionId}/evaluate`);
      toast.success('AI Evaluation completed', { id: submissionId });
      if (selectedAssignment) {
        loadSubmissions(selectedAssignment.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'AI Evaluation failed', { id: submissionId });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={32} color="var(--brand)" />
      </div>
    );
  }

  return (
    <div className="dashboard-view" style={{ width: '100%', maxWidth: 'var(--page-max-w)', margin: '0 auto' }}>
      {!selectedAssignment && <>
        <div className="desktop-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={24} color="var(--brand)" />
            <h1 className="page-title">AI Assignment Grader</h1>
          </div>
          <p className="page-subtitle">Configure assessment rubrics, evaluate student answers via AI, and review grades.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            background: 'none', border: 'none', padding: '12px 4px', fontWeight: 600,
            color: activeTab === 'assignments' ? 'var(--brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'assignments' ? '2px solid var(--brand)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('rubrics')}
          style={{
            background: 'none', border: 'none', padding: '12px 4px', fontWeight: 600,
            color: activeTab === 'rubrics' ? 'var(--brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'rubrics' ? '2px solid var(--brand)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Rubrics & Criteria
        </button>
        </div>
      </>}

      <AnimatePresence mode="wait">
        {activeTab === 'assignments' ? (
          <motion.div key="assignments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {selectedAssignment ? (
              // Active Grading Config and Submissions View
              showUploadWorkspace ? (
                <AssessmentUploadView
                  assignmentTitle={selectedAssignment.title}
                  onBack={() => setSelectedAssignment(null)}
                  questionPaper={generatedPaper}
                  questionPaperLoading={paperLoading}
                  attemptedStudents={submissions}
                  submissionsLoading={submissionsLoading}
                  onStartMapping={handleStartMapping}
                  onEvaluateSelected={handleEvaluateSelected}
                />
              ) : <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }}>
                {/* Configuration Panel */}
                <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
                  <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={() => setSelectedAssignment(null)}>
                    Back to Assignments
                  </button>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Grading Configuration</h3>
                  <div className="input-group" style={{ marginBottom: 16 }}>
                    <label className="label">Evaluation Rubric</label>
                    <NativeSelect className="input" value={rubricId} onChange={(e) => setRubricId(e.target.value)}>
                      <option value="">No Rubric (General correctness)</option>
                      {rubrics.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </NativeSelect>
                  </div>
                  <div className="input-group" style={{ marginBottom: 16 }}>
                    <label className="label">Question Paper</label>
                    <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <Upload size={14} /> {savingConfig ? 'Uploading...' : questionPaperName ? 'Replace Question Paper' : 'Upload Question Paper'}
                      <input type="file" onChange={handleQuestionPaperUpload} style={{ display: 'none' }} disabled={savingConfig} accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" />
                    </label>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                      {questionPaperName ? `Mapped: ${questionPaperName}` : 'Upload the source paper so AI can match questions to each answer sheet.'}
                    </p>
                  </div>
                  <div className="input-group" style={{ marginBottom: 20 }}>
                    <label className="label">Reference Answer Key</label>
                    <textarea
                      className="input"
                      rows={8}
                      placeholder="Paste correct answers, criteria explanations, or grading notes here..."
                      value={answerKey}
                      onChange={(e) => setAnswerKey(e.target.value)}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16, cursor: 'pointer' }}>
                    <input type="checkbox" checked={autoEvaluate} onChange={(e) => setAutoEvaluate(e.target.checked)} />
                    Automatically evaluate answer sheets after upload
                  </label>
                  <button className="btn btn-primary" onClick={handleSaveConfig} disabled={savingConfig} style={{ width: '100%' }}>
                    {savingConfig ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>

                {/* Submissions Panel */}
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Student Submissions</h3>
                    <label className="btn btn-dark btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Answer Sheets'}
                      <input type="file" multiple onChange={handleUploadSubmission} style={{ display: 'none' }} disabled={uploading} accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" />
                    </label>
                  </div>

                  {submissionsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" /></div>
                  ) : submissions.length === 0 ? (
                    <div className="empty-state" style={{ padding: 40 }}>
                      <FileText size={32} color="var(--text-muted)" />
                      <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>No student submissions yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {submissions.map((sub) => (
                        <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <User size={18} color="var(--text-muted)" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>Student: {sub.studentName || sub.studentId.substring(0, 8)}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Type: {sub.fileType} &middot; {new Date(sub.submittedAt).toLocaleTimeString()} {new Date(sub.submittedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="badge" style={{
                              background: sub.status === 'GRADED' ? '#E0F2FE' : sub.status === 'REVIEWED' ? '#D1FAE5' : '#F3F4F6',
                              color: sub.status === 'GRADED' ? '#0369A1' : sub.status === 'REVIEWED' ? '#059669' : '#4B5563',
                              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100
                            }}>
                              {sub.status}
                            </span>
                            {sub.status === 'SUBMITTED' ? (
                              <button className="btn btn-secondary btn-sm" onClick={() => handleEvaluateSubmission(sub.id)}>
                                Grade with AI
                              </button>
                            ) : (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleEvaluateSubmission(sub.id)}>
                                  Regrade
                                </button>
                                <Link href={`/grader/${sub.id}`} className="btn btn-primary btn-sm">
                                  Review Grade
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // List of all assignments
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {assignments.map((assign) => (
                  <div key={assign.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 160, cursor: 'pointer' }} onClick={() => handleOpenConfig(assign)}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>{assign.subject}</span>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{assign.title}</h3>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Max Marks: {assign.totalMarks}</span>
                      <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Configure <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          // Rubrics Tab View
          <motion.div key="rubrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {showCreateRubric ? (
              <div className="card" style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Create Evaluation Rubric</h3>
                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label className="label">Rubric Title</label>
                  <input type="text" className="input" placeholder="e.g. Essay Writing Rubric" value={rubricTitle} onChange={(e) => setRubricTitle(e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: 20 }}>
                  <label className="label">Description</label>
                  <textarea className="input" rows={2} placeholder="Explain what kinds of assignments this rubric evaluates..." value={rubricDesc} onChange={(e) => setRubricDesc(e.target.value)} />
                </div>

                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Criteria</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {criteria.map((c, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 3fr', gap: 12, alignItems: 'start' }}>
                      <input type="text" className="input" placeholder="Criterion Name" value={c.name} onChange={(e) => {
                        const newCriteria = [...criteria];
                        newCriteria[i].name = e.target.value;
                        setCriteria(newCriteria);
                      }} />
                      <input type="number" className="input" placeholder="Max Marks" value={c.maxMarks} onChange={(e) => {
                        const newCriteria = [...criteria];
                        newCriteria[i].maxMarks = Number(e.target.value);
                        setCriteria(newCriteria);
                      }} />
                      <input type="text" className="input" placeholder="Description of expectations" value={c.description} onChange={(e) => {
                        const newCriteria = [...criteria];
                        newCriteria[i].description = e.target.value;
                        setCriteria(newCriteria);
                      }} />
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-sm" onClick={handleAddCriterion} style={{ alignSelf: 'start' }}>
                    + Add Criterion
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowCreateRubric(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleCreateRubric} disabled={creatingRubric}>
                    {creatingRubric ? 'Creating...' : 'Create Rubric'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <button className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowCreateRubric(true)}>
                    <Plus size={15} /> Create Rubric
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {rubrics.map((r) => (
                    <div key={r.id} className="card" style={{ padding: 20, position: 'relative' }}>
                      <button onClick={() => handleDeleteRubric(r.id)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                      <h3 style={{ fontSize: 15, fontWeight: 800, paddingRight: 20 }}>{r.title}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{r.description || 'No description provided.'}</p>
                      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {r.criteria.map((c, i) => (
                          <span key={i} style={{ fontSize: 11, background: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: 8, fontWeight: 500 }}>
                            {c.name} ({c.maxMarks})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
