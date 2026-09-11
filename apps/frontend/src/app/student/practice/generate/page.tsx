'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle, ImageOff, Paperclip, ChevronLeft, FileText, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';
import { motion } from 'framer-motion';
import { NativeSelect } from '@/components/ui/native-select';

interface GeneratedQuestion {
  id: string;
  question_text: string;
  options?: string[];
  answer?: string;
  difficulty: string;
  bloomLevel: string;
  ai_confidence_score: number;
  hint?: string;
}

interface AttachedDoc {
  name: string;
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function CustomQuizGenerator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<AttachedDoc | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    topic: '',
    subject: '',
    difficulty: 'MEDIUM',
    bloom_level: 'APPLY',
    numQuestions: 5,
    context: ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    // Check file size (max 10MB)
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setIsUploading(true);

    // Fast-path client-side extraction for plain text / markdown files
    if (f.type.includes('text') || f.name.endsWith('.txt') || f.name.endsWith('.md')) {
      try {
        const text = await f.text();
        setFormData(prev => ({ ...prev, context: text.slice(0, 30000) }));
        setAttachedDoc({ name: f.name, size: f.size });
        toast.success(`Attached "${f.name}"!`);
      } catch (err) {
        toast.error('Failed to read text file');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
      return;
    }

    // For PDF and other files, send to backend parser with timeout
    const fd = new FormData();
    fd.append('file', f);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const res = await apiClient.post<{success:boolean, data:{content:string, filename?: string, size?: number}}>('/generate/parse', fd, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const parsedText = res.data?.data?.content || '';
      if (!parsedText) {
        throw new Error('No readable text could be extracted from this document.');
      }

      setFormData(prev => ({ ...prev, context: parsedText }));
      setAttachedDoc({ name: f.name, size: f.size });
      toast.success(`Attached and parsed "${f.name}"!`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err?.name === 'AbortError' || err?.code === 'ECONNABORTED' || err?.message?.includes('timeout') || err?.message?.includes('canceled');
      if (isTimeout) {
        toast.error('Document parsing timed out. Please try a smaller PDF or paste the text directly.');
      } else {
        const message = err instanceof Error ? err.message : 'Failed to parse document';
        toast.error(message);
      }
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedDoc(null);
    setFormData(prev => ({ ...prev, context: '' }));
    toast.success('Document attachment removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      toast.error('Please wait for document parsing to finish before generating.');
      return;
    }

    setLoading(true);
    setGenerationError(null);
    try {
      const count = formData.numQuestions;
      const res = await apiClient.post<{ success: boolean; data: GeneratedQuestion[] }>('/generate/questions', {
        topic: formData.topic,
        subject: formData.subject,
        difficulty: formData.difficulty,
        bloomLevel: formData.bloom_level,
        context: formData.context || undefined,
        count,
      });
      const questions = res.data.data;

      const timeLimit = count * 60; // 1 minute per question
      const newQuiz = {
        topic: formData.topic,
        subject: formData.subject,
        difficulty: formData.difficulty,
        bloomLevel: formData.bloom_level,
        timeLimitSeconds: timeLimit,
        timeTakenSeconds: 0,
        score: 0,
        attempts: {},
        questions
      };

      // Instantly save to database
      const saveRes = await apiClient.post<{ success: boolean; data: { id: string } }>('/generate/session', newQuiz);
      
      toast.success(`${count} questions generated successfully!`);
      router.push(`/student/practice/attempt?sessionId=${saveRes.data.data.id}`);
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Generation failed';
      if (message.includes('API key') || message.includes('401') || message.includes('providers [')) {
        message = 'AI service configuration error: Valid API key missing or unauthorized. Please check your backend .env configuration.';
      }
      setGenerationError(message);
      if (message.includes('image') || message.includes('png') || message.includes('jpg')) {
        toast.error('Image references detected. Please use text-only content.');
      } else if (message.includes('API key') || message.includes('configuration error')) {
        toast.error('AI service unavailable. Please check your API key configuration.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:px-6 min-h-screen text-slate-900">
      <button 
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6 cursor-pointer"
      >
        <ChevronLeft size={16} /> Back to Practice
      </button>

      <div className="flex items-center gap-3.5 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/60 shadow-xs">
          <Sparkles size={22} className="text-slate-900" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Generate Quiz</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure AI parameters to generate a practice session on any topic.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-700">Topic</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. Machine Learning Basics" 
                value={formData.topic} 
                onChange={e => setFormData({...formData, topic: e.target.value})} 
                className="w-full h-11 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-400 transition-all shadow-xs"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-700">Subject</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. Computer Science" 
                value={formData.subject} 
                onChange={e => setFormData({...formData, subject: e.target.value})} 
                className="w-full h-11 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-400 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-700">Difficulty</label>
              <NativeSelect 
                value={formData.difficulty} 
                onChange={e => setFormData({...formData, difficulty: e.target.value})}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-700">Bloom Level</label>
              <NativeSelect 
                value={formData.bloom_level} 
                onChange={e => setFormData({...formData, bloom_level: e.target.value})}
              >
                <option value="REMEMBER">Remember</option>
                <option value="UNDERSTAND">Understand</option>
                <option value="APPLY">Apply</option>
                <option value="ANALYZE">Analyze</option>
                <option value="EVALUATE">Evaluate</option>
                <option value="CREATE">Create</option>
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-700">Number of Questions</label>
              <NativeSelect 
                value={formData.numQuestions} 
                onChange={e => setFormData({...formData, numQuestions: parseInt(e.target.value) || 5})}
              >
                {Array.from({ length: 15 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} Question{i > 0 ? 's' : ''}</option>
                ))}
              </NativeSelect>
            </div>
          </div>

<<<<<<< HEAD
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Reference Context (Optional)</label>
            <div style={{ position: 'relative' }}>
              <textarea 
                rows={5} 
                placeholder="Paste syllabus or reference material here... Avoid pasting images or file paths." 
                value={formData.context} 
                onChange={e => setFormData({...formData, context: e.target.value})} 
                style={{ width: '100%', padding: '16px', paddingBottom: 50, borderRadius: 16, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', resize: 'vertical' }}
              />
              <label style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: isUploading ? 'default' : 'pointer',
                color: '#64748B',
                opacity: isUploading ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}>
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                {isUploading ? 'Parsing...' : 'Attach File'}
                <input type="file" accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp,.csv" style={{display:'none'}} onChange={handleFileUpload} disabled={isUploading} />
              </label>
=======
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-slate-700">Reference Context (Optional)</label>
              {attachedDoc && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> 1 Document Attached
                </span>
              )}
>>>>>>> origin/main
            </div>

            {attachedDoc ? (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{attachedDoc.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(attachedDoc.size)} &middot; Ready for Quiz Generation</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    title="Remove attachment"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <textarea 
                  rows={4} 
                  placeholder="Paste syllabus, notes, or reference material here... Or attach a PDF/TXT file below." 
                  value={formData.context} 
                  onChange={e => setFormData({...formData, context: e.target.value})} 
                  disabled={isUploading}
                  className="w-full p-4 pb-14 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-400 transition-all shadow-xs resize-y disabled:opacity-60"
                />
                <label className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-all ${isUploading ? 'cursor-default opacity-70' : 'cursor-pointer'}`}>
                  {isUploading ? <Loader2 size={13} className="animate-spin text-slate-700" /> : <Paperclip size={13} />}
                  {isUploading ? 'Parsing Document...' : 'Attach Document'}
                  <input type="file" accept=".pdf,.txt,.docx,.md" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            )}
          </div>

          {generationError && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
              {generationError.includes('image') ? <ImageOff size={18} className="text-red-500 shrink-0 mt-0.5" /> : <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
              <div>
                <h4 className="text-sm font-bold text-red-900 mb-1">
                  {generationError.includes('image') ? 'Image Content Detected' : 'Generation Failed'}
                </h4>
                <p className="text-xs text-red-700 leading-relaxed">{generationError}</p>
              </div>
            </motion.div>
          )}

          {isUploading ? (
            <button 
              type="button" 
              disabled 
              className="w-full h-12 px-6 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Loader2 size={18} className="animate-spin text-slate-600" />
              Parsing Attached Document...
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? 'Generating Quiz...' : 'Generate with AI'}
            </button>
          )}

        </div>
      </form>
    </div>
  );
}
