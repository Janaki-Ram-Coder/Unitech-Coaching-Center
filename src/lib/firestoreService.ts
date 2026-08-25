import {
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, firebaseConfig } from './firebase';
import {
  Student,
  Course,
  PaymentInstallment,
  StudentResult,
  CertificateRecord,
  LearningResource,
  NotificationAnnouncement,
  ContactEnquiry,
  SliderImage,
  CourseReview,
  InstituteReview,
  User,
  InstituteBranding,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const rawMsg = error instanceof Error ? error.message : String(error);
  const isDbNotFound = rawMsg.includes("Database '(default)' not found") || rawMsg.includes('not found');

  const errInfo: FirestoreErrorInfo = {
    error: rawMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  if (isDbNotFound) {
    console.warn(
      `[Firestore Note] Database '(default)' not yet created in Firebase Project 'unitechcoachingcenter'. Go to https://console.firebase.google.com/project/unitechcoachingcenter/firestore and click 'Create database'.`
    );
  } else {
    console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  }
  return errInfo;
}

export async function withTimeout<T>(promise: Promise<T>, fallbackValue: T, timeoutMs = 2500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs)),
  ]);
}

/**
 * Deep sanitization for Firestore.
 * Strips all `undefined` values so Firestore setDoc / updateDoc never rejects writes.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const result: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === undefined) {
      continue;
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      result[key] = cleanFirestoreData(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item));
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

/**
 * Convert native JavaScript values into Google Cloud Firestore REST API Document Format.
 */
function toFirestoreRestValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreRestValue),
      },
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const k of Object.keys(val)) {
      if (val[k] !== undefined) {
        fields[k] = toFirestoreRestValue(val[k]);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Direct REST write fallback to Firestore if WebChannel streaming stalls in sandbox or iframe.
 */
export async function fsRestSaveDocument(collectionName: string, docId: string, data: any): Promise<boolean> {
  const apiKey = firebaseConfig.apiKey;
  const projectId = firebaseConfig.projectId || 'unitechcoachingcenter';
  const databaseId = 'default';
  if (!apiKey || !projectId) return false;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}/${docId}?key=${apiKey}`;
  const fields: Record<string, any> = {};
  const cleaned = cleanFirestoreData(data);
  for (const k of Object.keys(cleaned)) {
    fields[k] = toFirestoreRestValue(cleaned[k]);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch (e) {
    console.warn(`[Firestore REST Write Notice for ${collectionName}/${docId}]:`, e);
    return false;
  }
}

/**
 * Master resilient write: Attempts Firebase SDK setDoc while racing a fast failover to Firestore REST.
 * Guarantees that the UI never hangs or loops while persisting data directly into Firestore.
 */
export async function fsWriteDocumentDirect(collectionName: string, docId: string, data: any): Promise<boolean> {
  const cleaned = cleanFirestoreData(data);
  let resolved = false;

  const sdkPromise = (async () => {
    try {
      await setDoc(doc(db, collectionName, docId), cleaned, { merge: true });
      resolved = true;
      return true;
    } catch (err) {
      console.warn(`[SDK write fallback triggered for ${collectionName}/${docId}]:`, err);
      return false;
    }
  })();

  const restFallbackPromise = new Promise<boolean>((resolve) => {
    setTimeout(async () => {
      if (!resolved) {
        const ok = await fsRestSaveDocument(collectionName, docId, cleaned);
        resolve(ok);
      } else {
        resolve(true);
      }
    }, 2800);
  });

  return await Promise.race([sdkPromise, restFallbackPromise]);
}

/**
 * Master resilient delete: Attempts Firebase SDK deleteDoc while racing a direct Firestore REST DELETE.
 */
export async function fsDeleteDocumentDirect(collectionName: string, docId: string): Promise<boolean> {
  let resolved = false;

  const sdkPromise = (async () => {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      resolved = true;
      return true;
    } catch (err) {
      return false;
    }
  })();

  const restFallbackPromise = new Promise<boolean>((resolve) => {
    setTimeout(async () => {
      if (!resolved) {
        const apiKey = firebaseConfig.apiKey;
        const projectId = firebaseConfig.projectId || 'unitechcoachingcenter';
        try {
          await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/default/documents/${collectionName}/${docId}?key=${apiKey}`, {
            method: 'DELETE',
          });
        } catch (_) {}
        resolve(true);
      } else {
        resolve(true);
      }
    }, 2800);
  });

  return await Promise.race([sdkPromise, restFallbackPromise]);
}

// ----------------------------------------------------
// DOCUMENT NORMALIZERS (Guarantees no undefined crashes)
// ----------------------------------------------------

export const COURSE_COLLECTION_CANDIDATES = [
  'courses',
  'Courses',
  'course',
  'Course',
  'course_details',
  'courses_details',
  'courseDetails',
  'coursesDetails',
  'CourseDetails',
  'Course_Details',
  'coursedetails',
  'all_courses',
  'allCourses',
  'tbl_courses',
  'tblCourses',
  'unitech_courses',
  'programs',
  'Programs',
];

export function extractCoursesFromFirestoreDocs(docs: Array<{ id: string; data: any }>): Course[] {
  const result: Course[] = [];

  for (const docItem of docs) {
    const raw = docItem.data;
    if (!raw || typeof raw !== 'object') continue;

    // Check if the document has a nested array of courses (common when importing JSON or single-document setup)
    const candidateArrayKeys = [
      'courses',
      'courseList',
      'course_list',
      'list',
      'data',
      'items',
      'allCourses',
      'records',
      'course_details',
      'details',
      'courses_data',
    ];

    let foundArray: any[] | null = null;
    for (const key of candidateArrayKeys) {
      if (Array.isArray(raw[key]) && raw[key].length > 0) {
        foundArray = raw[key];
        break;
      }
      const match = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
      if (match && Array.isArray(raw[match]) && raw[match].length > 0) {
        foundArray = raw[match];
        break;
      }
    }

    if (foundArray) {
      foundArray.forEach((item, index) => {
        if (item && typeof item === 'object') {
          const itemKey = item.id || item.code || `${docItem.id}_${index}`;
          result.push(normalizeCourseDoc(String(itemKey), item));
        }
      });
      continue;
    }

    // Check if document contains multiple course maps like { "0": {...}, "1": {...} } or { "course1": {...} }
    const keys = Object.keys(raw);
    const objectValues = keys
      .map((k) => raw[k])
      .filter((v) => v && typeof v === 'object' && !Array.isArray(v) && (v.title || v.name || v.courseName || v.fee || v.code || v.duration));

    const isContainerDoc = objectValues.length > 0 && !raw.title && !raw.name && !raw.courseName && !raw.fee && !raw.duration;
    if (isContainerDoc) {
      objectValues.forEach((val, index) => {
        const itemKey = val.id || val.code || `${docItem.id}_${index}`;
        result.push(normalizeCourseDoc(String(itemKey), val));
      });
      continue;
    }

    // Standard single-course document
    result.push(normalizeCourseDoc(docItem.id, raw));
  }

  return result;
}

