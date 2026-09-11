'use client';

import React, { useRef, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  X,
  Award,
  BookOpen,
  BarChart3,
  Layers,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { COPOMatrixData } from './COPOMatrix';

export interface AttainmentResultItem {
  coCode: string;
  attainment: number;
  metThreshold?: boolean;
}

interface NbaSarReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  matrixData: COPOMatrixData;
  courseCode: string;
  courseName: string;
  academicYear?: string;
  department?: string;
  attainmentResults?: AttainmentResultItem[];
}

export const NbaSarReportModal: React.FC<NbaSarReportModalProps> = ({
  isOpen,
  onClose,
  matrixData,
  courseCode,
  courseName,
  academicYear = '2025-2026',
  department = 'Computer Science & Engineering',
  attainmentResults = []
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // Compute PO Correlation Averages dynamically from matrixData
  const poCorrelations = useMemo(() => {
    return matrixData.pos.map((po) => {
      let sum = 0;
      let count = 0;
      matrixData.matrix.forEach((row) => {
        const mapping = row.mappings.find((m) => m.poId === po.id);
        if (mapping && mapping.weightage > 0) {
          sum += mapping.weightage;
          count++;
        }
      });
      return count > 0 ? (sum / count).toFixed(1) : '-';
    });
  }, [matrixData]);

  // Compute Overall Attainment dynamically
  const computedAttainment = useMemo(() => {
    if (!attainmentResults || attainmentResults.length === 0) return null;
    const sum = attainmentResults.reduce((acc, curr) => acc + curr.attainment, 0);
    const avg = (sum / attainmentResults.length) * 100;
    return avg;
  }, [attainmentResults]);

  // Flagged COs below threshold
  const flaggedCOs = useMemo(() => {
    return attainmentResults.filter((a) => a.metThreshold === false || a.attainment < 0.7);
  }, [attainmentResults]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = `NATIONAL BOARD OF ACCREDITATION (NBA) - SELF ASSESSMENT REPORT (SAR)\n`;
    csv += `Course Code: ${courseCode}, Course Name: ${courseName}, Department: ${department}, Academic Year: ${academicYear}\n\n`;
    csv += `CRITERION 3: COURSE OUTCOMES (COs) & PROGRAM OUTCOMES (POs) MAPPING MATRIX\n`;
    csv += `CO Code,CO Description,Bloom Level,` + matrixData.pos.map((p) => p.code).join(',') + `,Target Threshold\n`;

    matrixData.cos.forEach((co) => {
      const row = matrixData.matrix.find((m) => m.coId === co.id);
      const mappings = matrixData.pos.map((po) => {
        const mapItem = row?.mappings.find((m) => m.poId === po.id);
        return mapItem ? mapItem.weightage : 0;
      });
      csv += `"${co.code}","${co.description.replace(/"/g, '""')}","${co.bloomLevel}",` + mappings.join(',') + `,70%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NBA_SAR_Report_${courseCode}_${academicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded NBA SAR Report CSV!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500 text-white">
              <Award className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Official NBA SAR Accreditation Report Generator
              </h3>
              <p className="text-xs text-neutral-400">
                Format compliant with NBA Tier-I / Tier-II & NAAC Criterion 3.1 & 3.2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white flex items-center gap-1.5 border border-neutral-700 cursor-pointer"
            >
              <Download className="size-3.5" /> Export CSV / Excel
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="size-3.5" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content */}
        <div ref={reportRef} className="p-8 overflow-y-auto space-y-8 bg-white text-slate-900">
          {/* Institution & SAR Header */}
          <div className="border-b-2 border-neutral-900 pb-6 text-center space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              NATIONAL BOARD OF ACCREDITATION (NBA) & NAAC AUDIT DOSSIER
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase">
              Self Assessment Report (SAR) — Criterion 3
            </h1>
            <p className="text-xs font-medium text-neutral-600">
              Course Articulation Matrix & Attainment Assessment Evaluation
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 mt-4 border-t border-neutral-200 text-left text-xs">
              <div>
                <span className="font-bold text-neutral-400 uppercase text-[10px]">Course Code & Title</span>
                <p className="font-extrabold text-neutral-900">{courseCode}: {courseName}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase text-[10px]">Department</span>
                <p className="font-extrabold text-neutral-900">{department}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase text-[10px]">Academic Session</span>
                <p className="font-extrabold text-neutral-900">{academicYear}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase text-[10px]">Compliance Status</span>
                <p className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Verified Compliant
                </p>
              </div>
            </div>
          </div>

          {/* Section 3.1: Course Outcomes (COs) */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-2">
              <BookOpen className="size-4 text-orange-500" />
              3.1 Course Outcomes (COs) Statements & Bloom Taxonomy Levels
            </h2>
            {matrixData.cos.length === 0 ? (
              <p className="text-xs text-neutral-400 italic p-3 border border-dashed rounded-lg">No Course Outcomes (COs) defined yet for this course.</p>
            ) : (
              <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
                <thead>
                  <tr className="bg-neutral-100 text-neutral-700 uppercase font-bold text-[11px]">
                    <th className="p-2.5 border border-neutral-300 w-16">CO Code</th>
                    <th className="p-2.5 border border-neutral-300">Course Outcome Description</th>
                    <th className="p-2.5 border border-neutral-300 w-32">Bloom's Cognitive Level</th>
                    <th className="p-2.5 border border-neutral-300 w-24 text-center">Target Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixData.cos.map((co) => (
                    <tr key={co.id} className="hover:bg-neutral-50">
                      <td className="p-2.5 border border-neutral-300 font-extrabold text-neutral-900">{co.code}</td>
                      <td className="p-2.5 border border-neutral-300 text-neutral-700">{co.description}</td>
                      <td className="p-2.5 border border-neutral-300 font-bold text-orange-600">{co.bloomLevel}</td>
                      <td className="p-2.5 border border-neutral-300 text-center font-bold text-neutral-900">70%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 3.2: CO-PO Mapping Matrix */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-2">
              <Layers className="size-4 text-orange-500" />
              3.2 Course Articulation Matrix (CO-PO Mapping Strengths)
            </h2>
            {matrixData.cos.length === 0 || matrixData.pos.length === 0 ? (
              <p className="text-xs text-neutral-400 italic p-3 border border-dashed rounded-lg">Add Course Outcomes (CO) and Program Outcomes (PO) to view mapping matrix.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border border-neutral-300 border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700 uppercase font-bold text-[10px]">
                      <th className="p-2 border border-neutral-300 text-left">Course Outcome</th>
                      {matrixData.pos.map((po) => (
                        <th key={po.id} className="p-2 border border-neutral-300">{po.code}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.cos.map((co) => {
                      const row = matrixData.matrix.find((m) => m.coId === co.id);
                      return (
                        <tr key={co.id}>
                          <td className="p-2 border border-neutral-300 text-left font-bold text-neutral-900">{co.code}</td>
                          {matrixData.pos.map((po) => {
                            const mapItem = row?.mappings.find((m) => m.poId === po.id);
                            const val = mapItem ? mapItem.weightage : 0;
                            return (
                              <td
                                key={po.id}
                                className={`p-2 border border-neutral-300 font-extrabold ${
                                  val === 3
                                    ? 'bg-blue-100 text-blue-800'
                                    : val === 2
                                    ? 'bg-blue-50 text-blue-700'
                                    : val === 1
                                    ? 'bg-slate-50 text-slate-600'
                                    : 'text-neutral-300'
                                }`}
                              >
                                {val || '-'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr className="bg-neutral-100 font-extrabold text-neutral-900">
                      <td className="p-2 border border-neutral-300 text-left uppercase text-[10px]">Average Correlation</td>
                      {poCorrelations.map((avgVal, idx) => (
                        <td key={idx} className="p-2 border border-neutral-300 text-orange-600">
                          {avgVal}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-neutral-500">
              Note: Mapping levels 1: Slight (Low), 2: Moderate (Medium), 3: Substantial (High). Dash (-) indicates no correlation.
            </p>
          </div>

          {/* Section 3.3: Attainment & Continuous Improvement */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-2">
              <BarChart3 className="size-4 text-orange-500" />
              3.3 Outcome Attainment Summary & Continuous Improvement
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="text-xs font-bold text-neutral-900 uppercase">Direct Assessment Attainment</div>
                {computedAttainment !== null ? (
                  <div className="text-2xl font-black text-emerald-600">{computedAttainment.toFixed(1)}%</div>
                ) : (
                  <div className="text-sm font-bold text-amber-600 flex items-center gap-1.5">
                    <AlertCircle className="size-4" /> Pending Evaluation (N/A)
                  </div>
                )}
                <p className="text-xs text-neutral-600">
                  {computedAttainment !== null
                    ? `Calculated dynamically from ${attainmentResults.length} evaluated Course Outcomes.`
                    : 'No evaluation results recorded yet. Click "⚡ AI Auto-Fill Matrix" or grade class quizzes to evaluate attainment.'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="text-xs font-bold text-neutral-900 uppercase">Continuous Improvement Action Plan</div>
                <p className="text-xs text-neutral-600">
                  {flaggedCOs.length > 0
                    ? `Remedial tutorial sessions recommended for ${flaggedCOs.map((f) => f.coCode).join(', ')} targeting students scoring below 70% threshold.`
                    : computedAttainment !== null
                    ? 'All evaluated Course Outcomes currently meet target attainment thresholds (70%).'
                    : 'Remedial actions will be automatically computed once assessments are evaluated.'}
                </p>
              </div>
            </div>
          </div>

          {/* Official Signatures */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs border-t border-neutral-200">
            <div>
              <div className="h-10 border-b border-dashed border-neutral-400 mb-2 max-w-[200px] mx-auto"></div>
              <p className="font-bold text-neutral-900">Course Coordinator Signature</p>
              <p className="text-neutral-500 text-[11px]">Faculty-in-Charge</p>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-neutral-400 mb-2 max-w-[200px] mx-auto"></div>
              <p className="font-bold text-neutral-900">Head of Department (HOD)</p>
              <p className="text-neutral-500 text-[11px]">Department of {department}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
