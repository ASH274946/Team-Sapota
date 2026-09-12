'use client';

import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export interface QuizFormData {
  topic: string;
  subject: string;
  difficulty: string;
  bloom_level: string;
  numQuestions: number;
  context: string;
}

interface QuizGeneratorFormProps {
  formData: QuizFormData;
  setFormData: (data: QuizFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export function QuizGeneratorForm({ formData, setFormData, onSubmit, loading }: QuizGeneratorFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="label">Topic</label>
            <input required type="text" className="input" placeholder="e.g. Machine Learning Basics" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="label">Subject</label>
            <input required type="text" className="input" placeholder="e.g. Computer Science" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
          <div className="input-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="label">Difficulty</label>
            <Select value={formData.difficulty} onValueChange={val => setFormData({...formData, difficulty: val || 'MEDIUM'})}>
              <SelectTrigger className="input">
                <SelectValue placeholder="Select Difficulty">
                  {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1).toLowerCase()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="label">Bloom Level</label>
            <Select value={formData.bloom_level} onValueChange={val => setFormData({...formData, bloom_level: val || 'APPLY'})}>
              <SelectTrigger className="input">
                <SelectValue placeholder="Select Bloom Level">
                  {formData.bloom_level.charAt(0).toUpperCase() + formData.bloom_level.slice(1).toLowerCase()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REMEMBER">Remember</SelectItem>
                <SelectItem value="UNDERSTAND">Understand</SelectItem>
                <SelectItem value="APPLY">Apply</SelectItem>
                <SelectItem value="ANALYZE">Analyze</SelectItem>
                <SelectItem value="EVALUATE">Evaluate</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="label">Number of Questions</label>
            <Select value={formData.numQuestions.toString()} onValueChange={val => setFormData({...formData, numQuestions: parseInt(val || '5') || 5})}>
              <SelectTrigger className="input">
                <SelectValue placeholder="Select number of questions">
                  {formData.numQuestions} Question{formData.numQuestions > 1 ? 's' : ''}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }).map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1} Question{i > 0 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="input-group" style={{ marginTop: 14 }}>
          <label className="label">Reference Context (Optional)</label>
          <textarea rows={4} className="input" placeholder="Paste syllabus or reference material here... Avoid pasting images or file paths." value={formData.context} onChange={e => setFormData({...formData, context: e.target.value})} style={{ resize: 'none' }} />
        </div>

        <button type="submit" disabled={loading} className="btn btn-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, marginTop: 16, width: '100%' }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Generating Quiz...' : 'Generate with AI'}
        </button>
      </div>
    </form>
  );
}
