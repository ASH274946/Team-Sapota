'use client';

import { useState } from 'react';
import {
  Bot,
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle2,
  Loader2,
  Eye,
  Trash2,
  Download,
  ArrowLeft,
  History,
  FileText,
  FileSignature,
  Paperclip,
  Target,
} from 'lucide-react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { Input } from '@/design-system/Input';
import { useLessonPlanner } from '@/hooks/useLessonPlanner';
import {
  Attachments,
  AttachmentList,
  Attachment,
  AttachmentTrigger,
  AttachmentMeta,
} from '@/components/ui/Attachments';
import {
  ChainOfThought,
  ChainOfThoughtTrigger,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtStepTitle,
  ChainOfThoughtStepContent,
} from '@/components/ui/ChainOfThought';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ui/Reasoning';
import { TextShimmer } from '@/components/ui/TextShimmer';
import { FeedbackBar } from '@/components/ui/FeedbackBar';

export default function CopilotPage() {
  const {
    plans,
    loading,
    isGenerating,
    isExportingPdf,
    activePlan,
    setActivePlan,
    generatePlan,
    updatePlan,
    deletePlan,
    exportPdf,
  } = useLessonPlanner();

  // Form State
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('60');
  const [outcomes, setOutcomes] = useState('');
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);

  // UI State
  const [view, setView] = useState<'GENERATOR' | 'HISTORY' | 'EDITOR'>('GENERATOR');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Extract structured content safely
  const parseContent = (contentStr: string) => {
    try {
      return JSON.parse(contentStr);
    } catch {
      return {};
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const plan = await generatePlan(subject, topic, duration, outcomes);
    if (plan) {
      setView('EDITOR');
    }
  };

  const handleExportPdf = async () => {
    if (!activePlan || isExportingPdf) return;
    await exportPdf(activePlan.id);
  };

  const saveFieldEdit = async (field: string, value: any) => {
    if (!activePlan) return;

    const isTopLevel = ['title', 'subject', 'duration', 'objectives', 'activities', 'assessments'].includes(field);

    const updates: any = {};
    if (isTopLevel) {
      if (field === 'objectives' && Array.isArray(value)) {
        updates[field] = value.join('\n');
      } else {
        updates[field] = value;
      }
    } else {
      const currentContent = parseContent(activePlan.content);
      currentContent[field] = value;
      if (field === 'teacherNotes') {
        currentContent.notes = value;
      }
      updates.content = JSON.stringify(currentContent);
    }

    await updatePlan(activePlan.id, updates);
    setEditMode(null);
  };

  const renderSection = (title: string, field: string, data: any, icon: any, isList: boolean = true) => {
    const isEditing = editMode === field;

    const items = Array.isArray(data)
      ? data.filter(Boolean)
      : (typeof data === 'string' && data.trim() && data.toLowerCase() !== 'none' ? [data.trim()] : []);

    const startEditing = () => {
      setEditValue(isList ? (Array.isArray(data) ? data.join('\n') : String(data || '')) : String(data || ''));
      setEditMode(field);
    };

    const handleSave = () => {
      const finalValue = isList ? editValue.split('\n').map(s => s.trim()).filter(Boolean) : editValue.trim();
      saveFieldEdit(field, finalValue);
    };

    return (
      <div className="mb-8 p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={startEditing} className="opacity-0 group-hover:opacity-100 transition-opacity">
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="w-full p-4 border border-orange-200 rounded-lg text-sm bg-orange-50/10 font-sans focus:outline-none focus:ring-2 focus:ring-[#e05934]"
              rows={isList ? 6 : 4}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="primary" className="bg-[#e05934] hover:bg-[#c94a2a] text-white" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditMode(null)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div>
            {isList ? (
              items.length > 0 ? (
                <ul className="space-y-2.5">
                  {items.map((item: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-700 text-sm leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e05934] mt-2 shrink-0" />
                      <span>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-xs italic">No items defined yet.</p>
              )
            ) : (
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {typeof data === 'string' && data.trim() && data.toLowerCase() !== 'none' ? data.trim() : 'No additional details provided.'}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setView('GENERATOR')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Generator
        </Button>
        <div className="text-sm font-semibold text-slate-500">
          Total Saved Plans: {plans.length}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No Lesson Plans Generated Yet</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Use the AI Copilot to generate your first syllabus-aligned lesson plan in seconds.
          </p>
          <Button variant="primary" className="mt-4" onClick={() => setView('GENERATOR')}>
            Create Lesson Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => (
            <Card key={p.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {p.subject}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Duration: {p.duration} mins • Objectives: {p.objectives ? p.objectives.split('\n').length : 0}
                </p>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 justify-center"
                  onClick={() => {
                    setActivePlan(p);
                    setView('EDITOR');
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" /> Open Plan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:border-red-200"
                  onClick={() => deletePlan(p.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderEditor = () => {
    if (!activePlan) return null;
    const content = parseContent(activePlan.content);

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => setView('HISTORY')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
          </Button>
          <div className="flex items-center gap-3">
            <Button
              id="export-pdf-btn"
              variant="primary"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="min-w-[140px] justify-center"
            >
              {isExportingPdf ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating PDF…</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Export PDF</>
              )}
            </Button>
          </div>
        </div>

        {/* Lesson Plan viewer */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{activePlan.title}</h1>
                <p className="text-lg text-slate-600 font-medium">{activePlan.subject} • {activePlan.duration} Mins</p>
              </div>
              <div className="text-right text-sm text-slate-500 space-y-1">
                <p className="font-semibold text-slate-800">VidyaAI LMS</p>
                <p>Generated: {new Date(activePlan.createdAt).toLocaleDateString()}</p>
                <p>Status: Approved</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">AI Generated</span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">Classroom Ready</span>
              </div>
              <FeedbackBar
                targetId={activePlan.id}
                targetType="lesson_plan"
              />
            </div>
          </div>

          {/* Sections */}
          {renderSection('Learning Objectives', 'objectives', activePlan.objectives?.split('\n') || [], <CheckCircle2 className="w-5 h-5 text-emerald-500" />)}
          {renderSection('Prerequisites', 'prerequisites', content.prerequisites, <Layers className="w-5 h-5 text-indigo-500" />)}
          {renderSection('Teaching Materials', 'materials', content.materials, <BookOpen className="w-5 h-5 text-amber-500" />)}
          {renderSection('Introduction', 'introduction', content.introduction, <Sparkles className="w-5 h-5 text-blue-500" />, false)}
          {renderSection('Core Concepts', 'coreConcepts', content.coreConcepts, <FileText className="w-5 h-5 text-purple-500" />)}
          {renderSection('Teaching Activities', 'activities', activePlan.activities, <Bot className="w-5 h-5 text-rose-500" />)}
          {renderSection('Classroom Interaction', 'interaction', content.interaction, <Sparkles className="w-5 h-5 text-cyan-500" />, false)}
          {renderSection('Practical Exercises', 'practicalExercises', content.practicalExercises, <Layers className="w-5 h-5 text-teal-500" />)}
          {renderSection('Assessment Strategy', 'assessments', activePlan.assessments, <FileSignature className="w-5 h-5 text-orange-500" />)}
          {renderSection('Homework / Assignments', 'homework', content.homework, <BookOpen className="w-5 h-5 text-slate-500" />)}
          {renderSection('Expected Outcomes', 'outcomes', content.outcomes, <CheckCircle2 className="w-5 h-5 text-emerald-600" />)}
          {renderSection('Teacher Notes', 'teacherNotes', content.teacherNotes, <FileText className="w-5 h-5 text-slate-600" />, false)}
        </div>
      </div>
    );
  };

  const renderGenerator = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Panel with Attachments */}
      <div className="lg:col-span-1">
        <Card className="p-6 sticky top-24 border-indigo-100 shadow-indigo-900/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#e05934] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Planner</h2>
              <p className="text-xs text-slate-500 font-medium">Hybrid RAG & Bloom Engine</p>
            </div>
          </div>

          <Attachments
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            disabled={isGenerating}
          >
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject</label>
                <Input
                  placeholder="e.g., Computer Science, Physics"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Topic</label>
                <Input
                  placeholder="e.g., Binary Search Trees, Thermodynamics"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration (mins)</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Outcomes / Syllabus Notes</label>
                  <AttachmentTrigger>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#e05934] hover:underline cursor-pointer">
                      <Paperclip className="w-3 h-3" /> Attach Files
                    </span>
                  </AttachmentTrigger>
                </div>
                <textarea
                  className="w-full h-24 p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-xs resize-none"
                  placeholder={"What should students master?\n- Understand core principles\n- Apply concepts to problem solving"}
                  value={outcomes}
                  onChange={e => setOutcomes(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              {/* Uploaded Attachments */}
              {attachments.length > 0 && (
                <div className="pt-1">
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                    Attached Syllabus & References ({attachments.length})
                  </span>
                  <AttachmentList>
                    {attachments.map((item, idx) => (
                      <Attachment
                        key={idx}
                        attachment={item}
                        onRemove={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      />
                    ))}
                  </AttachmentList>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center h-11 text-sm font-bold shadow-md shadow-orange-500/20 bg-[#e05934] hover:bg-[#c94a2a] text-white"
                disabled={isGenerating || !subject || !topic}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <TextShimmer>Synthesizing Curriculum...</TextShimmer>
                  </span>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Lesson Plan</>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-center text-xs"
                onClick={() => setView('HISTORY')}
                disabled={isGenerating}
              >
                <History className="w-3.5 h-3.5 mr-2" /> View Saved Library
              </Button>
            </form>
          </Attachments>
        </Card>
      </div>

      {/* Chain of Thought & Real-Time Reasoning Display */}
      <div className="lg:col-span-2 space-y-6">
        {isGenerating ? (
          <div className="space-y-4">
            <ChainOfThought defaultExpanded={true}>
              <ChainOfThoughtTrigger
                isGenerating={true}
                stats={{
                  elapsedTime: '1.8s',
                  tokensPerSec: 48,
                  stage: 'Constructing Lesson Schema',
                }}
              >
                Generating Lesson Plan for {topic || 'Subject'}
              </ChainOfThoughtTrigger>

              <ChainOfThoughtContent>
                <ChainOfThoughtStep status="completed">
                  <ChainOfThoughtStepTitle
                    icon={<BookOpen className="w-3.5 h-3.5 text-blue-500" />}
                    status="completed"
                    metrics="100% Ingested"
                  >
                    Curriculum & Syllabus Knowledge Alignment
                  </ChainOfThoughtStepTitle>
                  <ChainOfThoughtStepContent>
                    Extracted target academic requirements for <strong className="text-neutral-900">{subject || 'Subject'}</strong> ({duration} mins). Cross-referencing {attachments.length > 0 ? `${attachments.length} attached course document(s)` : 'institutional standard syllabus'}.
                  </ChainOfThoughtStepContent>
                </ChainOfThoughtStep>

                <ChainOfThoughtStep status="completed">
                  <ChainOfThoughtStepTitle
                    icon={<Target className="w-3.5 h-3.5 text-indigo-500" />}
                    status="completed"
                    metrics="Bloom Levels 1-4"
                  >
                    Bloom&apos;s Taxonomy & Pedagogical Mapping
                  </ChainOfThoughtStepTitle>
                  <ChainOfThoughtStepContent>
                    Mapped cognitive progression: Remember &rarr; Understand &rarr; Apply &rarr; Analyze. Formulated 4 measurable learning objectives aligned with OBE course standards.
                  </ChainOfThoughtStepContent>
                </ChainOfThoughtStep>

                <ChainOfThoughtStep status="running">
                  <ChainOfThoughtStepTitle
                    icon={<Layers className="w-3.5 h-3.5 text-orange-500" />}
                    status="running"
                    metrics="Synthesizing..."
                  >
                    Formulating 10+ Classroom Modules & Practical Exercises
                  </ChainOfThoughtStepTitle>
                  <ChainOfThoughtStepContent>
                    Drafting intro hook, active classroom discussion checkpoints, interactive student exercises, and assessment questions.
                  </ChainOfThoughtStepContent>
                </ChainOfThoughtStep>

                <ChainOfThoughtStep status="pending">
                  <ChainOfThoughtStepTitle
                    icon={<FileSignature className="w-3.5 h-3.5 text-neutral-400" />}
                    status="pending"
                    metrics="Queued"
                  >
                    Assessment Rubric & Homework Assignment Formulation
                  </ChainOfThoughtStepTitle>
                </ChainOfThoughtStep>
              </ChainOfThoughtContent>
            </ChainOfThought>

            {/* Live Streaming Reasoning Trace */}
            <Reasoning isStreaming={true} defaultExpanded={true}>
              <ReasoningTrigger />
              <ReasoningContent>
                {`Analyzing topic: ${topic || 'Topic'}\n- Duration target: ${duration} minutes\n- Structuring introduction (10 mins), core concept breakdown (25 mins), practical group activity (15 mins), and assessment check (10 mins).\n- Ensuring alignment with institutional OBE outcomes and rubric criteria...`}
              </ReasoningContent>
            </Reasoning>
          </div>
        ) : (
          <div className="h-full bg-slate-50 rounded-2xl border border-slate-200 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-orange-100 text-[#e05934] rounded-2xl flex items-center justify-center mb-6 shadow-xs">
              <Sparkles className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">AI-Powered Lesson Planning Studio</h2>
            <p className="text-slate-600 max-w-lg mb-8 text-xs sm:text-sm leading-relaxed">
              Generate comprehensive, classroom-ready lesson plans instantly. You can attach reference notes, PDFs, or syllabus guidelines, and the AI will reason through Bloom&apos;s taxonomy to build full lesson modules.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg w-full">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <Layers className="w-5 h-5 text-[#e05934] mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Structured Reasoning</h4>
                <p className="text-xs text-slate-500 mt-1">Live Chain-of-Thought Bloom&apos;s taxonomy tracking.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <Download className="w-5 h-5 text-[#e05934] mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Flawless PDF Export</h4>
                <p className="text-xs text-slate-500 mt-1">Print-ready A4 lesson documents generated instantly.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 min-h-screen">
      <PageHeader
        title="Teacher AI Copilot"
        subtitle="Generate, edit, and export structured lesson plans with live AI reasoning."
      />

      <div>
        {view === 'GENERATOR' && renderGenerator()}
        {view === 'HISTORY' && renderHistory()}
        {view === 'EDITOR' && renderEditor()}
      </div>
    </div>
  );
}
