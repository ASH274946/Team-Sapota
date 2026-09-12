import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "What is the return on investment (ROI) for a school using VidyaAI?",
      answer: "Schools using VidyaAI save over 32 hours per teacher every month on grading and homework checking workload. This translates directly to reduced administrative costs, decreased teacher burnout and turnover, and elevated academic quality benchmarks that drive enrollment and parent confidence."
    },
    {
      question: "Is VidyaAI replacing teachers?",
      answer: "Not at all. VidyaAI operates as a powerful co-pilot and teaching assistant. We automate repetitive tasks (like scoring baseline questions and generating detailed analytics charts) so teachers can focus entirely on what they do best: lecturing, clarifying deep learning blocks, and providing personalized student guidance."
    },
    {
      question: "How accurate is AI-based grading?",
      answer: "VidyaAI aligns closely with human examiners by analyzing specific customizable school rubrics and curriculum guidelines. Teachers review and retain total oversight over grades; currently, 98% of AI-generated markings are approved by human instructors without any adjustments."
    },
    {
      question: "Will teachers find it difficult to use?",
      answer: "VidyaAI is designed with administrative simplicity at its core. It requires no elaborate software retraining or workflow adjustments. Teachers upload pictures or PDFs of standard worksheets, and VidyaAI populates grade lists and feedback reports automatically in seconds."
    },
    {
      question: "What types of assessments can be evaluated?",
      answer: "VidyaAI easily evaluates both objective metrics (fill-in-the-blanks, multiple choice lists) and complex subjective exams (math steps, long science answers, humanities essays, diagrams, and formulas) across CBSE, ICSE, and international boards."
    },
    {
      question: "Is student data secure and private?",
      answer: "Absolutely. VidyaAI is built with enterprise-grade security protocols. All student data and assessments are encrypted end-to-end and stored on secure cloud servers. We comply with GDPR and local data protection regulations, ensuring that student information is never shared or used for unauthorized purposes."
    },
    {
      question: "How long does onboarding take for a school?",
      answer: "Our seamless onboarding process typically takes less than 48 hours. We handle the initial setup, curriculum alignment, and rubric customization. Since the interface is highly intuitive, teachers require minimal training and can start using VidyaAI immediately after a short orientation session."
    },
    {
      question: "Can we integrate VidyaAI with our existing LMS?",
      answer: "Yes, VidyaAI offers flexible API endpoints for seamless integration with major Learning Management Systems (LMS) and school ERPs. Grades, analytics, and feedback reports can be automatically synced to your existing digital infrastructure, ensuring a unified experience for administrators and teachers."
    }
  ];

  return (
    <section className="py-24 bg-white border-b border-[#f3ede4]" id="faqs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center mb-16">
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[#e05934] uppercase bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full inline-block mb-3">
            Got Questions?
          </span>
          <h2 className="font-display font-medium text-2xl sm:text-3.5xl text-gray-950 tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Start free, go pro when you're ready! No limits, no pressure.
          </p>
        </div>

        {/* Accordions Rows */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-[#fdfcfb] border border-[#f3ede4] rounded-2xl overflow-hidden transition-all duration-300 hover:border-orange-200/55"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left px-5 sm:px-6 py-5 flex items-center justify-between gap-4 font-display"
                >
                  <span className="font-bold text-xs sm:text-sm text-gray-950 leading-snug">
                    {faq.question}
                  </span>
                  
                  {/* Plus/Minus Indicator */}
                  <span className="p-1 rounded-lg bg-orange-50/50 border border-orange-100 text-[#e05934] shrink-0">
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-0 border-t border-gray-100">
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans mt-4">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
