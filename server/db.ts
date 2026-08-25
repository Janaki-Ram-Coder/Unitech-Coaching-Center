import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Course,
  Student,
  PaymentInstallment,
  SliderImage,
  LearningResource,
  NotificationAnnouncement,
  StudentResult,
  ContactEnquiry,
  PendingRegistration,
  CourseReview,
  InstituteReview,
  CertificateRecord,
  InstituteBranding,
} from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  courses: Course[];
  students: Student[];
  payments: PaymentInstallment[];
  sliderImages: SliderImage[];
  resources: LearningResource[];
  notifications: NotificationAnnouncement[];
  results: StudentResult[];
  enquiries: ContactEnquiry[];
  pendingRegistrations: PendingRegistration[];
  courseReviews: CourseReview[];
  instituteReviews: InstituteReview[];
  certificates: CertificateRecord[];
  branding?: InstituteBranding;
}

function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getInitialData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const studentPasswordHash = bcrypt.hashSync('student123', 10);

  const courses: Course[] = [
    {
      id: 'course-1',
      code: 'PFS-601',
      title: 'Python Full Stack & AI Development',
      category: 'Programming & Software',
      duration: '6 Months',
      fee: 25000,
      description: 'Master Python, Django, REST APIs, React frontend, and practical generative AI model integration with hands-on capstone projects.',
      syllabus: [
        'Python Basics & OOP Concepts',
        'Data Structures & Algorithms',
        'Database Design (PostgreSQL & SQLite)',
        'Django Web Framework & REST APIs',
        'React Basics & Frontend Integration',
        'Generative AI API Integration & Deployment'
      ],
      popular: true,
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      prerequisites: 'Basic Computer Knowledge',
      level: 'Beginner to Advanced'
    },
    {
      id: 'course-2',
      code: 'MERN-401',
      title: 'Full Stack Web Development (MERN)',
      category: 'Web & App Development',
      duration: '4 Months',
      fee: 18000,
      description: 'Become a job-ready full stack web developer mastering HTML5, CSS3, Tailwind CSS, JavaScript ES6+, React, Node.js, Express, and MongoDB.',
      syllabus: [
        'Modern HTML5, CSS3 & Responsive Design',
        'JavaScript ES6+ & Asynchronous Programming',
        'React Component Lifecycle & Hooks',
        'Node.js Server Architecture & Express Routing',
        'MongoDB Database & Mongoose ORM',
        'Project Deployment on Vercel & AWS'
      ],
      popular: true,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      prerequisites: 'Logical reasoning & typing skills',
      level: 'Intermediate'
    },
    {
      id: 'course-3',
      code: 'DCA-602',
      title: 'Diploma in Computer Applications (DCA)',
      category: 'Office Automation & Tally',
      duration: '6 Months',
      fee: 12000,
      description: 'Comprehensive computer fundamentals, MS Office 365, Internet utilities, Graphic tools, and fundamental accounting basics.',
      syllabus: [
        'Computer Fundamentals & Windows OS',
        'MS Word (Advanced Layouts & Formatting)',
        'MS Excel (Formulas, Pivot Tables, Charts)',
        'MS PowerPoint (Professional Presentations)',
        'Internet, Email Security & Cloud Storage',
        'Basic Photoshop & Desktop Publishing'
      ],
      popular: true,
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      prerequisites: 'Open to all (10th pass / 12th pass)',
      level: 'Beginner'
    },
    {
      id: 'course-4',
      code: 'TAL-301',
      title: 'Tally Prime with GST & e-Way Bill',
      category: 'Office Automation & Tally',
      duration: '3 Months',
      fee: 8500,
      description: 'Practical computerized accounting training using official Tally Prime software, GST returns filing, TDS, and payroll management.',
      syllabus: [
        'Fundamental Principles of Accounting',
        'Voucher Entry & Ledger Creation in Tally',
        'Inventory Management & Stock Items',
        'GST Setup, Invoicing & Return Filing',
        'TDS Deduction & Report Generation',
        'Banking, Reconciliation & e-Way Bills'
      ],
      popular: false,
      thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      prerequisites: 'Basic math & commerce interest',
      level: 'All Levels'
    },
    {
      id: 'course-5',
      code: 'SEC-302',
      title: 'Cyber Security & Ethical Hacking',
      category: 'Cyber Security & Networking',
      duration: '3 Months',
      fee: 15000,
      description: 'Learn fundamental network security, vulnerability assessment, penetration testing techniques, and defense strategies.',
      syllabus: [
        'Networking Fundamentals (TCP/IP, OSI)',
        'Linux Command Line Essentials',
        'Information Gathering & Reconnaissance',
        'Web Application Security (OWASP Top 10)',
        'WiFi Security & Wireless Auditing',
        'System Defense & Incident Response'
      ],
      popular: false,
      thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      prerequisites: 'Basic OS and networking concepts',
      level: 'Intermediate'
    },
    {
      id: 'course-6',
      code: 'DES-303',
      title: 'Graphic Design & Video Editing',
      category: 'Graphic Design',
      duration: '3 Months',
      fee: 10000,
      description: 'Master Photoshop, Illustrator, Premiere Pro, and Canva for creative visual designs, social media branding, and video production.',
      syllabus: [
        'Design Principles & Color Theory',
        'Adobe Photoshop (Photo Retouching & Compositing)',
        'Adobe Illustrator (Vector Logo & Banner Design)',
        'Video Editing in Adobe Premiere Pro',
        'Social Media Graphics & Branding',
        'Portfolio Creation'
      ],
      popular: false,
      thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
      prerequisites: 'Creativity & interest in digital media',
      level: 'Beginner'
    }
  ];

  const students: Student[] = [];

  const payments: PaymentInstallment[] = [];

  const sliderImages: SliderImage[] = [
    {
      id: 'slide-1',
      title: 'Empowering Your Tech Future',
      subtitle: 'Premier Computer Training Institute in India with 100% Practical Exposure',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80',
      active: true,
      order: 1,
      ctaText: 'Explore Courses',
      ctaLink: '/courses'
    },
    {
      id: 'slide-2',
      title: 'Modern High-Tech Labs',
      subtitle: 'State-of-the-art computer workstations, dedicated high-speed internet & 1-on-1 guidance',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
      active: true,
      order: 2,
      ctaText: 'View Infrastructure',
      ctaLink: '/about'
    },
    {
      id: 'slide-3',
      title: 'ISO 9001:2015 Certified Credentials',
      subtitle: 'Gain industry-recognized certificates & placement assistance across top IT companies',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
      active: true,
      order: 3,
      ctaText: 'Check Results',
      ctaLink: '/results'
    }
  ];

  const resources: LearningResource[] = [
    // Course 1: Python Full Stack & AI Development
    {
      id: 'res-101',
      courseId: 'course-1',
      type: 'video',
      title: 'Topic 1: Python Architecture, Data Types & Variables',
      description: 'Detailed video lecture on Python interpreter, execution flow, data types, and setting up VS Code development environment.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      durationMinutes: 42,
      moduleName: 'Topic 1: Python Basics',
      order: 1,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Python Architecture & Syntax Handwritten Notes.pdf',
      createdAt: '2026-01-15'
    },
    {
      id: 'res-102',
      courseId: 'course-1',
      type: 'pdf',
      title: 'Topic 1 Study Guide: Complete Python CheatSheet & Reference Notes',
      description: 'Comprehensive study guide covering syntax, functions, variable scope, memory management, and error handling.',
      url: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      fileSizeMb: 3.8,
      moduleName: 'Topic 1: Python Basics',
      order: 1,
      createdAt: '2026-01-16'
    },
    {
      id: 'res-103',
      courseId: 'course-1',
      type: 'video',
      title: 'Topic 2: Object Oriented Programming (OOP) in Python',
      description: 'Classes, Objects, Inheritance, Encapsulation, Polymorphism, and Dunder methods explained with real-world examples.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      durationMinutes: 55,
      moduleName: 'Topic 2: OOP Concepts',
      order: 2,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Python OOP Concepts & Design Patterns Notes.pdf',
      createdAt: '2026-01-22'
    },
    {
      id: 'res-103-pdf',
      courseId: 'course-1',
      type: 'pdf',
      title: 'Topic 2 Study Guide: OOP Principles & Practical Exercises',
      description: 'Handwritten notes on Class design, static vs class methods, decorators, and OOP assignment solutions.',
      url: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      fileSizeMb: 4.1,
      moduleName: 'Topic 2: OOP Concepts',
      order: 2,
      createdAt: '2026-01-23'
    },
    {
      id: 'res-104',
      courseId: 'course-1',
      type: 'video',
      title: 'Topic 3: Django Web Framework & RESTful APIs',
      description: 'Building modern backend servers with Django, Model-View-Template pattern, migrations, and REST framework serializers.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      durationMinutes: 62,
      moduleName: 'Topic 3: Django & APIs',
      order: 3,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Django REST API Blueprint & Architecture Notes.pdf',
      createdAt: '2026-02-01'
    },
    {
      id: 'res-104-pdf',
      courseId: 'course-1',
      type: 'pdf',
      title: 'Topic 3 Study Guide: Django ORM & API Endpoints Reference',
      description: 'Complete reference sheet for PostgreSQL query optimization, JWT authentication, and API testing.',
      url: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      fileSizeMb: 5.2,
      moduleName: 'Topic 3: Django & APIs',
      order: 3,
      createdAt: '2026-02-02'
    },
    {
      id: 'res-105',
      courseId: 'course-1',
      type: 'video',
      title: 'Topic 4: Generative AI & Gemini API Integration in Python',
      description: 'Integrating multimodal AI capabilities, prompt engineering, structured outputs, and streaming responses with Google Gen AI SDK.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      durationMinutes: 48,
      moduleName: 'Topic 4: AI & Machine Learning',
      order: 4,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Generative AI Developer Handbook & API Guides.pdf',
      createdAt: '2026-02-10'
    },
    {
      id: 'res-105-pdf',
      courseId: 'course-1',
      type: 'pdf',
      title: 'Topic 4 Study Guide: GenAI Architecture & Real-World Capstone',
      description: 'Production deployment guide, token budget management, and AI agent workflow patterns.',
      url: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      fileSizeMb: 3.5,
      moduleName: 'Topic 4: AI & Machine Learning',
      order: 4,
      createdAt: '2026-02-11'
    },

    // Course 2: Full Stack Web Development (MERN)
    {
      id: 'res-201',
      courseId: 'course-2',
      type: 'video',
      title: 'Topic 1: Modern HTML5, Semantic Elements & Tailwind CSS',
      description: 'Mastering modern responsive UI design, flexbox, grid, Tailwind utility patterns, and web accessibility standards.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      durationMinutes: 40,
      moduleName: 'Topic 1: Modern UI & Tailwind',
      order: 1,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'HTML5 & Tailwind CSS Master CheatSheet.pdf',
      createdAt: '2026-01-18'
    },
    {
      id: 'res-201-pdf',
      courseId: 'course-2',
      type: 'pdf',
      title: 'Topic 1 Study Guide: Semantic HTML5 & Responsive Grid Guide',
      description: 'Detailed PDF diagrams for CSS Box Model, media queries, flex layouts, and typography scales.',
      url: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      fileSizeMb: 3.2,
      moduleName: 'Topic 1: Modern UI & Tailwind',
      order: 1,
      createdAt: '2026-01-19'
    },
    {
      id: 'res-202',
      courseId: 'course-2',
      type: 'video',
      title: 'Topic 2: JavaScript ES6+ & Asynchronous Programming',
      description: 'Deep dive into Closures, Promises, Async/Await, Array methods, Event Loop, and Fetch API communication.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      durationMinutes: 52,
      moduleName: 'Topic 2: JavaScript ES6+',
      order: 2,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'JavaScript ES6+ Deep Dive Notes & Interview Questions.pdf',
      createdAt: '2026-01-25'
    },
    {
      id: 'res-203',
      courseId: 'course-2',
      type: 'video',
      title: 'Topic 3: React Hooks & Modern Component Architecture',
      description: 'Mastering useState, useEffect, custom hooks, component composition, and state management in production React applications.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      durationMinutes: 58,
      moduleName: 'Topic 3: React 19 Frontend',
      order: 3,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'React 19 Hooks & Component Lifecycle Notes.pdf',
      createdAt: '2026-02-05'
    },
    {
      id: 'res-203-pdf',
      courseId: 'course-2',
      type: 'pdf',
      title: 'Topic 3 Study Guide: MERN Full Stack Architecture Blueprint',
      description: 'Step-by-step PDF guide for connecting React frontend to Express backend and MongoDB database.',
      url: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      fileSizeMb: 4.2,
      moduleName: 'Topic 3: React 19 Frontend',
      order: 3,
      createdAt: '2026-02-08'
    },
    {
      id: 'res-204',
      courseId: 'course-2',
      type: 'video',
      title: 'Topic 4: Node.js, Express & MongoDB REST API',
      description: 'Building secure server backends, JWT token authentication, Mongoose schemas, and database queries.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      durationMinutes: 65,
      moduleName: 'Topic 4: Backend & Database',
      order: 4,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Node.js & MongoDB Full Stack Handbook.pdf',
      createdAt: '2026-02-12'
    },

    // Course 3: Diploma in Computer Applications (DCA)
    {
      id: 'res-301',
      courseId: 'course-3',
      type: 'video',
      title: 'Topic 1: Computer Fundamentals & Operating System Utilities',
      description: 'Introduction to hardware architectures, CPU, memory, storage devices, Windows file system, and system settings.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      durationMinutes: 35,
      moduleName: 'Topic 1: Computer Fundamentals',
      order: 1,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Computer Fundamentals & OS Lecture Notes.pdf',
      createdAt: '2026-01-10'
    },
    {
      id: 'res-301-pdf',
      courseId: 'course-3',
      type: 'pdf',
      title: 'Topic 1 Study Guide: Complete DCA Course Handbook',
      description: 'Comprehensive study notes on computer components, shortcut keys, control panel navigation, and security.',
      url: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      fileSizeMb: 4.8,
      moduleName: 'Topic 1: Computer Fundamentals',
      order: 1,
      createdAt: '2026-01-11'
    },
    {
      id: 'res-302',
      courseId: 'course-3',
      type: 'video',
      title: 'Topic 2: MS Word Advanced Formatting & Mail Merge',
      description: 'Practical tutorial on professional document creation, headers/footers, table styling, page layouts, and bulk mail merge.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      durationMinutes: 45,
      moduleName: 'Topic 2: MS Office Suite',
      order: 2,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'MS Word Complete Guide & Practical Exercises.pdf',
      createdAt: '2026-01-20'
    },
    {
      id: 'res-303',
      courseId: 'course-3',
      type: 'video',
      title: 'Topic 3: MS Excel Formulas, Pivot Tables & Data Visualization',
      description: 'Mastering essential Excel formulas (SUMIF, VLOOKUP, XLOOKUP, IF-ELSE), pivot charts, conditional formatting, and data sorting.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      durationMinutes: 50,
      moduleName: 'Topic 3: MS Excel Mastery',
      order: 3,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Excel Formulas & Keyboard Shortcuts Handbook.pdf',
      createdAt: '2026-01-28'
    },

    // Course 4: Tally Prime with GST & e-Way Bill
    {
      id: 'res-401',
      courseId: 'course-4',
      type: 'video',
      title: 'Topic 1: Principles of Accounting & Tally Prime Ledger Creation',
      description: 'Accounting basics, Golden rules of accounting, creating company in Tally Prime, chart of accounts, and ledger groups.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      durationMinutes: 44,
      moduleName: 'Topic 1: Tally Accounting Basics',
      order: 1,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Tally Prime Fundamentals & Accounting Rules Notes.pdf',
      createdAt: '2026-01-12'
    },
    {
      id: 'res-402',
      courseId: 'course-4',
      type: 'video',
      title: 'Topic 2: GST Invoicing, Tax Configuration & e-Way Bills',
      description: 'Configuring CGST, SGST, IGST tax rates, generating sales invoices, debit/credit notes, and generating e-Way bill JSON files.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      durationMinutes: 56,
      moduleName: 'Topic 2: GST & Tax Invoicing',
      order: 2,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'GST Invoicing & Return Filing Manual.pdf',
      createdAt: '2026-01-24'
    },

    // Course 5: Cyber Security & Ethical Hacking
    {
      id: 'res-501',
      courseId: 'course-5',
      type: 'video',
      title: 'Topic 1: Networking Fundamentals & Wireshark Traffic Analysis',
      description: 'Understanding TCP/IP, OSI model layers, packet capture with Wireshark, DNS/DHCP inspection, and port scanning with Nmap.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      durationMinutes: 48,
      moduleName: 'Topic 1: Network Reconnaissance',
      order: 1,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Network Security & Protocol Analysis Notes.pdf',
      createdAt: '2026-01-14'
    },
    {
      id: 'res-502',
      courseId: 'course-5',
      type: 'video',
      title: 'Topic 2: Web Application Security & OWASP Top 10 Exploits',
      description: 'Hands-on lab analysis of SQL Injection, Cross-Site Scripting (XSS), CSRF, authentication bypass, and defensive remediation.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      durationMinutes: 60,
      moduleName: 'Topic 2: Web Security & Defense',
      order: 2,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'OWASP Top 10 Exploits & Remediation CheatSheet.pdf',
      createdAt: '2026-01-26'
    },

    // Course 6: Graphic Design & Video Editing
    {
      id: 'res-601',
      courseId: 'course-6',
      type: 'video',
      title: 'Topic 1: Adobe Photoshop Layer Architecture & Color Grading',
      description: 'Mastering selection tools, layer masks, non-destructive editing, blending modes, adjustment layers, and photo retouching.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      durationMinutes: 46,
      moduleName: 'Topic 1: Photoshop Mastering',
      order: 1,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Photoshop Tools & Design Principles Notes.pdf',
      createdAt: '2026-01-15'
    },
    {
      id: 'res-602',
      courseId: 'course-6',
      type: 'video',
      title: 'Topic 2: Premiere Pro Video Timeline & Motion Transitions',
      description: 'Video importing, timeline ripple edits, keyframe animations, audio noise reduction, Lumetri color grading, and rendering.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      durationMinutes: 54,
      moduleName: 'Topic 2: Video Editing & Motion',
      order: 2,
      pdfUrl: 'https://www.w3.org/W3C/DesignIssues/pdf/Overview.pdf',
      pdfTitle: 'Video Editing Workflows & Premiere Pro Shortcuts.pdf',
      createdAt: '2026-01-28'
    }
  ];

  const notifications: NotificationAnnouncement[] = [
    {
      id: 'notif-1',
      title: 'Mid-Term Semester Assessment Schedule',
      content: 'Mid-term practical and theory examinations for Python & MERN batches will commence from March 15, 2026. Hall tickets are available in student portal.',
      type: 'exam',
      date: '2026-02-20',
      important: true
    },
    {
      id: 'notif-2',
      title: 'Special Workshop on Generative AI & Prompt Engineering',
      content: 'Oritech Computer is hosting an exclusive weekend workshop on building AI applications using Gemini API & LLMs this Saturday at 10:00 AM in Lab 1.',
      type: 'center',
      date: '2026-02-18',
      important: false
    },
    {
      id: 'notif-3',
      title: 'Fee Installment Reminder Notice',
      content: 'Students with pending fee installments due in February are advised to clear their dues before February 28 to avoid late charges.',
      type: 'fee',
      date: '2026-02-12',
      important: true
    }
  ];

  const results: StudentResult[] = [
    {
      id: 'res-stu-101',
      rollNumber: 'ORI-2026-101',
      studentName: 'Rahul Sharma',
      courseTitle: 'Python Full Stack & AI Development',
      examName: 'Semester 1 Theory & Practical Exam',
      examDate: '2026-02-05',
      subjects: [
        { subjectName: 'Python Fundamentals & Syntax', marksObtained: 92, maxMarks: 100 },
        { subjectName: 'Data Structures & Logic', marksObtained: 88, maxMarks: 100 },
        { subjectName: 'Practical Lab Assessment', marksObtained: 95, maxMarks: 100 }
      ],
      totalMarksObtained: 275,
      totalMaxMarks: 300,
      percentage: 91.6,
      grade: 'A+',
      status: 'Pass',
      certificateStatus: 'In Progress'
    },
    {
      id: 'res-stu-102',
      rollNumber: 'ORI-2026-102',
      studentName: 'Priya Patel',
      courseTitle: 'Full Stack Web Development (MERN)',
      examName: 'Mid-Course Practical Evaluation',
      examDate: '2026-02-10',
      subjects: [
        { subjectName: 'HTML5/CSS3 & UI Design', marksObtained: 96, maxMarks: 100 },
        { subjectName: 'JavaScript ES6 & Async', marksObtained: 90, maxMarks: 100 },
        { subjectName: 'React Components Lab', marksObtained: 94, maxMarks: 100 }
      ],
      totalMarksObtained: 280,
      totalMaxMarks: 300,
      percentage: 93.3,
      grade: 'A+',
      status: 'Pass',
      certificateStatus: 'Issued',
      issuedDate: '2026-02-12'
    }
  ];

  const users: User[] = [
    {
      id: 'admin-user-1',
      username: 'admin',
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@oritech.edu'
    }
  ];

  const enquiries: ContactEnquiry[] = [
    {
      id: 'enq-1',
      name: 'Vikram Singh',
      phone: '+91 97112 23344',
      email: 'vikram@example.com',
      courseId: 'course-1',
      courseTitle: 'Python Full Stack & AI Development',
      message: 'Interested in weekend batch timings and fee discount structure.',
      createdAt: '2026-02-21',
      status: 'New'
    }
  ];

  return {
    users,
    courses,
    students,
    payments,
    sliderImages,
    resources,
    notifications,
    results,
    enquiries,
    pendingRegistrations: [],
    courseReviews: [
      {
        id: 'rev-1',
        courseId: 'course-1',
        courseTitle: 'Python Full Stack & AI Development',
        studentName: 'Aarav Patel',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        batch: 'Jan 2026 Batch',
        reviewText: 'The practical labs for Python Full Stack & AI were top notch! The instructor explained every concept with step-by-step examples. My confidence in building real applications went up significantly.',
        helpfulCount: 14,
        verified: true,
        createdAt: '2026-02-10',
      },
      {
        id: 'rev-2',
        courseId: 'course-2',
        courseTitle: 'Full Stack Web Development (MERN)',
        studentName: 'Sneha Deshmukh',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        batch: 'Dec 2025 Batch',
        reviewText: 'Great personal attention during practical batch hours. Whenever I got stuck on an exercise, the lab assistant helped resolve the bug right away.',
        helpfulCount: 9,
        verified: true,
        createdAt: '2026-01-20',
      }
    ],
    instituteReviews: [
      {
        id: 'inst-rev-1',
        studentName: 'Priya Sharma',
        courseTitle: 'Full Stack Web Development',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        roleOrCompany: 'Frontend Developer @ TechSolutions',
        rating: 5,
        reviewText: 'The practical lab sessions and 1-on-1 coding assistance at Oritech Computer gave me the confidence to clear technical interviews. Building real projects made all the difference!',
        batchYear: '2025',
        verified: true,
        createdAt: '2026-01-15',
      },
      {
        id: 'inst-rev-2',
        studentName: 'Rahul Verma',
        courseTitle: 'Tally Prime with GST & ERP',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        roleOrCompany: 'Senior Accountant @ Globe Logistics',
        rating: 5,
        reviewText: 'I was confused about GST filing and e-way bill portals. The trainer guided us step-by-step with real company ledger files. Got placed within 2 weeks of finishing the course.',
        batchYear: '2024',
        verified: true,
        createdAt: '2026-02-01',
      },
      {
        id: 'inst-rev-3',
        studentName: 'Ananya Patel',
        courseTitle: 'AutoCAD 2D Drafting & 3D Design',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        roleOrCompany: 'CAD Junior Specialist @ DesignStudio',
        rating: 5,
        reviewText: 'Small batch size meant the sir could check every line of my floor plans and 3D renders. High-speed PCs in the lab made rendering smooth and quick.',
        batchYear: '2025',
        verified: true,
        createdAt: '2026-02-05',
      },
      {
        id: 'inst-rev-4',
        studentName: 'Siddharth Rao',
        courseTitle: 'Python Programming & Data Analytics',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        roleOrCompany: 'Data Associate @ Analytics Hub',
        rating: 5,
        reviewText: 'Extremely structured syllabus covering NumPy, Pandas, and Matplotlib. Sir explained complex logic with relatable real-life analogies.',
        batchYear: '2025',
        verified: true,
        createdAt: '2026-02-08',
      }
    ],
    certificates: [
      {
        id: 'cert-101',
        certificateNumber: 'CERT-2026-101',
        rollNumber: 'ORI-2026-101',
        studentName: 'Rahul Sharma',
        courseTitle: 'Python Full Stack & AI Development',
        courseId: 'course-1',
        issueDate: '2026-03-15',
        grade: 'A+ (Distinction)',
        certificateUrl: 'https://images.unsplash.com/photo-1589330694653-dad6d3240a2b?auto=format&fit=crop&w=1200&q=80',
        status: 'Verified',
        remarks: 'Successfully completed full-stack software development, REST API capstones & practical AI model integration.',
        createdAt: '2026-03-15',
      }
    ]
  };
}

export function readDb(): DatabaseSchema {
  ensureDataDirExists();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    // Filter out initial mock students if any exist from previous seeds
    if (Array.isArray(parsed.students)) {
      parsed.students = parsed.students.filter(
        (s: Student) => s.id !== 'stu-101' && s.id !== 'stu-102' && s.id !== 'stu-103'
      );
    }
    if (Array.isArray(parsed.users)) {
      parsed.users = parsed.users.filter(
        (u: User) => u.id !== 'stu-user-101' && u.id !== 'stu-user-102' && u.id !== 'stu-user-103'
      );
    }
    parsed.pendingRegistrations = parsed.pendingRegistrations || [];
    parsed.courseReviews = parsed.courseReviews || [];
    parsed.instituteReviews = parsed.instituteReviews || [];
    parsed.certificates = parsed.certificates || [];
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, re-initializing:', err);
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

export function writeDb(data: DatabaseSchema): void {
  ensureDataDirExists();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
