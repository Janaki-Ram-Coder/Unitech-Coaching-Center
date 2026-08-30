export interface RouteSEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  noIndex?: boolean;
}

export const SITE_NAME = 'Oritech Computer';
export const SITE_TAGLINE = 'Best Computer Institute & Training Center in Rayagada';
export const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&h=630&q=80';

export const ROUTE_SEO_MAP: Record<string, RouteSEOConfig> = {
  '/': {
    title: `Best Computer Institute in Rayagada | ${SITE_NAME} - Computer Training Center`,
    description: 'Looking for the best computer institute in Rayagada? Oritech Computer is the #1 rated computer center in Rayagada offering DCA, PGDCA, Tally Prime with GST, Python, Web Development, and basic to advanced computer classes near you since 2007.',
    keywords: 'best institute in Rayagada, computer center in Rayagada, computer institute in Rayagada, rayagada computer class, computer class near me, computer institute near me, best computer training center Rayagada, DCA course Rayagada, PGDCA institute Rayagada, Tally Prime GST classes Rayagada, Python institute Rayagada, Oritech Computer Rayagada, IT training center Odisha, computer coaching Convent Road Rayagada',
    ogType: 'website',
  },
  '/about': {
    title: `About Us - #1 Computer Institute in Rayagada Since 2007 | ${SITE_NAME}`,
    description: 'Discover Oritech Computer: Rayagada’s premier ISO 9001:2015 certified computer training center since 2007. Offering certified IT faculty, high-tech practical lab infrastructure, and government-recognized diplomas in Rayagada, Odisha.',
    keywords: 'About Oritech Computer, best institute in Rayagada, computer center in Rayagada, computer institute history Rayagada, ISO 9001 certified computer institute, IT faculty Rayagada, computer lab facility',
    ogType: 'website',
  },
  '/courses': {
    title: `Computer Courses in Rayagada - DCA, PGDCA, Tally Prime, Python | ${SITE_NAME}`,
    description: 'Browse all computer courses in Rayagada at Oritech Computer. Enroll in DCA, PGDCA, Python Full Stack, Web Development, Tally Prime with GST, Java, AutoCAD, and Graphic Design with 100% practical lab training and certification.',
    keywords: 'computer courses in Rayagada, DCA course in Rayagada, PGDCA admission Rayagada, Tally Prime course Rayagada, Python coding class Rayagada, computer class near me, rayagada computer class, best institute in Rayagada, Oritech Computer courses',
    ogType: 'website',
  },
  '/course-detail': {
    title: `Course Syllabus & Admission Details | ${SITE_NAME} Rayagada`,
    description: 'Explore detailed course curriculum, fees, batch timings, practical lab projects, and recognized certificates at Oritech Computer Institute Rayagada.',
    keywords: 'course syllabus Rayagada, computer class fees Rayagada, batch timings, admission, certificate, Oritech Computer Rayagada',
    ogType: 'article',
  },
  '/contact': {
    title: `Contact Oritech Computer Rayagada | Computer Center Near Convent Road`,
    description: 'Visit Oritech Computer Training Institute in Rayagada, Odisha at Sharma Complex, Beside Hotel Jyoti Mahal, Convent Road. Call +91 9437235124 or email us for admissions, batch timings & free demo class.',
    keywords: 'contact Oritech Computer, computer center in Rayagada address, computer institute in Rayagada phone number, Convent Road computer class, computer class near me, Rayagada computer center contact',
    ogType: 'website',
  },
  '/results': {
    title: `Certificate Verification & Student Results | ${SITE_NAME} Rayagada`,
    description: 'Verify official computer diploma certificates, marksheets, and academic credentials issued by Oritech Computer Training Institute Rayagada. Instant 24/7 online certificate verification.',
    keywords: 'certificate verification Rayagada, verify computer diploma, student marksheet Rayagada, roll number search, Oritech Computer results, ISO 9001 certificate check',
    ogType: 'website',
  },
  '/student/dashboard': {
    title: `Student Portal & Learning Dashboard | ${SITE_NAME}`,
    description: 'Access student profile, enrolled courses, syllabus progress, lecture video player, and completion certificates on the Oritech Computer portal.',
    keywords: 'student login, dashboard, student portal, course progress, Oritech Computer student',
    ogType: 'profile',
    noIndex: true,
  },
  '/student/course-learn': {
    title: `Course Learning Room & Video Lectures | ${SITE_NAME}`,
    description: 'Interactive lecture player, chapter notes, and learning track for Oritech Computer students.',
    keywords: 'online video lectures, study room, course video, Oritech Computer',
    noIndex: true,
  },
  '/course-learn': {
    title: `Course Learning Room & Video Lectures | ${SITE_NAME}`,
    description: 'Interactive lecture player, chapter notes, and learning track for Oritech Computer students.',
    keywords: 'online video lectures, study room, course video, Oritech Computer',
    noIndex: true,
  },
  '/admin/dashboard': {
    title: `Admin Management Portal | ${SITE_NAME}`,
    description: 'Administrative control center for managing courses, student registrations, certificate verifications, enquiries, and institute branding.',
    keywords: 'admin portal, Oritech Computer admin',
    noIndex: true,
  },
  '/login': {
    title: `Student & Admin Login | ${SITE_NAME} Rayagada`,
    description: 'Sign in to your Oritech Computer student dashboard or staff management console in Rayagada.',
    keywords: 'student login Rayagada, admin login, Oritech Computer sign in',
    ogType: 'website',
  },
  '/register': {
    title: `Student Account Registration | ${SITE_NAME} Rayagada`,
    description: 'Create a new student account to access course materials, progress tracking, and batch updates at Oritech Computer Rayagada.',
    keywords: 'student registration, sign up, Oritech Computer Rayagada, computer class admission',
    ogType: 'website',
  },
  '/verify-otp': {
    title: `Verify Email OTP | ${SITE_NAME}`,
    description: 'Enter your 6-digit email verification code to activate your Oritech Computer account.',
    keywords: 'email verification, verify OTP, Oritech Computer',
    noIndex: true,
  },
};

export function getSEOForPath(pathname: string): RouteSEOConfig {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  
  if (ROUTE_SEO_MAP[normalizedPath]) {
    return ROUTE_SEO_MAP[normalizedPath];
  }

  // Prefix checks for dynamic routes like /courses/:id or /student/*
  if (normalizedPath.startsWith('/courses/')) {
    return {
      title: `Course Syllabus & Admission | ${SITE_NAME} Rayagada`,
      description: 'Explore comprehensive course curriculum, practical training modules, and certificate details at Oritech Computer Institute in Rayagada.',
      keywords: 'best institute in Rayagada, computer center in Rayagada, computer institute in Rayagada, rayagada computer class, computer class near me',
      ogType: 'article',
    };
  }

  if (normalizedPath.startsWith('/student/')) {
    return {
      title: `Student Portal | ${SITE_NAME}`,
      description: 'Student learning dashboard and course materials at Oritech Computer.',
      noIndex: true,
    };
  }

  return {
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: 'Join Oritech Computer, the best computer institute in Rayagada offering DCA, PGDCA, Tally Prime with GST, Python, and ISO 9001:2015 recognized certifications since 2007.',
    keywords: 'best institute in Rayagada, computer center in Rayagada, computer institute in Rayagada, rayagada computer class, computer class near me',
    ogType: 'website',
  };
}

