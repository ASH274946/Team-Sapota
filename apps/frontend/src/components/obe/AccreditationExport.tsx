'use client';

import React from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '@/design-system/Button';
import toast from 'react-hot-toast';

export interface ExportMatrixData {
  courseCode: string;
  courseName: string;
  cos: Array<{ id: string; code: string; description: string; bloomLevel: string }>;
  pos: Array<{ id: string; code: string; description: string }>;
  matrix: Array<{ coId: string; mappings: Array<{ poId: string; weightage: number }> }>;
}

interface AccreditationExportProps {
  data: ExportMatrixData;
}

export function AccreditationExport({ data }: AccreditationExportProps) {
  const exportToCSV = () => {
    if (!data.cos.length || !data.pos.length) {
      toast.error('No matrix data available to export.');
      return;
    }

    try {
      // Build CSV Header
      const poCodes = data.pos.map((p) => p.code);
      let csvContent = `Course Code,Course Name,${data.courseCode},${data.courseName}\n\n`;
      csvContent += `CO Code,Course Outcome Description,Bloom Level,${poCodes.join(',')}\n`;

      // Build Rows
      data.cos.forEach((co) => {
        const coMatrixRow = data.matrix.find((m) => m.coId === co.id);
        const weightages = data.pos.map((po) => {
          const mapping = coMatrixRow?.mappings.find((m) => m.poId === po.id);
          return mapping ? mapping.weightage : 0;
        });

        const safeDesc = `"${co.description.replace(/"/g, '""')}"`;
        csvContent += `${co.code},${safeDesc},${co.bloomLevel},${weightages.join(',')}\n`;
      });

      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Accreditation_CO_PO_Matrix_${data.courseCode}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Accreditation CSV report downloaded successfully!');
    } catch {
      toast.error('Failed to generate CSV export.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToCSV}
        className="flex items-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        Export CSV (NBA/NAAC)
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="flex items-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
      >
        <Printer className="w-4 h-4 text-indigo-600" />
        Print Matrix
      </Button>
    </div>
  );
}
