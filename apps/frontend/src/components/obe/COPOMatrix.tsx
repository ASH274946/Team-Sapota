'use client';

import React, { useState, useEffect } from 'react';
import { BloomClassificationBadge, BloomLevel } from './BloomClassificationBadge';
import { BloomOverrideSelect } from './BloomOverrideSelect';
import { AccreditationExport } from './AccreditationExport';
import { Button } from '@/design-system/Button';
import { Loader2, Save, RefreshCw, AlertCircle, Sparkles, Printer, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

export interface CourseOutcomeItem {
  id: string;
  code: string;
  description: string;
  bloomLevel: BloomLevel;
}

export interface ProgramOutcomeItem {
  id: string;
  code: string;
  description: string;
}

export interface BloomClassificationItem {
  coId: string;
  coCode: string;
  predictedLevel: BloomLevel;
  effectiveLevel: BloomLevel;
  confidence: number;
  cues: {
    verbs: string[];
    operations: string[];
    responseType: string;
  };
  explanation: string;
}

export interface MatrixRowItem {
  coId: string;
  coCode: string;
  bloomLevel: BloomLevel;
  mappings: Array<{ poId: string; poCode: string; weightage: number }>;
}

export interface COPOMatrixData {
  course: { id: string; name: string; code: string; description?: string };
  cos: CourseOutcomeItem[];
  pos: ProgramOutcomeItem[];
  matrix: MatrixRowItem[];
  bloomClassifications: BloomClassificationItem[];
}

interface COPOMatrixProps {
  data: COPOMatrixData;
  onSaveMatrix: (payload: {
    mappings: Array<{ coId: string; poId: string; weightage: number }>;
    bloomOverrides: Array<{ coId: string; bloomLevel: BloomLevel }>;
  }) => Promise<void>;
  onRefresh?: () => void;
}

const WEIGHTAGE_CONFIG: Record<number, { bg: string; text: string; num: string; label: string }> = {
  0: { bg: 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200', text: 'text-neutral-400', num: '-', label: '0 = Unmapped' },
  1: { bg: 'bg-sky-100 hover:bg-sky-200 border-sky-300', text: 'text-sky-800 font-extrabold', num: '1', label: '1 = Slight (Low)' },
  2: { bg: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300', text: 'text-indigo-800 font-extrabold', num: '2', label: '2 = Moderate (Medium)' },
  3: { bg: 'bg-blue-600 hover:bg-blue-700 border-blue-700 shadow-xs', text: 'text-white font-black', num: '3', label: '3 = Substantial (High)' },
};

export function COPOMatrix({ data, onSaveMatrix, onRefresh }: COPOMatrixProps) {
  const [localMatrix, setLocalMatrix] = useState<MatrixRowItem[]>(data.matrix || []);
  const [localCos, setLocalCos] = useState<CourseOutcomeItem[]>(data.cos || []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalMatrix(data.matrix || []);
    setLocalCos(data.cos || []);
    setHasChanges(false);
  }, [data]);

  const handleWeightageCycle = (coId: string, poId: string) => {
    setLocalMatrix((prevMatrix) => {
      return prevMatrix.map((row) => {
        if (row.coId !== coId) return row;
        const updatedMappings = row.mappings.map((m) => {
          if (m.poId !== poId) return m;
          const nextWeight = (m.weightage + 1) % 4;
          return { ...m, weightage: nextWeight };
        });
        return { ...row, mappings: updatedMappings };
      });
    });
    setHasChanges(true);
  };

  const handleBloomOverrideChange = (coId: string, newLevel: BloomLevel) => {
    setLocalCos((prevCos) =>
      prevCos.map((co) => (co.id === coId ? { ...co, bloomLevel: newLevel } : co))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (isSaving) return;

    const mappingsPayload = localMatrix.flatMap((row) =>
      row.mappings.map((m) => ({ coId: row.coId, poId: m.poId, weightage: m.weightage }))
    );

    const bloomOverridesPayload = localCos.map((co) => ({
      coId: co.id,
      bloomLevel: co.bloomLevel,
    }));

    try {
      setIsSaving(true);
      await onSaveMatrix({ mappings: mappingsPayload, bloomOverrides: bloomOverridesPayload });
      toast.success('CO/PO Matrix & Bloom classifications saved!');
      setHasChanges(false);
    } catch {
      toast.error('Failed to save matrix updates.');
      setLocalMatrix(data.matrix || []);
      setLocalCos(data.cos || []);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!data.cos.length || !data.pos.length) {
    return (
      <div className="p-12 text-center bg-white border border-neutral-200 rounded-2xl space-y-3 shadow-xs">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-neutral-800">Incomplete Matrix Data</h3>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Please add Course Outcomes (CO) and Program Outcomes (PO) to start mapping.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Bar inside matrix card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
            <Sparkles className="size-4 text-orange-500" />
            Interactive CO-PO Mapping & Bloom Classifier Matrix
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Click cells to cycle weightage (0 = Unmapped, 1 = Slight, 2 = Moderate, 3 = Substantial). Use dropdowns for Bloom level overrides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <AccreditationExport
            data={{
              courseCode: data.course.code,
              courseName: data.course.name,
              cos: localCos,
              pos: data.pos,
              matrix: localMatrix,
            }}
          />

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Printer className="size-3.5 text-neutral-500" /> Print Matrix
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              hasChanges
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md active:scale-95'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <><Loader2 className="size-3.5 animate-spin" /> Saving...</>
            ) : (
              <><Save className="size-3.5" /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* Responsive Matrix Grid */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200/90 text-neutral-700 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="p-4 min-w-[360px] max-w-[440px] border-r border-neutral-200">
                  Course Outcome (CO) & Description
                </th>
                <th className="p-4 min-w-[185px] border-r border-neutral-200">
                  AI Bloom Classification & Override
                </th>
                {data.pos.map((po) => (
                  <th
                    key={po.id}
                    className="p-3.5 text-center min-w-[145px] max-w-[170px] border-r border-neutral-200 bg-neutral-50/90"
                  >
                    <div className="font-black text-indigo-700 text-xs">{po.code}</div>
                    <div className="text-[10px] text-neutral-600 font-semibold mt-0.5 leading-tight" title={po.description}>
                      {po.description}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/80 bg-white">
              {localCos.map((co) => {
                const matrixRow = localMatrix.find((m) => m.coId === co.id);
                const bloomInfo = data.bloomClassifications.find((b) => b.coId === co.id);
                const predictedLevel = bloomInfo?.predictedLevel;
                const isOverridden = predictedLevel && co.bloomLevel !== predictedLevel;

                return (
                  <tr key={co.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* CO Code & Description */}
                    <td className="p-3.5 border-r border-neutral-200">
                      <div className="font-extrabold text-neutral-900 text-xs flex items-center justify-between">
                        <span>{co.code}</span>
                      </div>
                      <p className="text-xs text-neutral-600 font-medium mt-1 leading-relaxed">
                        {co.description}
                      </p>
                    </td>

                    {/* Bloom Level Badge & Override Select */}
                    <td className="p-3.5 border-r border-neutral-200 space-y-2.5">
                      <div>
                        <BloomClassificationBadge
                          level={co.bloomLevel}
                          confidence={bloomInfo?.confidence}
                          isOverride={isOverridden}
                          explanation={bloomInfo?.explanation}
                          size="sm"
                        />
                      </div>
                      <BloomOverrideSelect
                        currentLevel={co.bloomLevel}
                        predictedLevel={predictedLevel}
                        onChange={(newLvl) => handleBloomOverrideChange(co.id, newLvl)}
                      />
                    </td>

                    {/* Weightage Cell Controls - Numeric Clean Badges */}
                    {data.pos.map((po) => {
                      const mapping = matrixRow?.mappings.find((m) => m.poId === po.id);
                      const weightage = mapping ? mapping.weightage : 0;
                      const cfg = WEIGHTAGE_CONFIG[weightage] || WEIGHTAGE_CONFIG[0];

                      return (
                        <td key={po.id} className="p-3 border-r border-neutral-200 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleWeightageCycle(co.id, po.id)}
                            className={`size-10 rounded-xl border text-sm transition-all flex flex-col items-center justify-center mx-auto ${cfg.bg} ${cfg.text} active:scale-95 cursor-pointer`}
                            title={`${co.code} -> ${po.code}: ${cfg.label} (Click to cycle)`}
                          >
                            <span className="leading-none">{cfg.num}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matrix Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600 bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/90 font-medium">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-extrabold text-neutral-900 uppercase text-[11px]">Weightage Scale:</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-neutral-200 inline-block"></span> 0 = Unmapped</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-sky-200 inline-block"></span> 1 = Slight</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-indigo-200 inline-block"></span> 2 = Moderate</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-blue-600 inline-block"></span> 3 = Substantial</span>
        </div>
        <div className="font-semibold text-neutral-500">
          Total COs: <strong className="text-neutral-900">{localCos.length}</strong> | Total POs: <strong className="text-neutral-900">{data.pos.length}</strong>
        </div>
      </div>
    </div>
  );
}
