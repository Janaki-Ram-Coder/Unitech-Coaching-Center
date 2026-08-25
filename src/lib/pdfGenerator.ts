import { jsPDF } from 'jspdf';
import { Course, LearningResource } from '../types';

export function downloadCourseNotesPdf(options: {
  courseTitle: string;
  courseCode?: string;
  category?: string;
  duration?: string;
  moduleName?: string;
  noteTitle?: string;
  studentName?: string;
  studentRoll?: string;
  syllabus?: string[];
  description?: string;
}) {
  const {
    courseTitle,
    courseCode = 'ORI-COURSE',
    category = 'Computer Application',
    duration = '3 Months',
    moduleName = 'Topic Study Notes',
    noteTitle = 'Course Study Material & Topic Notes',
    studentName,
    studentRoll,
    syllabus = [],
    description = '',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative Accent Line
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Institute Name & Branding
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ORITECH COMPUTER', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254);
  doc.text('Government Recognized & Certified Technical Education Portal • Estd. 2012', margin, 18);
  doc.text('Main Campus: Sharma Complex, Beside Hotel Jyoti Mahal, Convent road, New Colony, Rayagada-765001, Odisha • Helpline: +91 9437235124', margin, 23);

  // Document Title & Category Badge
  let y = 40;

  doc.setFillColor(238, 242, 255); // indigo-50
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 27, 75); // indigo-950
  doc.text(courseTitle, margin + 4, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text(`Course Code: ${courseCode}  |  Category: ${category}  |  Duration: ${duration}`, margin + 4, y + 16);

  y += 30;

  // Student Context (if provided)
  if (studentName || studentRoll) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 12, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const studInfo = `Enrolled Student: ${studentName || 'Registered Student'}   |   Roll Number: ${studentRoll || 'N/A'}   |   Academic Year: 2026-2027`;
    doc.text(studInfo, margin + 4, y + 7.5);
    y += 18;
  }

  // Section 1: Active Topic / Module Study Material
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, 4, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`1. ${moduleName.toUpperCase()} — ${noteTitle}`, margin + 7, y + 7.5);

  y += 15;

  // Topic Overview paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  const topicIntro = `This study handbook provides foundational theory, architecture guidelines, syntax breakdown, and practical lab assignments for ${moduleName} under ${courseTitle}. Follow all step-by-step practical commands carefully in the lab session.`;
  const splitIntro = doc.splitTextToSize(topicIntro, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 5 + 4;

  // Key Learning Concepts Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Key Conceptual Highlights & Industry Standards:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const highlights = [
    '• Comprehensive syntax, core concepts, and logical programming structures.',
    '• Practical project implementation guidelines and clean coding principles.',
    '• Real-world debugging, testing workflows, and common error resolution.',
    '• Daily lab exercises, mini-assignments, and faculty evaluation criteria.',
  ];
  highlights.forEach((hl, i) => {
    doc.text(hl, margin + 4, y + 13 + i * 5.5);
  });

  y += 46;

  // Section 2: Complete Course Curriculum / Syllabus
  if (syllabus && syllabus.length > 0) {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, 4, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. OFFICIAL COURSE SYLLABUS & MODULES', margin + 7, y + 7.5);

    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    syllabus.forEach((item, index) => {
      if (y > pageHeight - 35) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, 7, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text(`Module ${index + 1}:`, margin + 3, y + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(item, margin + 24, y + 4.8);

      y += 8;
    });

    y += 4;
  }

  // Section 3: Lab Instructions & Institute Support
  if (y > pageHeight - 45) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // amber-900
  doc.text('Student Notice & Lab Practice Guidelines:', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text('Students are required to attend minimum 80% practical lab hours and complete weekly assignments.', margin + 4, y + 11);
  doc.text('For faculty doubts or additional project guidance, visit the instructor desk or submit a ticket in portal.', margin + 4, y + 16);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    doc.text(`Generated on ${dateStr} • Oritech Computer Student Learning Portal`, margin, pageHeight - 9);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 9);
  }

  // Sanitize filename and trigger browser download
  const cleanFileName = `${courseTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${moduleName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Notes.pdf`;
  doc.save(cleanFileName);
}

export function downloadCourseSyllabusPdf(course: Course, student?: { name?: string; rollNumber?: string }) {
  downloadCourseNotesPdf({
    courseTitle: course.title,
    courseCode: course.code,
    category: course.category,
    duration: course.duration,
    moduleName: 'Full Course Syllabus & Curriculum',
    noteTitle: 'Official Academic Course Guide',
    studentName: student?.name,
    studentRoll: student?.rollNumber,
    syllabus: Array.isArray(course.syllabus) ? course.syllabus : [course.syllabus || 'General Curriculum'],
    description: course.description,
  });
}
