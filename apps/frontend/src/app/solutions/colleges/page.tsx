import type { Metadata } from 'next';
import Link from 'next/link';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { Sparkles, ArrowRight, Building2, ShieldCheck, GraduationCap } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Exam Automation & Assessment Software for Colleges',
  description:
    'Empower college faculty with Vidya AI. Automate question paper creation, outcome-based education (OBE) mapping, and NBA SAR report generation.',
  path: '/solutions/colleges',
  keywords: [
    'exam paper generator for colleges',
    'assessment software for colleges',
    'college examination automation',
    'engineering college question paper generator',
  ],
});

export default function SolutionsCollegesPage() {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Solutions', path: '/solutions/colleges' },
    { name: 'Colleges', path: '/solutions/colleges' },
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
            <span>Solutions</span>
            <span>/</span>
            <span className="text-neutral-200">Colleges</span>
          </nav>

          <header className="space-y-6 text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
              <Sparkles className="size-3.5" /> Institutional Solutions
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              Exam Automation Software for Colleges
            </h1>
            <p className="text-base text-neutral-400">
              Streamline internal assessment workflows, unit tests, and semester examinations across all academic departments.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all"
              >
                Onboard Institution <ArrowRight className="size-4" />
              </Link>
            </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
              <Building2 className="size-6 text-orange-400" />
              <h3 className="text-base font-bold text-white">Departmental Scaling</h3>
              <p className="text-xs text-neutral-400">
                Supports Computer Science, Electronics, Mechanical, Civil, Science, and Management faculties.
              </p>
            </div>
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
              <ShieldCheck className="size-6 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Accreditation Ready</h3>
              <p className="text-xs text-neutral-400">
                Generates 1-Click NBA Self-Assessment Reports (SAR) with complete CO-PO attainment math.
              </p>
            </div>
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
              <GraduationCap className="size-6 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Role Management</h3>
              <p className="text-xs text-neutral-400">
                Super Admin, Department Admin, Teacher, and Student access controls.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
