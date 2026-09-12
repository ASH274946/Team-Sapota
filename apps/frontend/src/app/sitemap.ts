import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.domain;
  const currentDate = new Date().toISOString().split('T')[0];

  const publicRoutes = [
    '',
    '/ai-exam-paper-generator',
    '/ai-question-paper-generator',
    '/ai-question-generator',
    '/ai-question-bank-generator',
    '/ai-assessment-generator',
    '/question-paper-generator-from-pdf',
    '/bloom-taxonomy-question-generator',
    '/solutions/colleges',
    '/solutions/universities',
    '/solutions/teachers',
    '/solutions/engineering-colleges',
    '/privacy',
    '/terms',
    '/cookie-policy',
    '/acceptable-use',
    '/contact',
    '/careers',
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route.startsWith('/ai-') || route.startsWith('/question-') ? 0.9 : 0.7,
  }));
}
