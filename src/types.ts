export type UserRole = 'admin' | 'student';

export interface WatchProgress {
  courseId: string;
  courseTitle?: string;
  topicIndex: number;
  moduleName: string;
  resourceId?: string;
  videoTitle?: string;
  videoUrl?: string;
  timestampSeconds: number;
  durationSeconds?: number;
  lastWatchedAt: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  studentId?: string;
  rollNumber?: string;
  isVerified?: boolean;
  profileCompleted?: boolean;
  selectedCourseIds?: string[];
  continueWatching?: WatchProgress;
  watchProgress?: { [courseId: string]: WatchProgress };
  createdAt?: string;
  passwordHash?: string;
}

export interface PendingRegistration {
  id: string;
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  otp: string;
  otpExpiresAt: number;
  createdAt: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  category: string;
  duration: string;
  fee: number;
  description: string;
  syllabus: string[];
  popular: boolean;
  thumbnail: string;
  prerequisites: string;
  level: string;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  profileLink?: string;
  certificateUrl?: string;
  certificateNumber?: string;
  certificateIssueDate?: string;
  certificateGrade?: string;
  courseId: string;
  courseTitle: string;
  selectedCourseIds?: string[];
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  joinedDate: string;
  status: 'Active' | 'Completed' | 'Dropped';
  batchTiming: string;
  username: string;
  profileCompleted?: boolean;
  continueWatching?: WatchProgress;
  watchProgress?: { [courseId: string]: WatchProgress };
  passwordHash?: string;
  plainPassword?: string; // Stored for admin view if generated
}

export interface StudentAssignment {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  dueDate: string;
  description: string;
  points: number;
  status: 'Pending' | 'Submitted' | 'Graded';
  submissionLink?: string;
  submittedAt?: string;
  score?: number;
  feedback?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudentQuiz {
  id: string;
  courseId: string;
  title: string;
  durationMinutes: number;
  questions: QuizQuestion[];
}

export interface DoubtTicket {
  id: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  subject: string;
  question: string;
  status: 'Open' | 'Answered';
  reply?: string;
  createdAt: string;
}

export interface PaymentInstallment {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  courseTitle: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  nextDueDate: string;
  remarks: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface SliderImage {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  active: boolean;
  order: number;
  ctaText?: string;
  ctaLink?: string;
}

export interface LearningResource {
  id: string;
  courseId: string;
  type: 'video' | 'pdf';
  title: string;
  description: string;
  url: string;
  durationMinutes?: number;
  fileSizeMb?: number;
  moduleName: string;
  order?: number;
  pdfUrl?: string;
  pdfTitle?: string;
  createdAt: string;
}

export interface NotificationAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'exam' | 'center' | 'fee' | 'general';
  date: string;
  forCourseId?: string;
  important: boolean;
}

export interface SubjectMark {
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
}

export interface CertificateRecord {
  id: string;
  certificateNumber: string;
  rollNumber: string;
  studentName: string;
  courseTitle: string;
  courseId?: string;
  issueDate: string;
  grade?: string;
  certificateUrl: string;
  status: 'Verified' | 'Revoked';
  remarks?: string;
  createdAt?: string;
}

export interface StudentResult {
  id: string;
  rollNumber: string;
  studentName: string;
  courseTitle: string;
  examName: string;
  examDate: string;
  subjects: SubjectMark[];
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Pass' | 'Fail';
  status: 'Pass' | 'Fail';
  certificateStatus: 'Issued' | 'In Progress' | 'Pending';
  issuedDate?: string;
}

export interface AdminStats {
  totalActiveStudents: number;
  todayFeeCollection: number;
  totalOutstandingDue: number;
  overdueCount: number;
  totalCoursesCount: number;
  totalReceiptsCount: number;
}

export interface ContactEnquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  courseId?: string;
  courseTitle: string;
  message: string;
  createdAt: string;
  submittedAt?: string;
  status: 'New' | 'Contacted' | 'Enrolled' | 'Closed';
  notes?: string;
  source?: string;
}

export interface Testimonial {
  id: string;
  studentName: string;
  courseTitle: string;
  avatar: string;
  roleOrCompany: string;
  rating: number;
  reviewText: string;
  batchYear: string;
  verifiedStudent: boolean;
  createdAt?: string;
  userId?: string;
  studentId?: string;
}

export interface CourseReview {
  id: string;
  courseId: string;
  courseTitle: string;
  userId?: string;
  studentId?: string;
  studentName: string;
  avatar?: string;
  rating: number;
  batch: string;
  reviewText: string;
  helpfulCount: number;
  verified: boolean;
  createdAt: string;
}

export interface InstituteReview {
  id: string;
  userId?: string;
  studentId?: string;
  studentName: string;
  avatar?: string;
  rating: number;
  roleOrCompany?: string;
  courseTitle?: string;
  reviewText: string;
  batchYear?: string;
  verified: boolean;
  createdAt: string;
}

export interface InstituteBranding {
  id?: string;
  logoUrl: string;
  logoIconUrl?: string;
  instituteName: string;
  tagline: string;
  stampUrl?: string;
  footerLogoUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  headerNotice?: string;
  address?: string;
  updatedAt?: string;
}


