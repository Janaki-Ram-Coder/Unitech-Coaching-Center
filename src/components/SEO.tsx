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

const DEFAULT_TITLE = 'Oritech Computer - Best Computer Institute & Training Center in Rayagada';
const DEFAULT_DESCRIPTION = 'Oritech Computer is the #1 best computer institute & training center in Rayagada, Odisha since 2007. ISO 9001:2015 Certified offering DCA, PGDCA, Tally Prime with GST, Python, Web Development, Java, and 100% practical lab computer classes near you.';
const DEFAULT_KEYWORDS = 'best institute in Rayagada, computer center in Rayagada, computer institute in Rayagada, rayagada computer class, computer class near me, computer institute near me, best computer training center Rayagada, DCA course Rayagada, PGDCA institute Rayagada, Tally Prime GST classes Rayagada, Python institute Rayagada, Oritech Computer Rayagada, IT training center Odisha, computer coaching near Convent Road Rayagada, ISO certified computer diploma Rayagada';
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

  // Rich LocalBusiness + EducationalOrganization JSON-LD Schema for Google Rich Results
  const defaultOrgSchema = {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': `${origin}/#organization`,
    name: 'Oritech Computer Training Institute',
    alternateName: [
      'Oritech Computer Rayagada',
      'Best Computer Institute in Rayagada',
      'Oritech Computer Training Center',
    ],
    url: origin,
    logo: `${origin}/logo/Oritech%20Logo.png`,
    image: ogImage,
    description: DEFAULT_DESCRIPTION,
    foundingDate: '2007',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Credit Card, Bank Transfer',
    telephone: '+91 9437235124',
    email: 'oritech2007@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Sharma Complex, Beside Hotel Jyoti Mahal, Convent Road, New Colony',
      addressLocality: 'Rayagada',
      addressRegion: 'Odisha',
      postalCode: '765001',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 19.1678,
      longitude: 83.4150,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        opens: '07:00',
        closes: '20:00',
      },
    ],
    areaServed: [
      {
        '@type': 'City',
        name: 'Rayagada',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Rayagada District',
      },
      {
        '@type': 'State',
        name: 'Odisha',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Computer Courses & Certification Programs',
      itemListElement: [
        {
          '@type': 'Course',
          name: 'Diploma in Computer Application (DCA)',
          description: 'Fundamental to advanced computer training including MS Office, Internet, OS, and accounting basics in Rayagada.',
          provider: {
            '@type': 'Organization',
            name: 'Oritech Computer',
          },
        },
        {
          '@type': 'Course',
          name: 'Post Graduate Diploma in Computer Applications (PGDCA)',
          description: 'Comprehensive software development, database management, and programming course in Rayagada.',
          provider: {
            '@type': 'Organization',
            name: 'Oritech Computer',
          },
        },
        {
          '@type': 'Course',
          name: 'Tally Prime with GST & e-Filing',
          description: 'Hands-on practical accounting, inventory management, taxation, and GST billing in Rayagada.',
          provider: {
            '@type': 'Organization',
            name: 'Oritech Computer',
          },
        },
        {
          '@type': 'Course',
          name: 'Python Full Stack & AI Programming',
          description: 'Industry-standard Python coding, Django/Flask, data analysis, and machine learning practicals in Rayagada.',
          provider: {
            '@type': 'Organization',
            name: 'Oritech Computer',
          },
        },
      ],
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91 9437235124',
      contactType: 'Student Admissions & Course Inquiries',
      availableLanguage: ['English', 'Hindi', 'Odia', 'Telugu'],
      areaServed: 'IN',
    },
  };

  // BreadcrumbList JSON-LD Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: origin,
      },
      ...(cleanPath !== '/'
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: cleanPath.replace(/^\//, '').replace(/-/g, ' ').toUpperCase(),
              item: effectiveCanonicalUrl,
            },
          ]
        : []),
    ],
  };

  const finalSchema = structuredData
    ? Array.isArray(structuredData)
      ? [defaultOrgSchema, breadcrumbSchema, ...structuredData]
      : [defaultOrgSchema, breadcrumbSchema, structuredData]
    : [defaultOrgSchema, breadcrumbSchema];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="title" content={formattedTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="Oritech Computer Training Institute" />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />

      {/* Local SEO Geo Tags for Rayagada, Odisha */}
      <meta name="geo.region" content="IN-OR" />
      <meta name="geo.placename" content="Rayagada, Odisha, India" />
      <meta name="geo.position" content="19.1678;83.4150" />
      <meta name="ICBM" content="19.1678, 83.4150" />

      {/* Canonical URL */}
      <link rel="canonical" href={effectiveCanonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={effectiveCanonicalUrl} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

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

