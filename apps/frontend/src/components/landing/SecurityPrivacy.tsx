import React from "react";
import { KeyRound, DatabaseZap, Lock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function SecurityPrivacy() {
  const steps = [
    {
      num: "01",
      title: "Privacy First",
      desc: "Student data is strictly protected, never sold, and hidden from unauthorized administrative structures.",
      icon: <Lock className="w-6 h-6 text-[#e05934]" />,
      detail: "Double-walled access scopes"
    },
    {
      num: "02",
      title: "End-to-End Encryption",
      desc: "256-bit active encryption standard applies both in transit and at rest, protecting records flawlessly.",
      icon: <KeyRound className="w-6 h-6 text-[#e05934]" />,
      detail: "AES-256 standard protocols"
    },
    {
      num: "03",
      title: "No Student Data in AI Training",
      desc: "Our localized LLM endpoints do not store, reuse, or leak student handwriting and text responses for training.",
      icon: <DatabaseZap className="w-6 h-6 text-[#e05934]" />,
      detail: "Zero retaining model pipelines"
    }
  ];

  return (
    <section className="py-24 bg-white border-b border-[#f3ede4]" id="security">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[#e05934] uppercase bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full inline-block mb-3">
            Institutional Trust
          </span>
          <h2 className="font-display font-medium text-2xl sm:text-3xl md:text-3xl.5 text-gray-900 tracking-tight">
            Security & Privacy
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-lg mx-auto">
            A clear, intuitive dashboard reveals performance trends, learning gaps, and data-driven recommendations for every class.
          </p>
        </div>

        {/* 3 Columns Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-[#fdfcfb] border border-[#f3ede4] rounded-2xl p-6.5 relative flex flex-col justify-between hover:border-orange-200 transition-colors"
            >
              {/* Corner Count indicator */}
              <span className="absolute top-4 right-5 text-gray-200 font-mono text-xs font-bold font-mono">
                {step.num}
              </span>

              <div>
                {/* Visual Icon Header */}
                <div className="p-3 bg-white rounded-xl border border-[#f3ede4] inline-block mb-6 shadow-xs">
                  {step.icon}
                </div>

                <h3 className="font-display font-bold text-gray-950 text-base sm:text-lg tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2.5">
                  {step.desc}
                </p>
              </div>

              {/* Bottom security micro badge */}
              <div className="mt-6 pt-3.5 border-t border-gray-100 flex items-center space-x-1.5 text-[10px] text-gray-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{step.detail}</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
