'use client';

import { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import {
  BookOpen,
  Search,
  FileText,
  Bookmark,
  Sparkles,
  Quote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Citation,
  CitationTrigger,
  CitationContent,
  CitationItem,
  CitationSource,
} from '@/components/ui/Citation';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ui/Reasoning';
import { TextShimmer } from '@/components/ui/TextShimmer';
import { FeedbackBar } from '@/components/ui/FeedbackBar';
import { PdfViewer } from '@/components/ui/PdfViewer';

const MOCK_LIBRARY = [
  { id: '1', title: 'Attention Is All You Need', authors: 'Vaswani et al.', type: 'Journal Paper', year: 2017 },
  { id: '2', title: 'Deep Learning for Education', authors: 'Smith, J.', type: 'Book', year: 2023 },
  { id: '3', title: 'Hybrid RAG Architecture in Academic Systems', authors: 'Doe, A. et al.', type: 'Conference Proceeding', year: 2025 },
  { id: '4', title: 'Multimodal Student Performance Dataset', authors: 'Institution Lab', type: 'Dataset', year: 2026 },
  { id: '5', title: 'System for Dynamic RAG Orchestration', authors: 'Doe, A.', type: 'Patent', year: 2026 },
];

const CITATIONS: Record<string, CitationSource> = {
  vaswani: {
    title: 'Attention Is All You Need',
    url: 'https://arxiv.org/abs/1706.03762',
    domain: 'arxiv.org',
    description: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, based solely on attention mechanisms.',
    page: 3,
  },
  ragArch: {
    title: 'Hybrid RAG Architecture for Higher Ed (2025)',
    domain: 'vidyaai.internal/repository',
    description: 'Demonstrates dense vector search paired with sparse BM25 indexing to achieve 94.2% retrieval accuracy on accreditation and course syllabus queries.',
    page: '14-16',
  },
  accreditation: {
    title: 'National Board of Accreditation (NBA) Tier-1 Criteria',
    url: 'https://www.nbaind.org',
    domain: 'nbaind.org',
    description: 'Program Outcomes (POs) and Course Outcomes (COs) attainment mapping requirements for engineering & polytechnic curricula.',
    page: 28,
  },
};

export default function ResearchHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReview, setActiveReview] = useState<string | null>(null);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);

  const handleCopilotAction = (type: string) => {
    setIsGeneratingReview(true);
    setActiveReview(type);
    toast.success('AI RAG Engine is retrieving knowledge base documents...');
    setTimeout(() => {
      setIsGeneratingReview(false);
      toast.success('RAG Literature Review synthesized with live citations!');
    }, 1800);
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <PageHeader
          title="Digital Library & Research Hub"
          subtitle="Explore institutional repositories, manage citations, and accelerate research with Hybrid RAG."
        />
        <div className="flex items-center gap-3">
          <Button variant="outline"><Bookmark size={16} className="mr-2" /> My Library</Button>
          <Button variant="primary">Upload Paper</Button>
        </div>
      </div>

      {/* Semantic Search Box */}
      <Card padding="20px">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search by title, author, keyword, or semantic concept (Powered by Hybrid RAG)..." 
              className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm border border-neutral-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="primary" className="px-6 h-11" onClick={() => toast.success('Searching knowledge base...')}>
            Search
          </Button>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Digital Library & Synthesized Review */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active RAG Synthesis Result with Citations */}
          {activeReview && (
            <Card padding="24px" className="border-orange-200 bg-orange-50/20 shadow-xs">
              <div className="flex items-center justify-between border-b border-orange-200/60 pb-3 mb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                  <Sparkles className="w-4 h-4 text-[#e05934]" />
                  <span>RAG Synthesized Literature Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    3 Sources Verified
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setActiveReview(null)}>
                    Close
                  </Button>
                </div>
              </div>

              {isGeneratingReview ? (
                <div className="py-8 text-center space-y-3">
                  <TextShimmer className="text-sm">Retrieving embeddings and grounding citations...</TextShimmer>
                </div>
              ) : (
                <div className="space-y-4 text-xs sm:text-sm text-neutral-800 leading-relaxed">
                  <Reasoning defaultExpanded={false}>
                    <ReasoningTrigger label="Reasoned over 3 institutional documents in 1.4s" />
                    <ReasoningContent>
                      {`1. Ingested "Hybrid RAG Architecture" (chunk 4-7) for vector similarity.\n2. Cross-referenced NBA criteria guidelines on Outcome-Based Education.\n3. Validated citations against peer-reviewed corpus.`}
                    </ReasoningContent>
                  </Reasoning>

                  <div className="p-4 bg-white rounded-xl border border-neutral-200/80 shadow-2xs space-y-3">
                    <p>
                      Modern institutional learning workflows increasingly depend on Transformer attention mechanisms
                      <Citation citations={[CITATIONS.vaswani]} index={1}>
                        <CitationTrigger />
                        <CitationContent>
                          <CitationItem />
                        </CitationContent>
                      </Citation>
                      combined with hybrid retrieval-augmented generation
                      <Citation citations={[CITATIONS.ragArch]} index={2}>
                        <CitationTrigger />
                        <CitationContent>
                          <CitationItem />
                        </CitationContent>
                      </Citation>
                      to ensure 100% factual curriculum alignment.
                    </p>

                    <p>
                      Furthermore, automated question generation systems must adhere strictly to outcome-based education (OBE) guidelines
                      <Citation citations={[CITATIONS.accreditation]} index={3}>
                        <CitationTrigger />
                        <CitationContent>
                          <CitationItem />
                        </CitationContent>
                      </Citation>
                      to ensure seamless accreditation compliance across engineering departments.
                    </p>

                    <div className="pt-2 flex justify-end border-t border-neutral-100">
                      <FeedbackBar
                        targetId="rag_review"
                        targetType="literature_review"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Institutional Repository Feed */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">Institutional Repository</h3>
            {MOCK_LIBRARY.map((item) => (
              <Card key={item.id} padding="20px" className="hover:border-neutral-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#e05934] bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
                      {item.type}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-neutral-900 mt-1.5">{item.title}</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">{item.authors} • {item.year}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopilotAction('review')}>
                      <Quote size={14} className="mr-1.5" /> Cite
                    </Button>
                    <PdfViewer
                      file="https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf"
                      title={item.title}
                      buttonText="View PDF"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: AI Copilot & Thesis Workspace */}
        <div className="lg:col-span-4 space-y-6">
          <Card padding="24px" className="bg-orange-50/40 border border-orange-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#e05934] text-white flex items-center justify-center shadow-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">AI Research Copilot</h3>
                <p className="text-xs text-neutral-500">Hybrid RAG Knowledge Engine</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mb-5 leading-relaxed">
              Accelerate your academic research with grounded RAG assistance. Find gaps, synthesize literature, and verify citations.
            </p>

            <div className="flex flex-col gap-2.5">
              <Button
                variant="outline"
                className="justify-start bg-white text-xs font-semibold hover:border-orange-400"
                onClick={() => handleCopilotAction('Literature Review')}
              >
                <FileText size={15} className="mr-2 text-[#e05934]" /> Generate Literature Review
              </Button>
              <Button
                variant="outline"
                className="justify-start bg-white text-xs font-semibold hover:border-orange-400"
                onClick={() => handleCopilotAction('Research Gaps')}
              >
                <Search size={15} className="mr-2 text-[#e05934]" /> Detect Research Gaps
              </Button>
              <Button
                variant="outline"
                className="justify-start bg-white text-xs font-semibold hover:border-orange-400"
                onClick={() => handleCopilotAction('Key Findings')}
              >
                <BookOpen size={15} className="mr-2 text-[#e05934]" /> Summarize Key Findings
              </Button>
              <Button
                variant="outline"
                className="justify-start bg-white text-xs font-semibold text-purple-700 border-purple-200 hover:bg-purple-50"
                onClick={() => handleCopilotAction('Patent Novelty')}
              >
                <Sparkles size={15} className="mr-2 text-purple-600" /> Patent Novelty Detection
              </Button>
            </div>
          </Card>

          {/* Thesis Workspace */}
          <Card padding="20px">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">My Research Workspace</h3>
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/70 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-800">PhD Proposal Draft</span>
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  In Review
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div className="w-[65%] h-full bg-[#e05934]" />
              </div>
              <div className="text-[11px] text-neutral-400">Awaiting Supervisor Feedback • 3 Citations Grounded</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