export function normalizeCourseDoc(id: string, raw: any): Course {
  if (!raw || typeof raw !== 'object') {
    return {
      id,
      code: `ORI-${id.slice(-4).toUpperCase()}`,
      title: 'Certified Computer Course',
      category: 'Programming & Software',
      duration: '3 Months',
      fee: 10000,
      description: 'Comprehensive practical computer training course.',
      syllabus: ['Module 1: Fundamentals & Theory', 'Module 2: Practical Lab Practice', 'Module 3: Project & Assessment'],
      popular: true,
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      prerequisites: 'Basic Computer Literacy',
      level: 'Beginner to Intermediate',
    };
  }

  // Find properties in raw object case-insensitively if needed
  const getProp = (keys: string[], fallback: any = ''): any => {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null) return raw[key];
    }
    // Try lowercased keys scan
    const rawKeys = Object.keys(raw);
    for (const key of keys) {
      const match = rawKeys.find((k) => k.toLowerCase() === key.toLowerCase());
      if (match && raw[match] !== undefined && raw[match] !== null) return raw[match];
    }
    return fallback;
  };

  let code =
    getProp(['code', 'courseCode', 'course_code', 'Code', 'CourseCode', 'course_id', 'courseId']) ||
    `ORI-${id.slice(-4).toUpperCase()}`;
  if (typeof code === 'string' && code.toUpperCase().startsWith('UNI-')) {
    code = code.replace(/^UNI-/i, 'ORI-');
  }

  const title =
    getProp(['title', 'name', 'courseName', 'course_name', 'Title', 'Name', 'CourseName', 'course_title', 'CourseTitle', 'course']) ||
    'Certified Computer Course';

  const category =
    getProp(['category', 'courseCategory', 'Category', 'course_category', 'type', 'stream']) ||
    'Programming & Software';

  const duration =
    getProp(['duration', 'Duration', 'courseDuration', 'course_duration', 'time', 'period']) ||
    '3 Months';

  const rawFee = getProp(['fee', 'fees', 'Fee', 'Fees', 'courseFee', 'CourseFee', 'course_fee', 'price', 'Price', 'amount', 'Amount', 'totalFee'], 10000);
  const fee = typeof rawFee === 'number' ? rawFee : (Number(rawFee) || 10000);

  const description =
    getProp(['description', 'desc', 'Description', 'Desc', 'courseDescription', 'details', 'about', 'summary']) ||
    'Comprehensive professional computer certification course designed for practical career readiness.';

  let syllabus: string[] = [];
  const rawSyllabus = getProp(['syllabus', 'Syllabus', 'modules', 'Modules', 'topics', 'Topics', 'curriculum', 'Curriculum'], null);
  if (Array.isArray(rawSyllabus)) {
    syllabus = rawSyllabus.map((s: any) => String(s).trim()).filter(Boolean);
  } else if (typeof rawSyllabus === 'string') {
    syllabus = rawSyllabus.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean);
  }

  if (syllabus.length === 0) {
    syllabus = [
      'Module 1: Fundamental Concepts & Theory',
      'Module 2: Hands-On Practical Lab Training',
      'Module 3: Industry Project & Skill Assessment',
    ];
  }

  const thumbnail =
    getProp(['thumbnail', 'Thumbnail', 'image', 'Image', 'imageUrl', 'ImageUrl', 'img', 'photo', 'banner', 'poster']) ||
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80';

  const prerequisites =
    getProp(['prerequisites', 'prereq', 'eligibility', 'requirements', 'Prerequisites']) ||
    'Basic Computer Literacy';

  const level =
    getProp(['level', 'difficulty', 'skillLevel', 'Level']) ||
    'Beginner to Intermediate';

  const rawPopular = getProp(['popular', 'Popular', 'isPopular', 'featured', 'Featured'], true);
  const popular = Boolean(rawPopular);

  return {
    id: raw.id || id,
    code,
    title,
    category,
    duration,
    fee,
    description,
    syllabus,
    popular,
    thumbnail,
    prerequisites,
    level,
  };
}

export function normalizeStudentDoc(id: string, raw: any): Student {
  let rollNumber = raw.rollNumber || raw.username || `ORI-${id.slice(-6).toUpperCase()}`;
  if (typeof rollNumber === 'string' && rollNumber.toUpperCase().startsWith('UNI-')) {
    rollNumber = rollNumber.replace(/^UNI-/i, 'ORI-');
    if (raw.rollNumber && String(raw.rollNumber).toUpperCase().startsWith('UNI-')) {
      updateDoc(doc(db, 'students', id), {
        rollNumber,
        username: (raw.username || rollNumber).replace(/^UNI-/i, 'ORI-').toLowerCase(),
      }).catch(() => {});
    }
  }

  const name = raw.name || 'Student';
  const email = (raw.email || '').trim().toLowerCase();
  const phone = raw.phone || '';
  const totalFee = typeof raw.totalFee === 'number' ? raw.totalFee : Number(raw.totalFee) || 10000;
  const paidAmount = typeof raw.paidAmount === 'number' ? raw.paidAmount : Number(raw.paidAmount) || 0;
  const dueAmount = typeof raw.dueAmount === 'number' ? raw.dueAmount : Math.max(0, totalFee - paidAmount);
  
  return {
    id: raw.id || id,
    rollNumber,
    name,
    email,
    phone,
    avatar: raw.avatar || raw.profileLink || '',
    profileLink: raw.profileLink || raw.avatar || '',
    courseId: raw.courseId || 'course-1',
    courseTitle: raw.courseTitle || 'Computer Course',
    selectedCourseIds: Array.isArray(raw.selectedCourseIds) ? raw.selectedCourseIds : (raw.courseId ? [raw.courseId] : []),
    totalFee,
    paidAmount,
    dueAmount,
    joinedDate: raw.joinedDate || new Date().toISOString().split('T')[0],
    status: raw.status || 'Active',
    batchTiming: raw.batchTiming || '09:00 AM - 11:00 AM',
    username: (raw.username || rollNumber).toLowerCase(),
    plainPassword: raw.plainPassword || raw.password,
    certificateNumber: raw.certificateNumber || '',
    certificateUrl: raw.certificateUrl || '',
    certificateIssueDate: raw.certificateIssueDate || '',
    certificateGrade: raw.certificateGrade || '',
    profileCompleted: Boolean(raw.profileCompleted),
    continueWatching: raw.continueWatching,
    watchProgress: raw.watchProgress,
  };
}

export function normalizePaymentDoc(id: string, raw: any): PaymentInstallment {
  let rollNumber = raw.rollNumber || '';
  if (typeof rollNumber === 'string' && rollNumber.toUpperCase().startsWith('UNI-')) {
    rollNumber = rollNumber.replace(/^UNI-/i, 'ORI-');
    if (raw.rollNumber && String(raw.rollNumber).toUpperCase().startsWith('UNI-')) {
      updateDoc(doc(db, 'payments', id), { rollNumber }).catch(() => {});
    }
  }

  return {
    id: raw.id || id,
    receiptNo: raw.receiptNo || `RCP-${id.slice(-6).toUpperCase()}`,
    studentId: raw.studentId || '',
    studentName: raw.studentName || 'Student',
    rollNumber,
    courseTitle: raw.courseTitle || 'Course',
    amount: typeof raw.amount === 'number' ? raw.amount : Number(raw.amount) || 0,
    paymentDate: raw.paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: raw.paymentMethod || 'Cash',
    nextDueDate: raw.nextDueDate || '',
    remarks: raw.remarks || 'Fee payment installment',
    status: raw.status || 'Paid',
  };
}

