export interface RouteSEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  noIndex?: boolean;
}

export const SITE_NAME = 'Oritech Computer';
export const SITE_TAGLINE = 'Premier Computer Training & Certification Institute';
export const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&h=630&q=80';

export const ROUTE_SEO_MAP: Record<string, RouteSEOConfig> = {
  '/': {
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: 'Join Oritech Computer for industry-leading computer courses including Python Full Stack, Web Development, DCA, PGDCA, Tally Prime with GST, and AI. ISO 9001:2015 Certified with 100% practical lab training.',
    keywords: 'Oritech Computer, computer training institute, DCA course, PGDCA, Python training, web development institute, Tally Prime GST, computer classes near me, IT certification courses',
    ogType: 'website',
  },
  '/about': {
    title: `About Us - ISO 9001:2015 Certified Institute | ${SITE_NAME}`,
    description: 'Discover Oritech Computer: our mission, certified faculty, high-tech lab infrastructure, and government-recognized certifications empowering IT careers since 2011.',
    keywords: 'About Oritech Computer, computer institute history, ISO 9001 certified computer institute, IT faculty, computer lab facility',
    ogType: 'website',
  },
  '/courses': {
    title: `Computer Courses & Certifications - DCA, PGDCA, Python, Tally | ${SITE_NAME}`,
    description: 'Explore comprehensive computer courses at Oritech Computer: DCA, PGDCA, Python Full Stack, Web Development, Tally Prime with GST, and AI. Learn with hands-on projects and industry certifications.',
    keywords: 'computer courses catalog, DCA syllabus, PGDCA admission, Python programming course, Tally Prime course, Web design classes, Oritech Computer courses',
    ogType: 'website',
  },
  '/course-detail': {
    title: `Course Syllabus & Admission Details | ${SITE_NAME}`,
    description: 'Explore detailed course curriculum, duration, batch timings, hands-on lab modules, and recognized certifications at Oritech Computer.',
    keywords: 'course syllabus, curriculum, batch timings, admission, certificate, Oritech Computer',
    ogType: 'article',
  },
  '/contact': {
    title: `Contact Us & Campus Location | ${SITE_NAME}`,
    description: 'Get in touch with Oritech Computer. Visit our campus, contact our admissions counselors, call +91 9437235124, or send an online enquiry for batch timings.',
    keywords: 'contact Oritech Computer, institute address, phone number, admissions enquiry, computer center location',
    ogType: 'website',
  },
  '/results': {
    title: `Certificate Verification & Student Results | ${SITE_NAME}`,
    description: 'Verify official student certificates, completion diplomas, and academic transcripts issued by Oritech Computer. Instant online credential verification.',
    keywords: 'certificate verification, verify diploma, student marksheet, roll number search, Oritech Computer results',
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
    title: `Student & Admin Login | ${SITE_NAME}`,
    description: 'Sign in to your Oritech Computer student dashboard or staff management console.',
    keywords: 'student login, admin login, Oritech Computer sign in',
    ogType: 'website',
  },
  '/register': {
    title: `Student Account Registration | ${SITE_NAME}`,
    description: 'Create a new student account to access course materials, progress tracking, and batch updates at Oritech Computer.',
    keywords: 'student registration, sign up, Oritech Computer',
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
      title: `Course Syllabus & Admission | ${SITE_NAME}`,
      description: 'Explore comprehensive course curriculum, practical training modules, and certificate details at Oritech Computer.',
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
    description: 'Join Oritech Computer for industry-leading computer courses and ISO 9001:2015 recognized certifications.',
    ogType: 'website',
  };
}
