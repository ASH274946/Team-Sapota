import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/super-admin/',
          '/teacher/',
          '/student/',
          '/faculty/',
          '/dashboard/',
          '/settings/',
          '/profile/',
          '/assignments/',
          '/papers/',
          '/grader/',
          '/generate/',
          '/research/',
          '/ai-toolkit/',
          '/onboarding/',
          '/private/',
        ],
      },
    ],
    sitemap: `${SITE_CONFIG.domain}/sitemap.xml`,
    host: SITE_CONFIG.domain,
  };
}
