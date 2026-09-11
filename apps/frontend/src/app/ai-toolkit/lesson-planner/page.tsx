'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LessonPlannerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teacher/copilot');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: '#6B7280', fontSize: '15px' }}>Loading Lesson Planner...</p>
    </div>
  );
}
