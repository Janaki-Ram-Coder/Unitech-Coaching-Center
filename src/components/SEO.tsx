import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  path?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  noIndex?: boolean;
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'Oritech Computer - Premier Computer Training & Certification Institute';
const DEFAULT_DESCRIPTION = 'Join Oritech Computer for industry-leading computer courses including Python Full Stack, Web Development, DCA, PGDCA, Tally Prime with GST, and AI. ISO 9001:2015 Certified with 100% placement assistance and government recognized certificates.';
const DEFAULT_KEYWORDS = 'Oritech Computer, computer training institute, DCA course, PGDCA, Python training, web development institute, Tally Prime GST, computer classes, certificate verification, IT courses';
const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&h=630&q=80';
const SITE_NAME = 'Oritech Computer';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  path = '',
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
  structuredData,
}) => {
  // Construct full title
  const formattedTitle = title
    ? title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    : DEFAULT_TITLE;

  // Resolve Canonical URL
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://oritech.edu';

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const effectiveCanonicalUrl = canonicalUrl || `${origin}${cleanPath === '/' ? '' : cleanPath}`;

  // Default Organization JSON-LD Schema
  const defaultOrgSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Oritech Computer',
    alternateName: 'Oritech Computer Training Institute',
    url: origin,
    logo: ogImage,
    description: DEFAULT_DESCRIPTION,
    sameAs: [],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Sharma Complex, Beside Hotel Jyoti Mahal, Convent road, New Colony',
      addressLocality: 'Rayagada',
      addressRegion: 'Odisha',
      postalCode: '765001',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91 9437235124',
      contactType: 'Admissions & Student Support',
      availableLanguage: ['English', 'Hindi', 'Odia'],
    },
  };

  const finalSchema = structuredData
    ? Array.isArray(structuredData)
      ? [defaultOrgSchema, ...structuredData]
      : [defaultOrgSchema, structuredData]
    : defaultOrgSchema;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="title" content={formattedTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="Oritech Computer" />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />

      {/* Canonical URL */}
      <link rel="canonical" href={effectiveCanonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={effectiveCanonicalUrl} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={effectiveCanonicalUrl} />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(finalSchema)}
      </script>
    </Helmet>
  );
};
