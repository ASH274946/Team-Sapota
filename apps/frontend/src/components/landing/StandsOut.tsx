import React from "react";
import { Compass, GitMerge, Hourglass, Sliders, LayoutDashboard, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function StandsOut() {
  const standouts = [
    {
      title: "Aligned with NEP & NCF",
      desc: "Supports competency-based, skill-focused evaluation aligned with NEP 2020, ensuring high-term academic relevance without changing curriculum structure.",
      icon: <Compass className="w-5 h-5 text-[#e05934]" />,
    },
    {
      title: "Seamless Integration",
      desc: "Easily blends into your current assessment methods, question papers, and grading workflows, requiring no retraining or operational overhaul.",
      icon: <GitMerge className="w-5 h-5 text-[#e05934]" />,
    },
    {
      title: "Significant Time Savings",
      desc: "Reduces evaluation workload dramatically, freeing up teachers' time for mentoring, lesson improvement, and student engagement.",
      icon: <Hourglass className="w-5 h-5 text-[#e05934]" />,
    },
    {
      title: "Supports Personalized Learning",
      desc: "Identifies individual strengths and learning gaps, enabling targeted academic support for every student based on structured rubrics.",
      icon: <Sliders className="w-5 h-5 text-[#e05934]" />,
    },
    {
      title: "Dashboards for Data-Decisions",
      desc: "Gives school leadership clear, structured performance insights to support academic planning and quality improvement plans.",
      icon: <LayoutDashboard className="w-5 h-5 text-[#e05934]" />,
    },
    {
      title: "Transparent Progress Tracking",
      desc: "Provides parents with clear, analytics-driven visibility into their child's academic progress, building trust and confidence in school outcomes.",
      icon: <Send className="w-5 h-5 text-[#e05934]" />,
    },
  ];

  return (
    <section className="py-24 bg-[#fcfbf9] border-b border-[#f3ede4]" id="solutions">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header content */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[#e05934] uppercase bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full inline-block mb-3">
            Key Differentiation
          </span>
          <h2 className="font-display font-medium text-2xl sm:text-3xl md:text-4xl text-gray-900 tracking-tight">
            Why VidyaAI Stands Out
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-lg mx-auto">
            A clear, intuitive dashboard reveals performance trends, learning gaps, and data-driven recommendations for every class.
          </p>
        </div>

        {/* 3x2 Grid layouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {standouts.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="bg-white border border-[#f3ede4] rounded-2xl p-6 shadow-xs hover:border-[#e05934]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 card-hover-effect cursor-pointer"
            >
              {/* Icon Container */}
              <div className="p-3 bg-orange-50 border border-orange-100/50 rounded-xl inline-block mb-5">
                {item.icon}
              </div>

              {/* Text content */}
              <h3 className="font-display font-bold text-base sm:text-lg text-gray-900 leading-tight">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mt-2.5">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
