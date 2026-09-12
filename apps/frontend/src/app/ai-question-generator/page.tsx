import type { Metadata } from 'next';
import Link from 'next/link';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { Sparkles, ArrowRight, BookOpen, Layers } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'AI Question Generator for Educators & Teachers',
  description:
    'Generate high-quality multiple choice, short answer, and system design questions across difficulty levels with Vidya AI. Curriculum-aligned and Bloom\'s Taxonomy mapped.',
  path: '/ai-question-generator',
  keywords: [
    'AI question generator',
    'question generator for teachers',
    'AI test question generator',
    'curriculum aligned question generator',
  ],
});

export default function AiQuestionGeneratorPage() {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'AI Question Generator', path: '/ai-question-generator' },
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
            <span className="text-neutral-200">AI Question Generator</span>
          </nav>

          <header className="space-y-6 text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
              <Sparkles className="size-3.5" /> High-Quality Question Generation
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              AI Question Generator for Educators
            </h1>
            <p className="text-base text-neutral-400">
              Generate topic-tailored questions at Easy, Medium, and Hard difficulty tiers mapped to Bloom&apos;s Taxonomy levels.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all"
              >
                Start Generating Questions <ArrowRight className="size-4" />
              </Link>
            </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
              <BookOpen className="size-6 text-orange-400" />
              <h3 className="text-base font-bold text-white">Subject-Aware Contextual Questions</h3>
              <p className="text-xs text-neutral-400">
                Generates questions specific to Operating Systems, DBMS, Computer Networks, AI/ML, and arbitrary engineering domain syllabi.
              </p>
            </div>
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
              <Layers className="size-6 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Cognitive Level Balancing</h3>
              <p className="text-xs text-neutral-400">
                Ensures questions cover conceptual recall, analytical problem solving, and complex system design.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