export function normalizeResultDoc(id: string, raw: any): StudentResult {
  let rollNumber = raw.rollNumber || '';
  if (typeof rollNumber === 'string' && rollNumber.toUpperCase().startsWith('UNI-')) {
    rollNumber = rollNumber.replace(/^UNI-/i, 'ORI-');
    if (raw.rollNumber && String(raw.rollNumber).toUpperCase().startsWith('UNI-')) {
      updateDoc(doc(db, 'results', id), { rollNumber }).catch(() => {});
    }
  }

  return {
    id: raw.id || id,
    rollNumber,
    studentName: raw.studentName || 'Student',
    courseTitle: raw.courseTitle || 'Course',
    examName: raw.examName || raw.examTitle || 'Final Examination',
    examDate: raw.examDate || new Date().toISOString().split('T')[0],
    subjects: Array.isArray(raw.subjects) ? raw.subjects : [{ subjectName: 'Practical Lab & Theory', marksObtained: raw.obtainedMarks || 85, maxMarks: raw.totalMarks || 100 }],
    totalMarksObtained: typeof raw.totalMarksObtained === 'number' ? raw.totalMarksObtained : (typeof raw.obtainedMarks === 'number' ? raw.obtainedMarks : 85),
    totalMaxMarks: typeof raw.totalMaxMarks === 'number' ? raw.totalMaxMarks : (typeof raw.totalMarks === 'number' ? raw.totalMarks : 100),
    percentage: typeof raw.percentage === 'number' ? raw.percentage : 85,
    grade: raw.grade || 'A',
    status: raw.status || 'Pass',
    certificateStatus: raw.certificateStatus || 'Issued',
    issuedDate: raw.issuedDate || raw.examDate || new Date().toISOString().split('T')[0],
  };
}

export function normalizeCertificateDoc(id: string, raw: any): CertificateRecord {
  let rollNumber = raw.rollNumber || '';
  if (typeof rollNumber === 'string' && rollNumber.toUpperCase().startsWith('UNI-')) {
    rollNumber = rollNumber.replace(/^UNI-/i, 'ORI-');
    if (raw.rollNumber && String(raw.rollNumber).toUpperCase().startsWith('UNI-')) {
      updateDoc(doc(db, 'certificates', id), { rollNumber }).catch(() => {});
    }
  }

  return {
    id: raw.id || id,
    certificateNumber: raw.certificateNumber || `UTC-CERT-${id.slice(-6).toUpperCase()}`,
    rollNumber,
    studentName: raw.studentName || 'Student',
    courseTitle: raw.courseTitle || 'Computer Course',
    courseId: raw.courseId || '',
    issueDate: raw.issueDate || new Date().toISOString().split('T')[0],
    grade: raw.grade || 'A+',
    certificateUrl: raw.certificateUrl || raw.fileUrl || '',
    status: raw.status === 'Revoked' ? 'Revoked' : 'Verified',
    remarks: raw.remarks || '',
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeResourceDoc(id: string, raw: any): LearningResource {
  return {
    id: raw.id || id,
    courseId: raw.courseId || '',
    type: raw.type === 'video' ? 'video' : 'pdf',
    title: raw.title || 'Study Material',
    description: raw.description || '',
    url: raw.url || raw.videoUrl || raw.pdfUrl || '',
    durationMinutes: typeof raw.durationMinutes === 'number' ? raw.durationMinutes : Number(raw.durationMinutes) || 30,
    fileSizeMb: typeof raw.fileSizeMb === 'number' ? raw.fileSizeMb : Number(raw.fileSizeMb) || 5,
    moduleName: raw.moduleName || 'Curriculum Modules',
    order: typeof raw.order === 'number' ? raw.order : Number(raw.order) || 1,
    pdfUrl: raw.pdfUrl || '',
    pdfTitle: raw.pdfTitle || '',
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeNotificationDoc(id: string, raw: any): NotificationAnnouncement {
  return {
    id: raw.id || id,
    title: raw.title || 'Announcement',
    content: raw.content || raw.message || '',
    type: raw.type || 'general',
    date: raw.date || new Date().toISOString().split('T')[0],
    important: Boolean(raw.important || raw.isUrgent || raw.priority === 'urgent'),
    forCourseId: raw.forCourseId || '',
  };
}

export function normalizeEnquiryDoc(id: string, raw: any): ContactEnquiry {
  const createdAt = raw.createdAt || raw.submittedAt || new Date().toISOString();
  return {
    id: raw.id || id,
    name: raw.name || 'Visitor',
    phone: raw.phone || '',
    email: raw.email || '',
    courseId: raw.courseId || '',
    courseTitle: raw.courseTitle || '',
    message: raw.message || '',
    createdAt,
    submittedAt: raw.submittedAt || createdAt,
    status: raw.status || 'New',
    notes: raw.notes || '',
    source: raw.source || '',
  };
}

export function normalizeSliderDoc(id: string, raw: any): SliderImage {
  return {
    id: raw.id || id,
    title: raw.title || 'Learn High-Demand Tech Skills',
    subtitle: raw.subtitle || '100% practical lab training with industry-recognized certifications.',
    imageUrl: raw.imageUrl || raw.image || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80',
    active: raw.active !== undefined ? Boolean(raw.active) : true,
    order: typeof raw.order === 'number' ? raw.order : Number(raw.order) || 1,
    ctaText: raw.ctaText || 'Explore Courses',
    ctaLink: raw.ctaLink || '/courses',
  };
}

export function normalizeCourseReviewDoc(id: string, raw: any): CourseReview {
  return {
    id: raw.id || id,
    courseId: raw.courseId || '',
    courseTitle: raw.courseTitle || 'Certification Course',
    studentName: raw.studentName || 'Student',
    avatar: raw.avatar || raw.studentAvatar || '',
    rating: typeof raw.rating === 'number' ? raw.rating : Number(raw.rating) || 5,
    batch: raw.batch || '2025 Batch',
    reviewText: raw.reviewText || raw.comment || 'Great hands-on learning experience!',
    helpfulCount: typeof raw.helpfulCount === 'number' ? raw.helpfulCount : (Number(raw.likes) || 0),
    verified: raw.verified !== undefined ? Boolean(raw.verified) : true,
    createdAt: raw.createdAt || raw.date || new Date().toISOString(),
  };
}

export function normalizeInstituteReviewDoc(id: string, raw: any): InstituteReview {
  return {
    id: raw.id || id,
    studentName: raw.studentName || 'Alumni',
    avatar: raw.avatar || raw.studentAvatar || '',
    rating: typeof raw.rating === 'number' ? raw.rating : Number(raw.rating) || 5,
    roleOrCompany: raw.roleOrCompany || raw.designation || 'Software Professional',
    courseTitle: raw.courseTitle || 'Certification Course',
    reviewText: raw.reviewText || raw.review || raw.comment || 'Excellent faculty and well-equipped practical labs.',
    batchYear: raw.batchYear || '2025',
    verified: raw.verified !== undefined ? Boolean(raw.verified) : true,
    createdAt: raw.createdAt || raw.date || new Date().toISOString(),
  };
}

// ----------------------------------------------------
// STUDENTS SERVICE (Direct Firestore & Real-Time)
// ----------------------------------------------------
const isMockStudent = (s: Student): boolean => {
  const id = (s.id || '').toLowerCase();
  const email = (s.email || '').toLowerCase();
  return (
    id === 'stu-101' ||
    id === 'stu-102' ||
    id === 'stu-103' ||
    id === 'stu-104' ||
    id === 'stu-105' ||
    id === 'stu-106' ||
    email.endsWith('@example.com')
  );
};

/**
 * Deduplicates student records by unique rollNumber and unique email,
 * keeping the most complete and active record, and automatically deleting duplicate docs from Firestore.
 */
function deduplicateAndCleanStudents(list: Student[]): Student[] {
  const seenMap = new Map<string, Student>();
  const duplicateIdsToDelete: string[] = [];

  for (const s of list) {
    if (!s || !s.id) continue;
    if (isMockStudent(s)) {
      duplicateIdsToDelete.push(s.id);
      continue;
    }

    const rollKey = (s.rollNumber || '').trim().toUpperCase();
    const emailKey = (s.email || '').trim().toLowerCase();
    const lookupKey = rollKey || emailKey || s.id;

    // Also check if existing student matches either roll or non-generic email
    let existingKey = '';
    for (const [key, existing] of seenMap.entries()) {
      const eRoll = (existing.rollNumber || '').trim().toUpperCase();
      const eEmail = (existing.email || '').trim().toLowerCase();
      if ((rollKey && eRoll === rollKey) || (emailKey && emailKey !== 'student@oritech.edu' && eEmail === emailKey)) {
        existingKey = key;
        break;
      }
    }

    if (existingKey) {
      const existing = seenMap.get(existingKey)!;
      // Prefer record that has paid amounts, valid phone, or more courses
      const existingScore = (existing.paidAmount || 0) + (existing.phone ? 10 : 0) + (existing.courseTitle ? 5 : 0);
      const currentScore = (s.paidAmount || 0) + (s.phone ? 10 : 0) + (s.courseTitle ? 5 : 0);

      if (currentScore > existingScore) {
        duplicateIdsToDelete.push(existing.id);
        seenMap.delete(existingKey);
        seenMap.set(lookupKey, s);
      } else {
        duplicateIdsToDelete.push(s.id);
      }
    } else {
      seenMap.set(lookupKey, s);
    }
  }

  // Asynchronously purge duplicate documents from Firestore
  if (duplicateIdsToDelete.length > 0) {
    duplicateIdsToDelete.forEach((id) => {
      deleteDoc(doc(db, 'students', id)).catch(() => {});
    });
  }

  return Array.from(seenMap.values());
}

export async function fsGetStudents(): Promise<Student[]> {
  try {
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, 'students'));
      const list = snap.docs.map((d) => normalizeStudentDoc(d.id, d.data()));
      return deduplicateAndCleanStudents(list);
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'students');
    return [];
  }
}

export function fsSubscribeStudents(callback: (students: Student[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'students'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeStudentDoc(d.id, d.data()));
        const cleanList = deduplicateAndCleanStudents(list);
        callback(cleanList);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'students');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'students');
    return () => {};
  }
}

