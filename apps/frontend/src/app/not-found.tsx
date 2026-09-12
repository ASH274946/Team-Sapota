import ErrorOne from '@/components/ui/ErrorOne';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | VidyaAI',
  description: 'The requested page could not be found.',
};

export default function NotFoundPage() {
  return <ErrorOne />;
}
