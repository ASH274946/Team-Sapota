'use client';

import React from "react";
import { Shield, FileText, Scale, ScrollText, Users, Lock, HeartHandshake, Cookie, AlertTriangle } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import { useRouter } from "next/navigation";

export type LegalTab = "privacy" | "terms" | "cookie" | "acceptable";

interface LegalPageProps {
  initialTab: LegalTab;
}

export default function LegalPage({ initialTab }: LegalPageProps) {
  const router = useRouter();

  // Redirect to respective routes when clicking tabs instead of just changing state
  const handleTabChange = (tab: LegalTab) => {
    if (tab === "cookie") router.push("/cookie-policy");
    else if (tab === "acceptable") router.push("/acceptable-use");
    else router.push(`/${tab}`);
  };

  const pageTitle = {
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    cookie: "Cookie Policy",
    acceptable: "Acceptable Use Policy"
  }[initialTab];

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1e1e1a] font-sans flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 w-full">
        {/* Navigation Tabs Header */}
        <div className="border-b border-[#f3ede4] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#e05934] font-bold">
              Legal Compliance & Trust Framework
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-gray-950 mt-1 tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-gray-400 mt-2 font-mono">
              Last updated: June 23, 2026 • Version 2.1.2-PROD
            </p>
          </div>

          <div className="flex flex-wrap gap-2 bg-[#f3ede4]/40 p-1.5 rounded-xl border border-[#f3ede4] self-start md:self-auto shrink-0">
            <button
              onClick={() => handleTabChange("privacy")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                initialTab === "privacy"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-500 hover:text-black hover:bg-white/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5 hidden sm:block" />
              <span>Privacy</span>
            </button>
            <button
              onClick={() => handleTabChange("terms")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                initialTab === "terms"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-500 hover:text-black hover:bg-white/50"
              }`}
            >
              <FileText className="w-3.5 h-3.5 hidden sm:block" />
              <span>Terms</span>
            </button>
            <button
              onClick={() => handleTabChange("cookie")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                initialTab === "cookie"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-500 hover:text-black hover:bg-white/50"
              }`}
            >
              <Cookie className="w-3.5 h-3.5 hidden sm:block" />
              <span>Cookies</span>
            </button>
            <button
              onClick={() => handleTabChange("acceptable")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                initialTab === "acceptable"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-500 hover:text-black hover:bg-white/50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 hidden sm:block" />
              <span>Acceptable Use</span>
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-12 items-start">
          
          {/* Quick Sidebar Summary Widget */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#f3ede4] rounded-2xl p-6 shadow-xs">
              <h3 className="font-display font-bold text-sm text-gray-900 tracking-tight flex items-center space-x-2 pb-4 border-b border-gray-50">
                <ScrollText className="w-4 h-4 text-[#e05934]" />
                <span>Document Core Summary</span>
              </h3>
              
              <div className="space-y-4 mt-5">
                {initialTab === "privacy" && (
                  <>
                    <div className="flex gap-3">
                      <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Data Security</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">All scanned exams and grades are AES-256 encrypted at rest and TLS 1.3 encrypted in transit.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Student Privacy</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Fully FERPA and COPPA compliant. We do not sell or monetize student records to third parties.</p>
                      </div>
                    </div>
                  </>
                )}
                
                {initialTab === "terms" && (
                  <>
                    <div className="flex gap-3">
                      <Scale className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Teacher Authority</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">AI provides advisory scoring only. All final grades remain under exclusive human control and validation.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <HeartHandshake className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Fair Use & Rubrics</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Schools own the intellectual property of uploaded tests, rubrics, and feedback texts.</p>
                      </div>
                    </div>
                  </>
                )}

                {initialTab === "cookie" && (
                  <>
                    <div className="flex gap-3">
                      <Cookie className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Essential Only</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">We strictly use cookies necessary for authentication and secure session management. No third-party ad tracking.</p>
                      </div>
                    </div>
                  </>
                )}

                {initialTab === "acceptable" && (
                  <>
                    <div className="flex gap-3">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Zero Tolerance</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Uploading unauthorized material, attempting to bypass security, or scraping student data results in immediate termination.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-[#f3ede4]/20 border border-[#f3ede4]/60 rounded-2xl p-6">
              <p className="text-xs font-bold text-gray-800 leading-normal">Need Direct Clarification?</p>
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                If you have queries regarding FERPA compliance, SOC 2 audit sheets, or educational agreements, our compliance desk is ready to answer.
              </p>
              <a 
                href="mailto:compliance@vidyaai.edu"
                className="inline-block text-xs font-bold text-[#e05934] hover:underline mt-3"
              >
                compliance@vidyaai.edu →
              </a>
            </div>
          </div>

          {/* Core Text Section */}
          <div className="lg:col-span-8 bg-white border border-[#f3ede4] rounded-2xl p-6 sm:p-10 shadow-md">
            
            {initialTab === "privacy" && (
              <div className="space-y-8 text-xs text-gray-600 leading-relaxed">
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">1. Commitment to Student Privacy</h2>
                  <p>VidyaAI ("Platform", "we", "us") prioritizes the absolute security and privacy of classroom data. We serve as a direct Data Processor on behalf of educational organizations, adhering to strictly validated international laws governing student data records.</p>
                  <p className="mt-2">In compliance with the <strong>Family Educational Rights and Privacy Act (FERPA)</strong> and the <strong>Children's Online Privacy Protection Act (COPPA)</strong>, we never establish direct monetization profiles or distribute academic records for marketing purposes.</p>
                </section>
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">2. Types of Data We Process</h2>
                  <p>To operate our subjective evaluation assistance tools, we collect and store:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5 font-sans">
                    <li><strong className="text-gray-800">Scanned Student Answer Papers:</strong> Hand-written sheets or digital documents uploaded directly by verified instructional staff.</li>
                    <li><strong className="text-gray-800">Teacher Assessments & Rubric Sets:</strong> Benchmark outlines, marks limits, specialized criteria.</li>
                    <li><strong className="text-gray-800">Assigned Student Identifiers:</strong> Names and roll number maps explicitly submitted by administrators.</li>
                  </ul>
                </section>
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">3. AI Processing & Large Language Models</h2>
                  <p>VidyaAI leverages secure, enterprise-grade AI LLM model endpoints. Crucially, <strong>our model configurations explicitly opt-out of data reuse pipelines</strong>:</p>
                  <div className="bg-[#fcfbf9] border border-[#f3ede4] p-3.5 rounded-xl font-mono text-[10px] my-3 text-gray-700 leading-normal">
                    📍 NO STUDENT ASSESSMENTS, SCORED COERCIONS, OR FEEDBACK PARAGRAPHS ARE RETAINED BY PUBLIC TRAINING PIPELINES.
                  </div>
                  <p>This guarantees that your school's unique curriculum and student responses remain fully private and unshared.</p>
                </section>
              </div>
            )}

            {initialTab === "terms" && (
              <div className="space-y-8 text-xs text-gray-600 leading-relaxed">
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">1. Terms of Agreement Overview</h2>
                  <p>Welcome to VidyaAI. By provisioning institutional seats, activating teacher accounts, or uploading subjective student exams, your organization ("Subscriber", "you", "User") agrees to be programmatically bound by these terms. If you operate on behalf of a public or private school body, you represent that you hold full corporate authority to consent on behalf of your respective district.</p>
                </section>
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">2. AI Copilot Advisory Limits</h2>
                  <p>VidyaAI serves strictly as a **subjective diagnostic assistant (Copilot)** for academic grading tasks:</p>
                  <div className="bg-[#fcfbf9] border border-[#f3ede4] p-3.5 rounded-xl font-mono text-[10px] my-3 text-gray-700 leading-normal">
                    ⚠️ THE SOFTWARE GENERATES ADVISORY SCORE PROFILES AND SUGGESTIVE FEEDBACK PARAGRAPHS BASED ON SELECTED RUBRICS. ALL RESULTS ARE EXPLICITLY CLASSIFIED AS INTERMEDIATE WORK PRODUCTS. INSTRUCTIONAL STAFF ARE MANDATED TO PERSONALLY AUDIT, ACCEPT, OR OVERRIDE ALL SCORES PRIOR TO SYNC JOINING DISTRICT LER/SIS SYSTEM SHEETS.
                  </div>
                </section>
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">3. Intellectual Property Rights</h2>
                  <p>We cherish ownership rights and support authentic licensing environments:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li><strong className="text-gray-800">Your Stuff:</strong> The institution retains original ownership over all uploaded test queries, written student exam answers, and tailored local rubrics.</li>
                    <li><strong className="text-gray-800">Our Stuff:</strong> VidyaAI owns the proprietary platform layout, core OCR parsing matrices, prompt construction architectures, and visual assets.</li>
                  </ul>
                </section>
              </div>
            )}

            {initialTab === "cookie" && (
              <div className="space-y-8 text-xs text-gray-600 leading-relaxed">
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">1. Strictly Necessary Cookies</h2>
                  <p>Because VidyaAI handles sensitive educational records, we only deploy "Strictly Necessary Cookies". These cookies are essential to provide you with services available through our Platform and to use some of its features, such as access to secure institutional areas.</p>
                  <p className="mt-2">Without these cookies, the services that you have asked for (like secure login to the grading dashboard) cannot be provided. We only use these cookies to provide you with those services.</p>
                </section>
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">2. Analytics and Tracking</h2>
                  <p>We do not use third-party advertising cookies, trackers, or marketing pixels on our logged-in application dashboard. Student data is never exposed to third-party ad networks.</p>
                  <p className="mt-2">We use secure, self-hosted telemetry solely to identify application crashes, latency issues, and OCR processing bottlenecks to improve platform stability.</p>
                </section>
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">3. Managing Cookies</h2>
                  <p>You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. However, if you disable or refuse cookies, please note that the VidyaAI portal will become inaccessible, as secure session tokens require local cookie storage.</p>
                </section>
              </div>
            )}

            {initialTab === "acceptable" && (
              <div className="space-y-8 text-xs text-gray-600 leading-relaxed">
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">1. Lawful Educational Use</h2>
                  <p>You may use our services only for lawful educational purposes and in accordance with this Acceptable Use Policy. You agree not to use the services:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>In any way that violates applicable federal, state, local, or international law or regulation (including FERPA and COPPA).</li>
                    <li>To evaluate assignments that are not generated by students actively enrolled in your institution.</li>
                    <li>To upload documents containing personally identifiable information (PII) beyond what is strictly necessary for assignment identification.</li>
                  </ul>
                </section>
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">2. System Integrity and Security</h2>
                  <p>We enforce strict security boundaries. You must not:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>Attempt to probe, scan, or test the vulnerability of our AI models or networks.</li>
                    <li>Attempt to breach security or authentication measures without proper authorization.</li>
                    <li>Interfere with or disrupt the services or servers, including submitting requests designed to trigger AI hallucination or bypass prompt security filters.</li>
                    <li>Use any automated system, including "robots," "spiders," or "offline readers," to access the services.</li>
                  </ul>
                </section>
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">3. Enforcement and Termination</h2>
                  <p>We reserve the right to investigate and take appropriate legal action against anyone who, in our sole discretion, violates this provision, including without limitation, reporting you to law enforcement authorities. Violations of system or network security may result in civil or criminal liability.</p>
                </section>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Footer handles its own layout now, just drop it in */}
      <Footer onContactClick={() => router.push('/contact')} onNavigate={(view) => {
        if(view === 'home') router.push('/');
        else router.push(`/${view}`);
      }} />
    </div>
  );
}