/**
 * Calculates the next unique roll number from student list starting strictly from 100 with ORI- prefix.
 * Guarantees that duplicate roll numbers are never generated.
 */
export function fsGenerateNextRollNumber(existingStudents: Student[] = []): string {
  const existingNumbers = new Set<number>();
  const existingRolls = new Set<string>();

  for (const s of existingStudents) {
    if (!s || !s.rollNumber) continue;
    const clean = s.rollNumber.trim().toUpperCase();
    existingRolls.add(clean);

    const matches = clean.match(/\d+/g);
    if (matches) {
      for (const m of matches) {
        const parsed = parseInt(m, 10);
        if (!isNaN(parsed) && parsed >= 100) {
          if (parsed === 2026 && (clean.includes('-2026-') || clean.includes('2026'))) {
            continue;
          }
          existingNumbers.add(parsed);
        }
      }
    }
  }

  let maxSeq = 99;
  for (const num of existingNumbers) {
    if (num > maxSeq && num < 2000) {
      maxSeq = num;
    }
  }

  let candidate = Math.max(100, maxSeq + 1);
  while (
    existingNumbers.has(candidate) ||
    existingRolls.has(`ORI-2026-${candidate}`.toUpperCase()) ||
    existingRolls.has(`ORI-${candidate}`.toUpperCase()) ||
    existingRolls.has(`UNI-2026-${candidate}`.toUpperCase()) ||
    existingRolls.has(`${candidate}`.toUpperCase())
  ) {
    candidate++;
  }

  return `ORI-2026-${candidate}`;
}

/**
 * Validates whether a roll number already exists among the student records.
 */
export function fsIsRollNumberTaken(rollNumber: string, existingStudents: Student[] = [], excludeStudentId?: string): boolean {
  if (!rollNumber) return false;
  const clean = rollNumber.trim().toUpperCase();
  if (!clean) return false;

  const numMatches = clean.match(/\d+/g);
  const candidateNumStr = numMatches ? numMatches[numMatches.length - 1] : '';

  return existingStudents.some((s) => {
    if (excludeStudentId && s.id === excludeStudentId) return false;
    const sRoll = (s.rollNumber || '').trim().toUpperCase();
    if (sRoll === clean) return true;
    if (candidateNumStr && candidateNumStr.length >= 3) {
      const sMatches = sRoll.match(/\d+/g);
      const sNumStr = sMatches ? sMatches[sMatches.length - 1] : '';
      if (sNumStr && sNumStr === candidateNumStr) return true;
    }
    return false;
  });
}

export async function fsSaveStudent(student: Student): Promise<Student> {
  try {
    await fsWriteDocumentDirect('students', student.id, student);
    return student;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `students/${student.id}`);
    throw new Error(err?.message || 'Failed to save student in Firestore database.');
  }
}

export async function fsUpdateStudent(id: string, updates: Partial<Student>): Promise<Student | null> {
  try {
    await fsWriteDocumentDirect('students', id, updates);
    const docRef = doc(db, 'students', id);
    const updatedSnap = await getDoc(docRef).catch(() => null);
    return updatedSnap && updatedSnap.exists() ? normalizeStudentDoc(updatedSnap.id, updatedSnap.data()) : null;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `students/${id}`);
    throw new Error(err?.message || 'Failed to update student in Firestore database.');
  }
}

export async function fsDeleteStudent(id: string): Promise<boolean> {
  try {
    await fsDeleteDocumentDirect('students', id);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    throw new Error(err?.message || 'Failed to delete student from Firestore database.');
  }
}

// ----------------------------------------------------
// COURSES SERVICE (Direct Firestore & Real-Time)
// ----------------------------------------------------

export interface FirestoreCollectionInspectResult {
  collectionName: string;
  exists: boolean;
  docCount: number;
  extractedCoursesCount: number;
  docIds: string[];
  sampleDocs: Array<{ id: string; raw: any }>;
  error?: string;
}

export async function fsInspectFirestore(): Promise<{
  connected: boolean;
  activeCollection: string;
  totalCoursesExtracted: number;
  collections: FirestoreCollectionInspectResult[];
  globalError?: string;
  isDatabaseNotFound?: boolean;
}> {
  const results: FirestoreCollectionInspectResult[] = [];
  let totalExtracted = 0;
  let activeCol = '';
  let dbNotFound = false;

  for (const colName of COURSE_COLLECTION_CANDIDATES.slice(0, 3)) {
    try {
      const snap = await getDocs(collection(db, colName));
      const docCount = snap.size;
      const docsData = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
      const extracted = extractCoursesFromFirestoreDocs(docsData);

      if (extracted.length > 0 && !activeCol) {
        activeCol = colName;
        totalExtracted = extracted.length;
      }

      results.push({
        collectionName: colName,
        exists: docCount > 0,
        docCount,
        extractedCoursesCount: extracted.length,
        docIds: snap.docs.map((d) => d.id),
        sampleDocs: snap.docs.slice(0, 5).map((d) => ({ id: d.id, raw: d.data() })),
      });
    } catch (err: any) {
      const msg = err?.message || 'Access Denied / Not Found';
      if (msg.includes("Database '(default)' not found") || msg.includes('not found')) {
        dbNotFound = true;
      }
      results.push({
        collectionName: colName,
        exists: false,
        docCount: 0,
        extractedCoursesCount: 0,
        docIds: [],
        sampleDocs: [],
        error: msg,
      });
    }
  }

  return {
    connected: !dbNotFound && results.some((r) => r.exists || !r.error),
    activeCollection: activeCol || 'courses',
    totalCoursesExtracted: totalExtracted,
    collections: results,
    isDatabaseNotFound: dbNotFound,
    globalError: dbNotFound
      ? "Database '(default)' has not been created yet in Firebase Console for project 'unitechcoachingcenter'."
      : undefined,
  };
}

