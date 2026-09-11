import type { Metadata } from 'next';
import Link from 'next/link';
import { constructMetadata, getFaqSchema, getBreadcrumbSchema } from '@/lib/seo';
import { Sparkles, ArrowRight, CheckCircle2, FileSpreadsheet, ShieldAlert, Cpu } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'AI Question Paper Generator from Syllabus & Documents',
  description:
    'Create balanced, institutional question papers from course syllabi, lecture notes, and reference materials with Vidya AI. Automated Bloom\'s Taxonomy mapping and A4 PDF export.',
  path: '/ai-question-paper-generator',
  keywords: [
    'AI question paper generator',
    'question paper generator from syllabus',
    'automatic question paper generator',
    'engineering college question paper generator',
    'question paper creator',
  ],
});

export default function AiQuestionPaperGeneratorPage() {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'AI Question Paper Generator', path: '/ai-question-paper-generator' },
  ];

  const faqs = [
    {
      question: 'How does the AI Question Paper Generator work?',
      answer:
        'Vidya AI analyzes uploaded course syllabus files or pasted curriculum topics, categorizes units into Course Outcomes (CO1–CO6), generates questions across difficulty tiers (Easy, Medium, Hard), and compiles structured question papers with optional choices.',
    },
    {
      question: 'Is Vidya AI suitable for engineering colleges and universities?',
      answer:
        'Yes. Vidya AI is tailored for engineering, medical, science, and humanities faculties, adhering strictly to NBA Criterion 4 outcome-based assessment standards.',
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getBreadcrumbSchema(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getFaqSchema(faqs)) }}
      />

      <div className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-16">
          <nav className="text-xs text-neutral-400 flex items-center gap-2">
            <Link href="/" className="hover:text-orange-400">Home</Link>
            <span>/</span>
            <span className="text-neutral-200">AI Question Paper Generator</span>
          </nav>

          <header className="space-y-6 text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
              <Sparkles className="size-3.5" /> Institutional Question Paper Generation
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              AI Question Paper Generator from Syllabus & Materials
            </h1>
            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
              Automate question paper creation for mid-terms, final exams, and quizzes directly from your course curriculum and syllabus units.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
              >
                Create Question Paper <ArrowRight className="size-4" />
              </Link>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-neutral-900/50 border border-neutral-800 rounded-3xl space-y-4">
              <FileSpreadsheet className="size-8 text-orange-400" />
              <h3 className="text-lg font-bold text-white">Syllabus-to-Question Mapping</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Automatically extracts units and topics from uploaded PDF/Word documents and maps every question to specific Course Outcomes (COs).
              </p>
            </div>
            <div className="p-8 bg-neutral-900/50 border border-neutral-800 rounded-3xl space-y-4">
              <ShieldAlert className="size-8 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Structural Validation & Repair</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Validates mark totals, section choices, and cognitive depth prior to PDF rendering, eliminating formatting errors.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-6 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-2">
                  <h3 className="text-base font-bold text-white">{faq.question}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
