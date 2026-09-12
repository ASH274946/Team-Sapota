import { useState, useCallback, useEffect } from 'react';
import { copilotService } from '@/services/copilot.service';
import toast from 'react-hot-toast';

export interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration: string;
  objectives: string;
  activities: any;
  assessments: any;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

export function useLessonPlanner() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activePlan, setActivePlan] = useState<LessonPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await copilotService.getLessonPlans();
      setPlans(data);
    } catch (e) {
      toast.error('Failed to load lesson plans history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const generatePlan = async (
    subject: string,
    topic: string,
    duration: string,
    learningOutcomes: string,
  ) => {
    if (!subject || !topic || !duration) {
      toast.error('Subject, Topic, and Duration are required');
      return null;
    }

    try {
      setIsGenerating(true);
      const plan = await copilotService.generateLessonPlan({
        subject,
        topic,
        duration: parseInt(duration, 10),
        learningOutcomes: learningOutcomes ? learningOutcomes.split('\n').filter(Boolean) : [],
      });
      toast.success('Lesson plan generated successfully!');
      setActivePlan(plan);
      fetchPlans();
      return plan;
    } catch (e) {
      toast.error('Failed to generate lesson plan. AI provider might be unavailable.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePlan = async (id: string, updates: Partial<LessonPlan>) => {
    try {
      await copilotService.updateLessonPlan(id, updates);
      toast.success('Lesson plan updated successfully');

      setActivePlan((prev) => (prev ? { ...prev, ...updates } : null));
      setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    } catch (e) {
      toast.error('Failed to update lesson plan');
    }
  };

  const deletePlan = async (id: string) => {
    try {
      await copilotService.deleteLessonPlan(id);
      toast.success('Lesson plan deleted successfully');
      setPlans((prev) => prev.filter((p) => p.id !== id));
      if (activePlan?.id === id) setActivePlan(null);
    } catch (e) {
      toast.error('Failed to delete lesson plan');
    }
  };

  /**
   * Enqueues a BullMQ Puppeteer A4 PDF generation job for the given lesson plan
   * and polls every 2 seconds (60s timeout) until it completes or fails.
   * On success, triggers a browser download from the returned pdfUrl.
   */
  const exportPdf = async (lessonPlanId: string): Promise<void> => {
    if (isExportingPdf) return;

    const exportToast = toast.loading('Generating PDF…');
    setIsExportingPdf(true);

    try {
      // 1. Enqueue BullMQ job
      const { jobId } = await copilotService.requestLessonPlanPdf(lessonPlanId);

      // 2. Poll for result with timeout
      const startedAt = Date.now();
      let pdfUrl: string | null = null;

      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
              clearInterval(interval);
              reject(new Error('PDF generation timed out.'));
              return;
            }

            const result = await copilotService.pollLessonPlanPdfJob(jobId);

            if (result.status === 'completed' && result.pdfUrl) {
              pdfUrl = result.pdfUrl;
              clearInterval(interval);
              resolve();
            } else if (result.status === 'failed') {
              clearInterval(interval);
              reject(new Error(result.error || 'PDF generation failed.'));
            }
            // else: still queued/processing — keep polling
          } catch (err: any) {
            // If the job is simply not found yet (race condition), keep polling
            if (err?.response?.status === 404) return;
            clearInterval(interval);
            reject(err);
          }
        }, POLL_INTERVAL_MS);
      });

      // 3. Trigger download
      if (pdfUrl) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `lesson-plan-${lessonPlanId}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('PDF downloaded successfully!', { id: exportToast });
    } catch (err: any) {
      const msg =
        err?.message === 'PDF generation timed out.'
          ? 'PDF generation timed out. Please try again.'
          : 'PDF generation failed. Please try again.';
      toast.error(msg, { id: exportToast });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return {
    plans,
    loading,
    isGenerating,
    isExportingPdf,
    activePlan,
    setActivePlan,
    generatePlan,
    updatePlan,
    deletePlan,
    exportPdf,
    refresh: fetchPlans,
  };
}