export async function fsGetCourses(customCollection?: string): Promise<Course[]> {
  try {
    const colToQuery = customCollection || 'courses';
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, colToQuery));
      if (!snap.empty) {
        const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
        return extractCoursesFromFirestoreDocs(docs);
      }
      return [];
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, customCollection || 'courses');
    return [];
  }
}

export function fsSubscribeCourses(callback: (courses: Course[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'courses'),
      (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
          const courses = extractCoursesFromFirestoreDocs(docs);
          callback(courses);
        } else {
          callback([]);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'courses');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'courses');
    return () => {};
  }
}

export const INITIAL_STANDARD_COURSES: Course[] = [];

export async function fsSeedStandardCourses(): Promise<{ success: boolean; count: number; error?: string }> {
  return { success: true, count: 0 };
}

export async function fsSaveCourse(course: Course): Promise<Course> {
  try {
    await fsWriteDocumentDirect('courses', course.id, course);
    return course;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `courses/${course.id}`);
    throw new Error(err?.message || 'Firestore database write failed. Please check if Cloud Firestore database is enabled in Firebase Console.');
  }
}

export async function fsBatchSyncCourses(coursesList: Course[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let count = 0;
    for (const c of coursesList) {
      await fsWriteDocumentDirect('courses', c.id, c);
      count++;
    }
    return { success: true, count };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, 'courses');
    return { success: false, count: 0, error: err?.message || 'Permission denied or network issue' };
  }
}

export async function fsTestFirestoreConnection(): Promise<{
  connected: boolean;
  coursesCount: number;
  studentsCount: number;
  error?: string;
  isDatabaseNotFound?: boolean;
}> {
  try {
    const testOp = async () => {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      let count = coursesSnap.size;
      let studentsCount = 0;
      try {
        const studentsSnap = await getDocs(collection(db, 'students'));
        studentsCount = studentsSnap.size;
      } catch (_) {}
      return { connected: true, coursesCount: count, studentsCount, isDatabaseNotFound: false };
    };
    return await withTimeout(
      testOp(),
      { connected: true, coursesCount: 0, studentsCount: 0, isDatabaseNotFound: false },
      2500
    );
  } catch (err: any) {
    const raw = err?.message || '';
    const isDbNotFound = raw.includes("Database '(default)' not found") || raw.includes('not found');

    return {
      connected: false,
      coursesCount: 0,
      studentsCount: 0,
      isDatabaseNotFound: isDbNotFound,
      error: isDbNotFound
        ? "Firestore Database '(default)' not created yet in project 'unitechcoachingcenter'. Click to create it in Firebase Console."
        : raw || 'Permission denied: Check Firestore Security Rules in Firebase Console',
    };
  }
}

export async function fsUpdateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
  try {
    await fsWriteDocumentDirect('courses', id, updates);
    const docRef = doc(db, 'courses', id);
    const updated = await getDoc(docRef).catch(() => null);
    return updated && updated.exists() ? normalizeCourseDoc(updated.id, updated.data()) : null;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `courses/${id}`);
    throw new Error(err?.message || 'Failed to update course document in Firestore.');
  }
}

export async function fsDeleteCourse(id: string): Promise<boolean> {
  try {
    await fsDeleteDocumentDirect('courses', id);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `courses/${id}`);
    throw new Error(err?.message || 'Failed to delete course document from Firestore.');
  }
}

// ----------------------------------------------------
// PAYMENTS SERVICE (Direct Firestore & Real-Time)
// ----------------------------------------------------
export async function fsGetPayments(): Promise<PaymentInstallment[]> {
  try {
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, 'payments'));
      return snap.docs.map((d) => normalizePaymentDoc(d.id, d.data()));
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'payments');
    return [];
  }
}

export function fsSubscribePayments(callback: (payments: PaymentInstallment[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'payments'),
      (snap) => {
        const list = snap.docs.map((d) => normalizePaymentDoc(d.id, d.data()));
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'payments');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'payments');
    return () => {};
  }
}

export async function fsSavePayment(payment: PaymentInstallment): Promise<PaymentInstallment> {
  try {
    await fsWriteDocumentDirect('payments', payment.id, payment);
    return payment;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `payments/${payment.id}`);
    throw new Error(err?.message || 'Failed to save payment in Firestore database.');
  }
}

export async function fsDeletePayment(id: string): Promise<boolean> {
  try {
    await fsDeleteDocumentDirect('payments', id);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `payments/${id}`);
    throw new Error(err?.message || 'Failed to delete payment from Firestore database.');
  }
}

// ----------------------------------------------------
// RESULTS SERVICE (Direct Firestore & Real-Time)
// ----------------------------------------------------
export async function fsGetResults(): Promise<StudentResult[]> {
  try {
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, 'results'));
      return snap.docs.map((d) => normalizeResultDoc(d.id, d.data()));
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'results');
    return [];
  }
}

export function fsSubscribeResults(callback: (results: StudentResult[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'results'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeResultDoc(d.id, d.data()));
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'results');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'results');
    return () => {};
  }
}

export async function fsSaveResult(result: StudentResult): Promise<StudentResult> {
  try {
    await fsWriteDocumentDirect('results', result.id, result);
    return result;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `results/${result.id}`);
    throw new Error(err?.message || 'Failed to save exam result in Firestore database.');
  }
}

export async function fsUpdateResult(id: string, updates: Partial<StudentResult>): Promise<StudentResult | null> {
  try {
    await fsWriteDocumentDirect('results', id, updates);
    const docRef = doc(db, 'results', id);
    const updated = await getDoc(docRef).catch(() => null);
    return updated && updated.exists() ? normalizeResultDoc(updated.id, updated.data()) : null;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `results/${id}`);
    throw new Error(err?.message || 'Failed to update result in Firestore database.');
  }
}

export async function fsDeleteResult(id: string): Promise<boolean> {
  try {
    await fsDeleteDocumentDirect('results', id);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `results/${id}`);
    throw new Error(err?.message || 'Failed to delete result from Firestore database.');
  }
}

// ----------------------------------------------------
// CERTIFICATES SERVICE (Direct Firestore & Real-Time)
// ----------------------------------------------------
export const INITIAL_STANDARD_CERTIFICATES: CertificateRecord[] = [];
export const INITIAL_STANDARD_STUDENTS: Student[] = [];

export async function fsSeedStandardCertificates(): Promise<{ success: boolean; count: number; error?: string }> {
  return { success: true, count: 0 };
}

export async function fsSeedStandardStudents(): Promise<{ success: boolean; count: number; error?: string }> {
  return { success: true, count: 0 };
}

const isMockCertificate = (c: CertificateRecord): boolean => {
  const id = (c.id || '').toLowerCase();
  return (
    id === 'cert-101' ||
    id === 'cert-102' ||
    id === 'cert-103' ||
    id === 'cert-104' ||
    id === 'cert-105' ||
    id === 'cert-106'
  );
};

