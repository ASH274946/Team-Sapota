import type { Metadata } from 'next';

export const SITE_CONFIG = {
  name: 'Vidya AI',
  domain: 'https://vidhyaai.tech',
  defaultTitle: 'Vidya AI — AI-Powered Exam Paper & Assessment Generator',
  defaultDescription:
    'Vidya AI is an enterprise-grade AI exam paper and assessment generation platform for educators, colleges, and universities. Generate balanced question papers, answer keys, and printable A4 PDFs from syllabus documents.',
  logoUrl: 'https://vidhyaai.tech/logo.png',
  logoIconUrl: 'https://vidhyaai.tech/logo-icon.png',
  ogImageDefault: 'https://vidhyaai.tech/logo-full.png',
  twitterHandle: '@VidyaAI',
};

interface MetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: string;
}

export function constructMetadata({
  title = SITE_CONFIG.defaultTitle,
  description = SITE_CONFIG.defaultDescription,
  path = '',
  keywords = [],
  noIndex = false,
  ogImage = SITE_CONFIG.ogImageDefault,
}: MetadataOptions = {}): Metadata {
  const url = `${SITE_CONFIG.domain}${path}`;
  const pageTitle = title.includes(SITE_CONFIG.name) ? title : `${title} | ${SITE_CONFIG.name}`;

  const defaultKeywords = [
    'AI exam paper generator',
    'AI question paper generator',
    'question paper generator',
    'automatic question paper generator',
    'AI question generator',
    'AI assessment generator',
    'AI question bank generator',
    'Bloom\'s Taxonomy question generator',
    'question paper generator from PDF',
    'question paper generator from syllabus',
    'college exam paper generator',
    'university exam paper generator',
    'printable A4 question paper PDF',
    'Vidya AI',
  ];

  const mergedKeywords = Array.from(new Set([...keywords, ...defaultKeywords]));

  return {
    title: pageTitle,
    description,
    keywords: mergedKeywords,
    metadataBase: new URL(SITE_CONFIG.domain),
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${SITE_CONFIG.name} — AI Assessment & Exam Generation Platform`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [ogImage],
      creator: SITE_CONFIG.twitterHandle,
    },
    icons: {
      icon: [
        { url: '/logo-icon.png', type: 'image/png' },
        { url: '/logo.png', type: 'image/png' },
      ],
      shortcut: '/logo-icon.png',
      apple: '/logo-icon.png',
    },
  };
}

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vidya AI',
    url: SITE_CONFIG.domain,
    logo: SITE_CONFIG.logoUrl,
    description:
      'Vidya AI is an enterprise AI assessment and question paper generation SaaS platform for educators, colleges, and academic institutions.',
    sameAs: [],
  };
}

export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vidya AI',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    url: SITE_CONFIG.domain,
    logo: SITE_CONFIG.logoUrl,
    description:
      'AI-powered asynchronous exam paper and assessment generation platform supporting Bloom\'s Taxonomy, curriculum document processing, answer key generation, and printable A4 PDF export.',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      'AI Exam Paper Generation',
      'AI Question Paper Generator from PDF',
      'Syllabus & Curriculum Document Processing',
      'Bloom\'s Taxonomy Cognitive Weightage Distribution',
      'Difficulty Level Customization (Easy, Medium, Hard)',
      'Automated Answer Key & Marking Schema Generation',
      'Printable A4 PDF Compilation',
      'Asynchronous Background Processing & Telemetry',
    ],
  };
}

export function getFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function getBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.domain}${item.path}`,
    })),
  };
}
