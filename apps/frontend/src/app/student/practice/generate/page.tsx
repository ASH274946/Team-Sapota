'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle, ImageOff, Paperclip, ChevronLeft } from 'lucide-react';
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

export default function CustomQuizGenerator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', f);
    try {
      const res = await apiClient.post<{success:boolean, data:{content:string}}>('/generate/parse', fd);
      const parsedContent = res.data?.data?.content || '';
      setFormData(prev => ({ ...prev, context: parsedContent }));
      toast.success('Document parsed successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to parse document';
      toast.error(msg);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: '#0F172A', minHeight: '100vh' }}>
      <button 
        onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 24, padding: 0 }}
      >
        <ChevronLeft size={16} /> Back to Practice
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={24} color="#0F172A" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A' }}>Generate Quiz</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Configure AI parameters to generate a practice session on any topic.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
          
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Topic</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. Machine Learning Basics" 
                value={formData.topic} 
                onChange={e => setFormData({...formData, topic: e.target.value})} 
                style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Subject</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. Computer Science" 
                value={formData.subject} 
                onChange={e => setFormData({...formData, subject: e.target.value})} 
                style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Difficulty</label>
              <NativeSelect 
                value={formData.difficulty} 
                onChange={e => setFormData({...formData, difficulty: e.target.value})}
                style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#FFFFFF' }}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </NativeSelect>
            </div>
            <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Bloom Level</label>
              <NativeSelect 
                value={formData.bloom_level} 
                onChange={e => setFormData({...formData, bloom_level: e.target.value})}
                style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#FFFFFF' }}
              >
                <option value="REMEMBER">Remember</option>
                <option value="UNDERSTAND">Understand</option>
                <option value="APPLY">Apply</option>
                <option value="ANALYZE">Analyze</option>
                <option value="EVALUATE">Evaluate</option>
                <option value="CREATE">Create</option>
              </NativeSelect>
            </div>
            <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Number of Questions</label>
              <NativeSelect 
                value={formData.numQuestions} 
                onChange={e => setFormData({...formData, numQuestions: parseInt(e.target.value) || 5})}
                style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#FFFFFF' }}
              >
                {Array.from({ length: 15 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} Question{i > 0 ? 's' : ''}</option>
                ))}
              </NativeSelect>
            </div>
          </div>

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
            </div>
          </div>

          {generationError && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {generationError.includes('image') ? <ImageOff size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} /> : <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>
                  {generationError.includes('image') ? 'Image Content Detected' : 'Generation Failed'}
                </h4>
                <p style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.5 }}>{generationError}</p>
              </div>
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 16, padding: '16px', fontSize: 15, fontWeight: 700, width: '100%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? 'Generating Quiz...' : 'Generate with AI'}
          </button>

        </div>
      </form>
    </div>
  );
}