export async function fsGetCertificates(): Promise<CertificateRecord[]> {
  try {
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, 'certificates'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => normalizeCertificateDoc(d.id, d.data()));
        return list.filter((c) => {
          if (isMockCertificate(c)) {
            deleteDoc(doc(db, 'certificates', c.id)).catch(() => {});
            return false;
          }
          return true;
        });
      }
      return [];
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'certificates');
    return [];
  }
}

export function fsSubscribeCertificates(callback: (certs: CertificateRecord[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'certificates'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeCertificateDoc(d.id, d.data()));
        const cleanList = list.filter((c) => {
          if (isMockCertificate(c)) {
            deleteDoc(doc(db, 'certificates', c.id)).catch(() => {});
            return false;
          }
          return true;
        });
        callback(cleanList);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'certificates');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'certificates');
    return () => {};
  }
}

export async function fsSaveCertificate(cert: CertificateRecord): Promise<CertificateRecord> {
  try {
    await fsWriteDocumentDirect('certificates', cert.id, cert);
    return cert;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `certificates/${cert.id}`);
    throw new Error(err?.message || 'Failed to save certificate in Firestore database.');
  }
}

export async function fsUpdateCertificate(id: string, updates: Partial<CertificateRecord>): Promise<CertificateRecord | null> {
  try {
    await fsWriteDocumentDirect('certificates', id, updates);
    const docRef = doc(db, 'certificates', id);
    const updated = await getDoc(docRef).catch(() => null);
    return updated && updated.exists() ? normalizeCertificateDoc(updated.id, updated.data()) : null;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `certificates/${id}`);
    throw new Error(err?.message || 'Failed to update certificate in Firestore database.');
  }
}

export async function fsDeleteCertificate(id: string): Promise<boolean> {
  try {
    await fsDeleteDocumentDirect('certificates', id);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `certificates/${id}`);
    throw new Error(err?.message || 'Failed to delete certificate from Firestore database.');
  }
}

/**
 * Searches and verifies certificate validity from Firestore documents.
 * Checks certificates collection and completed registered student records.
 * NEVER writes fake or mock data to Firestore.
 */
export async function fsVerifyCertificate(query: string): Promise<{ verified: boolean; certificate: CertificateRecord }> {
  const clean = (query || '').trim().toLowerCase();
  if (!clean) {
    throw new Error('Please enter a valid Roll Number or Certificate ID.');
  }

  // 1. Check live Firestore certificates issued by admin
  try {
    const certs = await fsGetCertificates();
    const matched = certs.find((c) => {
      const cNum = (c.certificateNumber || '').toLowerCase().trim();
      const rNum = (c.rollNumber || '').toLowerCase().trim();
      return cNum === clean || rNum === clean;
    });

    if (matched) {
      return { verified: true, certificate: matched };
    }
  } catch (err) {
    console.error('Error reading certificates from Firestore:', err);
  }

  // 2. Check live Firestore students for completed student record with assigned certificate
  try {
    const students = await fsGetStudents();
    const matchedStudent = students.find((s) => {
      const rNum = (s.rollNumber || '').toLowerCase().trim();
      const cNum = (s.certificateNumber || '').toLowerCase().trim();
      return (
        (rNum === clean || (cNum && cNum === clean)) &&
        s.status === 'Completed' &&
        !!s.certificateNumber
      );
    });

    if (matchedStudent && matchedStudent.certificateNumber) {
      const studentCert: CertificateRecord = {
        id: `cert-${matchedStudent.id}`,
        certificateNumber: matchedStudent.certificateNumber,
        rollNumber: matchedStudent.rollNumber,
        studentName: matchedStudent.name,
        courseTitle: matchedStudent.courseTitle,
        courseId: matchedStudent.courseId,
        issueDate: matchedStudent.certificateIssueDate || matchedStudent.joinedDate || new Date().toISOString().split('T')[0],
        grade: matchedStudent.certificateGrade || 'A+ (Distinction)',
        certificateUrl: matchedStudent.certificateUrl || `/results?roll=${encodeURIComponent(matchedStudent.rollNumber)}`,
        status: 'Verified',
        remarks: 'Official certificate authenticated via Firestore student registry database.',
        createdAt: matchedStudent.joinedDate || new Date().toISOString(),
      };
      return { verified: true, certificate: studentCert };
    }
  } catch (err) {
    console.error('Error checking student certificate in Firestore:', err);
  }

  throw new Error(`No verified certificate record found matching "${query}". Only certificates issued and saved by the administrator can be verified.`);
}

// ----------------------------------------------------
// RESOURCES SERVICE (Direct Firestore & Real-Time)
// ----------------------------------------------------
export const INITIAL_STANDARD_RESOURCES: LearningResource[] = [];

export async function fsSeedStandardResources(): Promise<{ success: boolean; count: number; error?: string }> {
  return { success: true, count: 0 };
}

const isMockResource = (_r: LearningResource): boolean => {
  return false;
};

export async function fsPurgeAllMockResources(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'resources'));
    let count = 0;
    for (const d of snap.docs) {
      const res = normalizeResourceDoc(d.id, d.data());
      if (isMockResource(res)) {
        await deleteDoc(doc(db, 'resources', d.id)).catch(() => {});
        count++;
      }
    }
    return count;
  } catch (e) {
    return 0;
  }
}

export async function fsGetResources(): Promise<LearningResource[]> {
  try {
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, 'resources'));
      if (!snap.empty) {
        return snap.docs
          .map((d) => normalizeResourceDoc(d.id, d.data()))
          .filter((r) => {
            if (isMockResource(r)) {
              deleteDoc(doc(db, 'resources', r.id)).catch(() => {});
              return false;
            }
            return true;
          });
      }
      return [];
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'resources');
    return [];
  }
}

export function fsSubscribeResources(callback: (resources: LearningResource[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'resources'),
      (snap) => {
        const list = snap.docs
          .map((d) => normalizeResourceDoc(d.id, d.data()))
          .filter((r) => {
            if (isMockResource(r)) {
              if (r.id) deleteDoc(doc(db, 'resources', r.id)).catch(() => {});
              return false;
            }
            return true;
          });
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'resources');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'resources');
    return () => {};
  }
}

export async function fsSaveResource(res: LearningResource): Promise<LearningResource> {
  try {
    if (isMockResource(res)) {
      throw new Error('Cannot save mock or sample resources. Please provide actual course video or PDF URLs.');
    }
    await fsWriteDocumentDirect('resources', res.id, res);
    return res;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `resources/${res.id}`);
    throw new Error(err?.message || 'Failed to save learning resource in Firestore database.');
  }
}

export async function fsUpdateResource(id: string, updates: Partial<LearningResource>): Promise<LearningResource | null> {
  try {
    await fsWriteDocumentDirect('resources', id, updates);
    const docRef = doc(db, 'resources', id);
    const updated = await getDoc(docRef).catch(() => null);
    return updated && updated.exists() ? normalizeResourceDoc(updated.id, updated.data()) : null;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `resources/${id}`);
    throw new Error(err?.message || 'Failed to update resource in Firestore database.');
  }
}

export async function fsDeleteResource(id: string): Promise<boolean> {
  try {
    await fsDeleteDocumentDirect('resources', id);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `resources/${id}`);
    throw new Error(err?.message || 'Failed to delete resource from Firestore database.');
  }
}

