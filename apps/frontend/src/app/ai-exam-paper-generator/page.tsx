import type { Metadata } from 'next';
import Link from 'next/link';
import { constructMetadata, getFaqSchema, getBreadcrumbSchema } from '@/lib/seo';
import { CheckCircle2, Sparkles, FileText, ArrowRight, ShieldCheck, Cpu, Layers, Download } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'AI Exam Paper Generator for Colleges & Universities',
  description:
    'Generate balanced, curriculum-aligned exam papers in seconds with Vidya AI. Supports Easy/Medium/Hard difficulty tiers, Bloom\'s Taxonomy, automated answer keys, and printable A4 PDFs.',
  path: '/ai-exam-paper-generator',
  keywords: [
    'AI exam paper generator',
    'automated exam paper generation',
    'college exam paper generator',
    'university exam paper generator',
    'A4 question paper generator PDF',
    'exam question generator',
  ],
});

export default function AiExamPaperGeneratorPage() {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'AI Exam Paper Generator', path: '/ai-exam-paper-generator' },
  ];

  const faqs = [
    {
      question: 'What is an AI Exam Paper Generator?',
      answer:
        'An AI Exam Paper Generator is an automated software system that transforms course syllabi, lecture notes, and textbook PDFs into structured, balanced examination papers complete with cognitive weightage distributions and matching answer keys.',
    },
    {
      question: 'How does Vidya AI ensure question paper quality and accuracy?',
      answer:
        'Vidya AI utilizes an asynchronous generation pipeline that validates structural constraints, enforces Bloom\'s Taxonomy cognitive levels, verifies mark distributions, and formats output into printable A4 PDFs.',
    },
    {
      question: 'Can Vidya AI generate exam papers with matching answer keys?',
      answer:
        'Yes. Every generated examination paper automatically produces a matching answer key and detailed marking schema for rapid evaluation.',
    },
    {
      question: 'Can I export generated exam papers to printable PDF format?',
      answer:
        'Yes. Vidya AI compiles question papers into official A4 printable PDF specifications ready for institutional printing and distribution.',
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
          {/* Breadcrumb */}
          <nav className="text-xs text-neutral-400 flex items-center gap-2">
            <Link href="/" className="hover:text-orange-400">Home</Link>
            <span>/</span>
            <span className="text-neutral-200">AI Exam Paper Generator</span>
          </nav>

          {/* Hero Section */}
          <header className="space-y-6 text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
              <Sparkles className="size-3.5" /> Next-Gen AI Exam Paper Generation
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              AI Exam Paper Generator for Colleges & Universities
            </h1>
            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
              Transform syllabus documents, reference books, and lecture notes into balanced, institutional-grade examination papers with Bloom&apos;s Taxonomy alignment and instant A4 PDF exports.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
              >
                Generate Exam Paper Now <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/question-paper-generator-from-pdf"
                className="px-6 py-3 border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-200 font-bold rounded-xl text-sm transition-all"
              >
                Generate from PDF
              </Link>
            </div>
          </header>

          {/* Key Value Proposition Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-3">
              <Cpu className="size-8 text-orange-400" />
              <h3 className="text-base font-bold text-white">Asynchronous Generation Pipeline</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Processes complex curriculum files in background workers without timeouts, ensuring 100% reliable generation at institutional scale.
              </p>
            </div>
            <div className="p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-3">
              <Layers className="size-8 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Bloom&apos;s Cognitive Levels</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Automatically balances questions across Remember, Understand, Apply, Analyze, Evaluate, and Create levels for NBA/NAAC compliance.
              </p>
            </div>
            <div className="p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-3">
              <Download className="size-8 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Printable A4 PDF Dossiers</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Produces clean, formatted examination papers complete with department headers, mark distributions, sub-questions, and answer keys.
              </p>
            </div>
          </section>

          {/* Detailed Features */}
          <section className="space-y-8 bg-neutral-900/40 border border-neutral-800/80 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-white">How Vidya AI Automates Exam Paper Creation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-neutral-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Upload Syllabus or Textbooks</strong>
                  Upload PDFs, Word documents, or text files containing course units and topics.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Configure Marks & Sections</strong>
                  Set 50-mark Mid-Semesters, 100-mark End-Semesters, or 30-mark Quizzes with customizable Part A, B, and C sections.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Cognitive & Difficulty Distribution</strong>
                  Define Easy, Medium, and Hard question proportions aligned to Course Outcomes (CO1–CO6).
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Automated Answer Key & PDF Export</strong>
                  Instant output of complete question papers with matching solutions in printable A4 layout.
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
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

          {/* Call to Action */}
          <footer className="p-8 bg-gradient-to-r from-orange-500/20 via-neutral-900 to-indigo-500/20 border border-neutral-800 rounded-3xl text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Ready to Automate Your Institution&apos;s Examinations?</h2>
            <p className="text-xs text-neutral-300 max-w-xl mx-auto">
              Join educators and academic institutions saving thousands of hours with AI-powered assessment generation.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg"
            >
              Start Generating Free <ArrowRight className="size-4" />
            </Link>
          </footer>
        </div>
      </div>
    </>
  );
}
