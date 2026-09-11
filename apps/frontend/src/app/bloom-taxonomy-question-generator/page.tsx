import type { Metadata } from 'next';
import Link from 'next/link';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { Sparkles, ArrowRight, Brain, Award } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Bloom\'s Taxonomy Question Generator & Assessment Software',
  description:
    'Generate questions mapped across Bloom\'s 6 cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create) for NBA and NAAC accreditation compliance.',
  path: '/bloom-taxonomy-question-generator',
  keywords: [
    'Bloom\'s Taxonomy question generator',
    'cognitive level question generator',
    'NBA Criterion 4 assessment software',
    'curriculum outcome mapping',
  ],
});

export default function BloomTaxonomyQuestionGeneratorPage() {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Bloom\'s Taxonomy Question Generator', path: '/bloom-taxonomy-question-generator' },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getBreadcrumbSchema(breadcrumbs)) }}
      />

      <div className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <nav className="text-xs text-neutral-400 flex items-center gap-2">
            <Link href="/" className="hover:text-orange-400">Home</Link>
            <span>/</span>
            <span className="text-neutral-200">Bloom&apos;s Taxonomy Question Generator</span>
          </nav>

          <header className="space-y-6 text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
              <Sparkles className="size-3.5" /> Outcome-Based Education (OBE)
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              Bloom&apos;s Taxonomy Question Generator
            </h1>
            <p className="text-base text-neutral-400">
              Ensure strict compliance with NBA Criterion 4 and NAAC guidelines by balancing question papers across cognitive levels.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all"
              >
                Generate Bloom&apos;s Mapped Exams <ArrowRight className="size-4" />
              </Link>
            </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
              <Brain className="size-6 text-orange-400" />
              <h3 className="text-base font-bold text-white">6 Cognitive Levels</h3>
              <p className="text-xs text-neutral-400">
                Maps questions accurately across Remember, Understand, Apply, Analyze, Evaluate, and Create tiers.
              </p>
            </div>
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
              <Award className="size-6 text-emerald-400" />
              <h3 className="text-base font-bold text-white">NBA SAR Report Alignment</h3>
              <p className="text-xs text-neutral-400">
                Computes Course Outcome (CO) and Program Outcome (PO) correlation matrices automatically.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
