'use client';

import { useEffect } from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="empty-state">
      <div className="empty-illustration" aria-hidden="true" style={{ fontSize: 48 }}>
        &#9888;
      </div>
      <h2 className="empty-title">Something went wrong</h2>
      <p className="empty-desc">
        An unexpected error occurred. Please try again.
      </p>
      <div className="empty-state-actions">
        <button type="button" onClick={() => reset()} className="btn btn-dark btn-pill">
          <RefreshCw size={14} />
          Try again
        </button>
        <button type="button" onClick={() => window.history.back()} className="btn btn-secondary btn-pill">
          <ArrowLeft size={14} />
          Go back
        </button>
      </div>
    </div>
  );
}
