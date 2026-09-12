import type { Metadata } from 'next';
import Link from 'next/link';
import { constructMetadata, getFaqSchema, getBreadcrumbSchema } from '@/lib/seo';
import { Sparkles, ArrowRight, FileUp, FileCheck } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Question Paper Generator from PDF, Word & Study Material',
  description:
    'Upload course PDFs, lecture notes, or syllabus files and instantly generate structured examination papers with answer keys and printable A4 PDF formatting.',
  path: '/question-paper-generator-from-pdf',
  keywords: [
    'question paper generator from PDF',
    'AI question generator from PDF',
    'generate questions from syllabus PDF',
    'question paper creator from notes',
  ],
});

export default function QuestionPaperFromPdfPage() {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Question Paper Generator from PDF', path: '/question-paper-generator-from-pdf' },
  ];

  const faqs = [
    {
      question: 'What document formats are supported by Vidya AI?',
      answer:
        'Vidya AI supports PDF (.pdf), Word (.docx, .doc), Plain Text (.txt), Markdown (.md), and Image documents (.png, .jpg, .webp).',
    },
    {
      question: 'How long does PDF text extraction and question generation take?',
      answer:
        'Document parsing and AI question synthesis execute asynchronously within seconds.',
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
        <div className="max-w-5xl mx-auto space-y-12">
          <nav className="text-xs text-neutral-400 flex items-center gap-2">
            <Link href="/" className="hover:text-orange-400">Home</Link>
            <span>/</span>
            <span className="text-neutral-200">Question Paper Generator from PDF</span>
          </nav>

          <header className="space-y-6 text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
              <Sparkles className="size-3.5" /> PDF & Document Content Extractor
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              Question Paper Generator from PDF & Documents
            </h1>
            <p className="text-base text-neutral-400">
              Upload textbook PDFs, lecture notes, or syllabus files. Vidya AI extracts units and builds complete exam papers instantly.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all"
              >
                Upload PDF & Generate Paper <ArrowRight className="size-4" />
              </Link>
            </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
              <FileUp className="size-6 text-orange-400" />
              <h3 className="text-base font-bold text-white">Multi-Format Media Extractor</h3>
              <p className="text-xs text-neutral-400">
                Extracts text and topic structures directly from PDF files, scanned images, Word docs, and syllabus outlines.
              </p>
            </div>
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
              <FileCheck className="size-6 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Automated Answer Key Generation</h3>
              <p className="text-xs text-neutral-400">
                Generates complete solutions and marking schemas alongside printable A4 question paper dossiers.
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