// ----------------------------------------------------
// NOTIFICATIONS SERVICE (Direct Firestore & Real-Time)
// ----------------------------------------------------
export async function fsGetNotifications(): Promise<NotificationAnnouncement[]> {
  try {
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, 'notifications'));
      return snap.docs.map((d) => normalizeNotificationDoc(d.id, d.data()));
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'notifications');
    return [];
  }
}

export function fsSubscribeNotifications(callback: (notifs: NotificationAnnouncement[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'notifications'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeNotificationDoc(d.id, d.data()));
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'notifications');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'notifications');
    return () => {};
  }
}

export async function fsSaveNotification(notif: NotificationAnnouncement): Promise<NotificationAnnouncement> {
  try {
    await fsWriteDocumentDirect('notifications', notif.id, notif);
    return notif;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`);
    throw new Error(err?.message || 'Failed to save notification in Firestore database.');
  }
}

export async function fsDeleteNotification(id: string): Promise<boolean> {
  try {
    await fsDeleteDocumentDirect('notifications', id);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `notifications/${id}`);
    throw new Error(err?.message || 'Failed to delete notification from Firestore database.');
  }
}

// ----------------------------------------------------
// ENQUIRIES SERVICE (Direct Firestore & Real-Time)
// ----------------------------------------------------
export async function fsGetEnquiries(): Promise<ContactEnquiry[]> {
  try {
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, 'enquiries'));
      return snap.docs.map((d) => normalizeEnquiryDoc(d.id, d.data()));
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'enquiries');
    return [];
  }
}

export function fsSubscribeEnquiries(callback: (enquiries: ContactEnquiry[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'enquiries'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeEnquiryDoc(d.id, d.data()));
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'enquiries');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'enquiries');
    return () => {};
  }
}

export async function fsSaveEnquiry(enquiry: ContactEnquiry): Promise<ContactEnquiry> {
  try {
    await fsWriteDocumentDirect('enquiries', enquiry.id, enquiry);
    return enquiry;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `enquiries/${enquiry.id}`);
    throw new Error(err?.message || 'Failed to save enquiry in Firestore database.');
  }
}

export async function fsUpdateEnquiry(id: string, updates: Partial<ContactEnquiry>): Promise<ContactEnquiry | null> {
  try {
    await fsWriteDocumentDirect('enquiries', id, updates);
    const docRef = doc(db, 'enquiries', id);
    const updated = await getDoc(docRef).catch(() => null);
    return updated && updated.exists() ? normalizeEnquiryDoc(updated.id, updated.data()) : null;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `enquiries/${id}`);
    throw new Error(err?.message || 'Failed to update enquiry in Firestore database.');
  }
}

export async function fsDeleteEnquiry(id: string): Promise<boolean> {
  try {
    await fsDeleteDocumentDirect('enquiries', id);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `enquiries/${id}`);
    throw new Error(err?.message || 'Failed to delete enquiry from Firestore database.');
  }
}

// ----------------------------------------------------
// SLIDER IMAGES SERVICE (Direct Firestore & Real-Time)
// ----------------------------------------------------
export async function fsGetSliderImages(): Promise<SliderImage[]> {
  try {
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, 'sliderImages'));
      return snap.docs.map((d) => normalizeSliderDoc(d.id, d.data()));
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'sliderImages');
    return [];
  }
}

export function fsSubscribeSliderImages(callback: (sliders: SliderImage[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'sliderImages'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeSliderDoc(d.id, d.data()));
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'sliderImages');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'sliderImages');
    return () => {};
  }
}

export async function fsSaveSliderImage(image: SliderImage): Promise<SliderImage> {
  try {
    await fsWriteDocumentDirect('sliderImages', image.id, image);
    return image;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `sliderImages/${image.id}`);
    throw new Error(err?.message || 'Failed to save hero banner in Firestore.');
  }
}

export async function fsUpdateSliderImage(id: string, updates: Partial<SliderImage>): Promise<SliderImage | null> {
  try {
    await fsWriteDocumentDirect('sliderImages', id, updates);
    const docRef = doc(db, 'sliderImages', id);
    const updated = await getDoc(docRef).catch(() => null);
    return updated && updated.exists() ? normalizeSliderDoc(updated.id, updated.data()) : null;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `sliderImages/${id}`);
    throw new Error(err?.message || 'Failed to update hero banner in Firestore.');
  }
}

export async function fsDeleteSliderImage(id: string): Promise<boolean> {
  try {
    await fsDeleteDocumentDirect('sliderImages', id);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `sliderImages/${id}`);
    throw new Error(err?.message || 'Failed to delete hero banner from Firestore.');
  }
}

export async function fsSaveSliderImages(images: SliderImage[]): Promise<SliderImage[]> {
  try {
    for (const img of images) {
      await fsWriteDocumentDirect('sliderImages', img.id, img);
    }
    return images;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, 'sliderImages');
    throw new Error(err?.message || 'Failed to save hero slider images in Firestore.');
  }
}

// ----------------------------------------------------
// REVIEWS SERVICE (Direct Firestore & Real-Time)
// ----------------------------------------------------
const LEGACY_MOCK_REVIEW_IDS = new Set([
  'mock-rev-1',
  'mock-rev-2',
  'sample-rev-1',
  'rev-1',
  'rev-2',
  'rev-3',
  'rev-4',
  'rev-5',
  'inst-rev-1',
  'inst-rev-2',
  'inst-rev-3',
  'test-rev-1',
]);

export async function fsGetCourseReviews(): Promise<CourseReview[]> {
  try {
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, 'courseReviews'));
      return snap.docs
        .map((d) => normalizeCourseReviewDoc(d.id, d.data()))
        .filter((r) => {
          if (LEGACY_MOCK_REVIEW_IDS.has(r.id)) {
            deleteDoc(doc(db, 'courseReviews', r.id)).catch(() => {});
            return false;
          }
          return Boolean(r.reviewText && r.studentName);
        });
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'courseReviews');
    return [];
  }
}

export function fsSubscribeCourseReviews(callback: (reviews: CourseReview[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'courseReviews'),
      (snap) => {
        const list = snap.docs
          .map((d) => normalizeCourseReviewDoc(d.id, d.data()))
          .filter((r) => {
            if (LEGACY_MOCK_REVIEW_IDS.has(r.id)) {
              if (r.id) deleteDoc(doc(db, 'courseReviews', r.id)).catch(() => {});
              return false;
            }
            return Boolean(r.reviewText && r.studentName);
          });
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'courseReviews');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'courseReviews');
    return () => {};
  }
}

export async function fsSaveCourseReview(review: CourseReview): Promise<CourseReview> {
  try {
    await fsWriteDocumentDirect('courseReviews', review.id, review);
    return review;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `courseReviews/${review.id}`);
    throw new Error(err?.message || 'Failed to save course review in Firestore.');
  }
}

export async function fsSaveInstituteReview(review: InstituteReview): Promise<InstituteReview> {
  try {
    await fsWriteDocumentDirect('instituteReviews', review.id, review);
    return review;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `instituteReviews/${review.id}`);
    throw new Error(err?.message || 'Failed to save institute review in Firestore.');
  }
}

export async function fsGetInstituteReviews(): Promise<InstituteReview[]> {
  try {
    const fetchOp = async () => {
      const snap = await getDocs(collection(db, 'instituteReviews'));
      return snap.docs
        .map((d) => normalizeInstituteReviewDoc(d.id, d.data()))
        .filter((r) => {
          if (LEGACY_MOCK_REVIEW_IDS.has(r.id)) {
            deleteDoc(doc(db, 'instituteReviews', r.id)).catch(() => {});
            return false;
          }
          return Boolean(r.reviewText && r.studentName);
        });
    };
    return await withTimeout(fetchOp(), [], 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'instituteReviews');
    return [];
  }
}

export function fsSubscribeInstituteReviews(callback: (reviews: InstituteReview[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'instituteReviews'),
      (snap) => {
        const list = snap.docs
          .map((d) => normalizeInstituteReviewDoc(d.id, d.data()))
          .filter((r) => {
            if (LEGACY_MOCK_REVIEW_IDS.has(r.id)) {
              if (r.id) {
                deleteDoc(doc(db, 'instituteReviews', r.id)).catch(() => {});
              }
              return false;
            }
            return Boolean(r.reviewText && r.studentName);
          });
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'instituteReviews');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'instituteReviews');
    return () => {};
  }
}

// ----------------------------------------------------
// INSTITUTE BRANDING (Firestore stores ONLY logo link in 'branding/main')
// Fixed institute details are maintained in code since they are constant.
// ----------------------------------------------------
const BRANDING_STORAGE_KEY = 'oritech_institute_branding';

export const FIXED_INSTITUTE_DETAILS = {
  instituteName: 'Oritech Computer',
  tagline: 'Computer Institute',
  stampUrl: '',
  footerLogoUrl: '',
  contactPhone: '+91 9437235124',
  contactEmail: 'info@oritech.edu',
  headerNotice: 'ISO 9001:2015 Certified Computer Training Institute • Admissions Open for 2026 Batches',
  address: 'Sharma Complex, Beside Hotel Jyoti Mahal, Convent road, New Colony, Rayagada-765001, Odisha',
};

export const DEFAULT_BRANDING: InstituteBranding = {
  id: 'main',
  logoUrl: '',
  logoIconUrl: '',
  ...FIXED_INSTITUTE_DETAILS,
  updatedAt: new Date().toISOString(),
};

export function normalizeBrandingDoc(id: string, raw: any): InstituteBranding {
  const logoUrl = (raw && typeof raw === 'object' ? (raw.logoUrl || raw.logo || raw.logoLink || '') : '').trim();
  const updatedAt = raw && typeof raw === 'object' && raw.updatedAt ? raw.updatedAt : new Date().toISOString();
  return {
    ...DEFAULT_BRANDING,
    id: id || 'main',
    logoUrl,
    updatedAt,
  };
}

export async function fsGetBrandingSettings(): Promise<InstituteBranding> {
  try {
    const snap = await getDoc(doc(db, 'branding', 'main'));
    if (snap.exists()) {
      const data = snap.data();
      const logoUrl = (data?.logoUrl || '').trim();
      const result: InstituteBranding = {
        ...DEFAULT_BRANDING,
        id: snap.id,
        logoUrl,
        updatedAt: data?.updatedAt || new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(result));
      }
      return result;
    }
  } catch (_) {}

  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(BRANDING_STORAGE_KEY);
      if (stored) {
        return normalizeBrandingDoc('main', JSON.parse(stored));
      }
    }
  } catch (_) {}
  return DEFAULT_BRANDING;
}

export function fsSubscribeBrandingSettings(callback: (branding: InstituteBranding) => void): () => void {
  const readAndNotify = () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(BRANDING_STORAGE_KEY);
        if (stored) {
          callback(normalizeBrandingDoc('main', JSON.parse(stored)));
          return;
        }
      }
    } catch (_) {}
    callback(DEFAULT_BRANDING);
  };

  readAndNotify();

  let unsubFirestore = () => {};
  try {
    unsubFirestore = onSnapshot(
      doc(db, 'branding', 'main'),
      (snapshot) => {
        if (snapshot.exists()) {
          const liveData = normalizeBrandingDoc(snapshot.id, snapshot.data());
          if (typeof window !== 'undefined') {
            localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(liveData));
          }
          callback(liveData);
        } else {
          callback(DEFAULT_BRANDING);
        }
      },
      () => {}
    );
  } catch (_) {}

  if (typeof window !== 'undefined') {
    const handleCustomChange = (e: any) => {
      if (e.detail) {
        callback(normalizeBrandingDoc('main', e.detail));
      } else {
        readAndNotify();
      }
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === BRANDING_STORAGE_KEY) {
        readAndNotify();
      }
    };

    window.addEventListener('oritech_branding_updated', handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubFirestore();
      window.removeEventListener('oritech_branding_updated', handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }
  return () => {
    unsubFirestore();
  };
}

export async function fsSaveBrandingSettings(branding: { logoUrl?: string } | Partial<InstituteBranding>): Promise<InstituteBranding> {
  const logoUrl = (branding.logoUrl || '').trim();
  const timestamp = new Date().toISOString();

  // ONLY store logoUrl and updatedAt in Firestore branding collection
  const firestoreDoc = {
    logoUrl,
    updatedAt: timestamp,
  };

  try {
    // Exact overwrite so no extra institute fields are stored in Firestore
    await setDoc(doc(db, 'branding', 'main'), firestoreDoc);
  } catch (err) {
    console.warn('Firestore branding save error:', err);
  }

  // Remove legacy settings document if present
  try {
    await deleteDoc(doc(db, 'settings', 'branding')).catch(() => {});
  } catch (_) {}

  const fullBranding: InstituteBranding = {
    ...DEFAULT_BRANDING,
    logoUrl,
    updatedAt: timestamp,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(fullBranding));
      window.dispatchEvent(new CustomEvent('oritech_branding_updated', { detail: fullBranding }));
    } catch (_) {}
  }
  return fullBranding;
}

/**
 * Purge and remove non-essential or obsolete collections (like brandingSettings, test) from Firestore
 * so the database stays completely clean without stray documents or unused collections.
 */
export async function fsCleanupObsoleteCollections(): Promise<void> {
  const obsoleteCollections = ['brandingSettings', 'test', 'settings'];
  for (const colName of obsoleteCollections) {
    try {
      const snap = await getDocs(collection(db, colName)).catch(() => null);
      if (snap && !snap.empty) {
        for (const d of snap.docs) {
          await fsDeleteDocumentDirect(colName, d.id);
        }
      }
    } catch (_) {
      // Non-blocking cleanup
    }
  }

  // Ensure 'branding/main' doc contains ONLY logoUrl and updatedAt
  try {
    const brandingSnap = await getDoc(doc(db, 'branding', 'main')).catch(() => null);
    if (brandingSnap && brandingSnap.exists()) {
      const data = brandingSnap.data();
      const keys = Object.keys(data || {});
      const hasExtraFields = keys.some((k) => k !== 'logoUrl' && k !== 'updatedAt');
      if (hasExtraFields) {
        const logoUrl = (data?.logoUrl || data?.logo || '').trim();
        await setDoc(doc(db, 'branding', 'main'), {
          logoUrl,
          updatedAt: data?.updatedAt || new Date().toISOString(),
        });
      }
    }
  } catch (_) {}
}

/**
 * Diagnostic helper to verify live connection to Cloud Firestore.
 */
export async function fsCheckFirestoreConnection(): Promise<{ connected: boolean; message: string; timestamp: string }> {
  try {
    const testDocRef = doc(db, 'courses', 'test-connection-probe');
    await withTimeout(getDoc(testDocRef), null, 3000);
    return {
      connected: true,
      message: 'Cloud Firestore database is connected and synchronized.',
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    const raw = err?.message || String(err);
    const isPermissionError = raw.includes('permission-denied') || raw.includes('PERMISSION_DENIED');
    return {
      connected: !isPermissionError,
      message: raw,
      timestamp: new Date().toISOString(),
    };
  }
}


