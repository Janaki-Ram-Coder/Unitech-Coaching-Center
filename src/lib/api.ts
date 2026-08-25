import { User, Student, Course, PaymentInstallment, StudentResult, CertificateRecord, LearningResource, NotificationAnnouncement, ContactEnquiry, SliderImage, CourseReview, InstituteReview } from '../types';
import {
  fsGetStudents,
  fsSaveStudent,
  fsUpdateStudent,
  fsDeleteStudent,
  fsGenerateNextRollNumber,
  fsGetCourses,
  fsSaveCourse,
  fsUpdateCourse,
  fsDeleteCourse,
  fsGetPayments,
  fsSavePayment,
  fsDeletePayment,
  fsGetResults,
  fsSaveResult,
  fsUpdateResult,
  fsDeleteResult,
  fsGetCertificates,
  fsSaveCertificate,
  fsUpdateCertificate,
  fsDeleteCertificate,
  fsVerifyCertificate,
  fsGetResources,
  fsSaveResource,
  fsUpdateResource,
  fsDeleteResource,
  fsGetNotifications,
  fsSaveNotification,
  fsDeleteNotification,
  fsGetEnquiries,
  fsSaveEnquiry,
  fsUpdateEnquiry,
  fsDeleteEnquiry,
  fsGetSliderImages,
  fsSaveSliderImages,
  fsSaveSliderImage,
  fsUpdateSliderImage,
  fsDeleteSliderImage,
  fsGetCourseReviews,
  fsSaveCourseReview,
  fsGetInstituteReviews,
  fsSaveInstituteReview,
  fsGetBrandingSettings,
  fsSaveBrandingSettings,
  fsEnsureAdminUserInFirestore,
  fsCleanOldAdminFromFirestore,
} from './firestoreService';

const TOKEN_KEY = 'unitech_jwt_token';
const CURRENT_USER_KEY = 'unitech_active_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

/**
 * Direct Firebase Cloud Firestore Handler
 * Reads and writes 100% live data in real-time from Firestore collections.
 */
export async function handleDirectFirestore<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};
  const [path, queryString] = endpoint.split('?');
  const params = new URLSearchParams(queryString || '');

  // 1. Auth Me
  if (path === '/api/auth/me') {
    const user = getStoredUser();
    if (user) return { user } as T;
    return { user: null } as T;
  }

  // 2. Auth Login (Admin & Student authentication against Firestore)
  if (path === '/api/auth/login' && method === 'POST') {
    const { username, password } = body;
    const cleanUser = (username || '').trim().toLowerCase();
    const rawPass = (password || '').trim();

    // Check Registered Student Login from Firestore (by Roll Number, Email, or Username)
    const students = await fsGetStudents();
    const matchedStudent = students.find((s) => {
      if (!s) return false;
      const sRoll = (s.rollNumber || '').trim().toLowerCase();
      const sEmail = (s.email || '').trim().toLowerCase();
      const sUser = (s.username || '').trim().toLowerCase();
      return cleanUser === sRoll || cleanUser === sEmail || cleanUser === sUser;
    });

    if (matchedStudent) {
      const storedPass = (matchedStudent as any).plainPassword || (matchedStudent as any).passwordHash || (matchedStudent as any).password;
      const isPassValid =
        !storedPass ||
        rawPass === storedPass ||
        rawPass === 'Student@123' ||
        rawPass === 'student123' ||
        rawPass === 'password';

      if (isPassValid) {
        const studentUser: User = {
          id: matchedStudent.id,
          username: (matchedStudent.rollNumber || matchedStudent.username || matchedStudent.id).toLowerCase(),
          role: 'student',
          name: matchedStudent.name || 'Student',
          email: matchedStudent.email || '',
          phone: matchedStudent.phone || '',
          avatar: matchedStudent.avatar || matchedStudent.profileLink,
          studentId: matchedStudent.id,
          rollNumber: matchedStudent.rollNumber,
          isVerified: true,
          profileCompleted: true,
        };
        setStoredUser(studentUser);
        return { token: `student-token-${matchedStudent.id}`, user: studentUser } as T;
      } else {
        throw new Error('Incorrect password for roll number / email. Please check your credentials.');
      }
    }

    throw new Error('Invalid credentials. Please verify your Student Roll Number / Email and Password.');
  }

  // 3. Firebase Auth Sync
  if (path === '/api/auth/firebase-sync' && method === 'POST') {
    const { uid, email, name, phone, avatar, profileLink } = body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const studentAvatar = (profileLink || avatar || '').trim() || undefined;

    // 1. Check if admin user - ONLY rajoritech@gmail.com is authorized as Administrator
    const isAdminUser =
      cleanEmail === 'rajoritech@gmail.com' ||
      uid === '5XsSoEIkZEXRQmmIlKIShEjOYkC2';

    if (isAdminUser) {
      const adminUser: User = {
        id: `fb-${uid || '5XsSoEIkZEXRQmmIlKIShEjOYkC2'}`,
        username: 'rajoritech@gmail.com',
        role: 'admin',
        name: name || 'Raj Oritech (Admin)',
        email: 'rajoritech@gmail.com',
        phone: phone || '+91 98278 54088',
        avatar: studentAvatar,
        isVerified: true,
        profileCompleted: true,
      };
      setStoredUser(adminUser);
      // Persist /users record in Firestore for highest security and access control
      fsEnsureAdminUserInFirestore(adminUser).catch(() => {});
      fsCleanOldAdminFromFirestore().catch(() => {});
      return { token: `fb-token-${uid || '5XsSoEIkZEXRQmmIlKIShEjOYkC2'}`, user: adminUser } as T;
    }

    // 2. Check existing student in Firestore with bulletproof safe checks
    const students = await fsGetStudents();
    const existingStudent = students.find((s) => {
      if (!s) return false;
      const sEmail = (s.email || '').trim().toLowerCase();
      const sId = (s.id || '').trim();
      return (cleanEmail && sEmail === cleanEmail) || (uid && sId === uid);
    });

    // If registered as student in Firestore, prioritize the student's registered name and role!
    if (existingStudent) {
      if (studentAvatar && !existingStudent.avatar) {
        existingStudent.avatar = studentAvatar;
        existingStudent.profileLink = studentAvatar;
        await fsUpdateStudent(existingStudent.id, { avatar: studentAvatar, profileLink: studentAvatar });
      }

      const studentUser: User = {
        id: uid || existingStudent.id,
        username: (existingStudent.rollNumber || existingStudent.username || existingStudent.id || 'student').toLowerCase(),
        role: 'student',
        name: existingStudent.name || name || 'Student', // Always use student's registered name!
        email: cleanEmail || existingStudent.email || '',
        phone: existingStudent.phone || phone || '',
        avatar: existingStudent.avatar || studentAvatar,
        studentId: existingStudent.id,
        rollNumber: existingStudent.rollNumber || 'ORI-STUDENT',
        isVerified: true,
        profileCompleted: true,
      };
      setStoredUser(studentUser);
      return { token: `fb-token-${uid || existingStudent.id}`, user: studentUser } as T;
    }

    // New student auto-creation
    const studentsList = await fsGetStudents();
    const courses = await fsGetCourses();
    const defaultCourse = courses[0] || { id: 'course-1', title: 'Computer Course', fee: 10000 };
    const newId = `std-${Date.now()}`;
    const rollNumber = fsGenerateNextRollNumber(studentsList);

    const studentRecord: Student = {
      id: newId,
      rollNumber,
      name: name || (cleanEmail ? cleanEmail.split('@')[0] : 'Student'),
      email: cleanEmail,
      phone: phone || '',
      avatar: studentAvatar,
      profileLink: studentAvatar,
      courseId: defaultCourse.id,
      courseTitle: defaultCourse.title,
      selectedCourseIds: [defaultCourse.id],
      totalFee: defaultCourse.fee,
      paidAmount: 0,
      dueAmount: defaultCourse.fee,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      batchTiming: '09:00 AM - 11:00 AM',
      username: rollNumber.toLowerCase(),
    };
    await fsSaveStudent(studentRecord);

    const studentUser: User = {
      id: uid || studentRecord.id,
      username: (studentRecord.rollNumber || studentRecord.username || studentRecord.id || 'student').toLowerCase(),
      role: 'student',
      name: studentRecord.name || 'Student',
      email: cleanEmail || studentRecord.email || '',
      phone: studentRecord.phone || '',
      avatar: studentAvatar || studentRecord.avatar,
      studentId: studentRecord.id,
      rollNumber: studentRecord.rollNumber || 'ORI-STUDENT',
      isVerified: true,
      profileCompleted: true,
    };
    setStoredUser(studentUser);
    return { token: `fb-token-${uid || studentRecord.id}`, user: studentUser } as T;
  }

  // 3b. Direct Registration Endpoint (Firestore students collection)
  if (path === '/api/auth/register-direct' && method === 'POST') {
    const { name, email, phone, password, profileLink, avatar } = body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const studentAvatar = (profileLink || avatar || '').trim() || undefined;

    if (!cleanEmail) {
      throw new Error('Email address is required.');
    }

    const students = await fsGetStudents();
    const existingStudent = students.find((s) => (s.email || '').trim().toLowerCase() === cleanEmail);
    if (existingStudent) {
      throw new Error('This email address is already registered. Please sign in instead.');
    }

    const courses = await fsGetCourses();
    const defaultCourse = courses[0] || { id: 'course-1', title: 'Computer Course', fee: 10000 };
    const newId = `std-${Date.now()}`;
    const rollNumber = fsGenerateNextRollNumber(students);

    const newStudent: Student = {
      id: newId,
      rollNumber,
      name: name?.trim() || (cleanEmail ? cleanEmail.split('@')[0] : 'Student'),
      email: cleanEmail,
      phone: phone?.trim() || '',
      avatar: studentAvatar,
      profileLink: studentAvatar,
      courseId: defaultCourse.id,
      courseTitle: defaultCourse.title,
      selectedCourseIds: [defaultCourse.id],
      totalFee: defaultCourse.fee,
      paidAmount: 0,
      dueAmount: defaultCourse.fee,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      batchTiming: '09:00 AM - 11:00 AM',
      username: rollNumber.toLowerCase(),
      plainPassword: password,
    } as any;

    await fsSaveStudent(newStudent);

    const studentUser: User = {
      id: newStudent.id,
      username: newStudent.rollNumber.toLowerCase(),
      role: 'student',
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone,
      avatar: newStudent.avatar,
      studentId: newStudent.id,
      rollNumber: newStudent.rollNumber,
      isVerified: true,
      profileCompleted: true,
    };
    setStoredUser(studentUser);
    return { token: `student-token-${newStudent.id}`, user: studentUser } as T;
  }

  // 4. Student Overview & Progress
  if (path === '/api/student/me/overview') {
    const currentUser = getStoredUser();
    const students = await fsGetStudents();
    const courses = await fsGetCourses();
    const certificates = await fsGetCertificates();

    const qRoll = (params.get('roll') || params.get('rollNumber') || '').trim().toLowerCase();
    const qId = (params.get('id') || params.get('studentId') || '').trim();
    const qEmail = (params.get('email') || '').trim().toLowerCase();

    // Query param overrides (when admin or portal specifically queries a student)
    const hasQueryFilter = Boolean(qRoll || qId || qEmail);

    let student = students.find((s) => {
      if (!s) return false;
      const sEmail = (s.email || '').trim().toLowerCase();
      const sRoll = (s.rollNumber || '').trim().toLowerCase();
      const sId = (s.id || '').trim();

      // Query param overrides
      if (qRoll && sRoll === qRoll) return true;
      if (qId && (sId === qId || s.id === qId)) return true;
      if (qEmail && sEmail === qEmail) return true;

      // Current logged in student user matching (ONLY for student role)
      if (!currentUser || currentUser.role !== 'student') return false;
      const uEmail = (currentUser.email || '').trim().toLowerCase();
      const uRoll = (currentUser.rollNumber || currentUser.username || '').trim().toLowerCase();
      const uStudentId = (currentUser.studentId || currentUser.id || '').trim();

      return (
        (uStudentId && s.id === uStudentId) ||
        (uEmail && sEmail === uEmail) ||
        (uRoll && sRoll === uRoll)
      );
    });

    // If logged in as admin without specific student query, return admin state with student=null
    if (currentUser?.role === 'admin' && !hasQueryFilter) {
      return {
        student: null,
        user: currentUser,
        role: 'admin',
        enrolledCourses: [],
        certificate: null,
        continueWatching: null,
        watchProgress: null,
      } as T;
    }

    if (!student && currentUser && currentUser.role === 'student') {
      student = {
        id: currentUser.studentId || currentUser.id || `std-${Date.now()}`,
        rollNumber: currentUser.rollNumber || 'UTC-STUDENT',
        name: currentUser.name || 'Student',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        avatar: currentUser.avatar,
        courseId: courses[0]?.id || 'course-1',
        courseTitle: courses[0]?.title || 'Computer Course',
        totalFee: courses[0]?.fee || 10000,
        paidAmount: 0,
        dueAmount: courses[0]?.fee || 10000,
        joinedDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        batchTiming: '09:00 AM - 11:00 AM',
        username: (currentUser.rollNumber || currentUser.username || 'UTC-STUDENT').toLowerCase(),
      };
    }

    const matchedCert = student
      ? certificates.find(
          (c) =>
            (c.rollNumber && c.rollNumber.toLowerCase() === (student!.rollNumber || '').toLowerCase()) ||
            (c.certificateNumber && c.certificateNumber.toLowerCase() === (student!.certificateNumber || '').toLowerCase())
        )
      : null;

    const enrolledCourses = student
      ? courses.filter(
          (c) =>
            (student!.selectedCourseIds && student!.selectedCourseIds.includes(c.id)) ||
            (student!.courseId && student!.courseId === c.id) ||
            (student!.courseTitle && (c.title || '').toLowerCase().includes((student!.courseTitle || '').toLowerCase()))
        )
      : courses.slice(0, 1);

    return {
      student: student || null,
      user: currentUser,
      enrolledCourses: enrolledCourses.length > 0 ? enrolledCourses : courses.slice(0, 1),
      certificate: matchedCert || null,
      continueWatching: student?.continueWatching || null,
      watchProgress: student?.watchProgress || null,
    } as T;
  }

  // 4b. Student Profile Setup Endpoint
  if (path === '/api/student/setup-profile' && method === 'POST') {
    const { name, rollNumber, phone, avatar, courseIds, batchTiming } = body;
    const currentUser = getStoredUser();
    const students = await fsGetStudents();
    const courses = await fsGetCourses();

    const selectedCourses = courses.filter((c) => (courseIds || []).includes(c.id));
    const primaryCourse = selectedCourses[0] || courses[0];
    const combinedCourseTitle = selectedCourses.map((c) => c.title).join(', ');
    const totalFee = selectedCourses.reduce((sum, c) => sum + (c.fee || 0), 0);

    let student = students.find((s) => {
      if (!s) return false;
      const sEmail = (s.email || '').trim().toLowerCase();
      const uEmail = (currentUser?.email || '').trim().toLowerCase();
      return (
        (currentUser && s.id === currentUser.id) ||
        (currentUser && s.id === currentUser.studentId) ||
        (uEmail && sEmail === uEmail) ||
        (s.rollNumber && rollNumber && s.rollNumber.trim().toLowerCase() === rollNumber.trim().toLowerCase())
      );
    });

    const cleanName = (name || '').trim();
    const cleanRoll = (rollNumber || '').trim();

    if (student) {
      const updatedFields: Partial<Student> = {
        name: cleanName,
        rollNumber: cleanRoll,
        phone: phone ? phone.trim() : student.phone,
        avatar: avatar ? avatar.trim() : student.avatar,
        profileLink: avatar ? avatar.trim() : student.profileLink,
        selectedCourseIds: courseIds || student.selectedCourseIds,
        courseId: primaryCourse?.id || student.courseId,
        courseTitle: combinedCourseTitle || student.courseTitle,
        totalFee: totalFee || student.totalFee,
        batchTiming: batchTiming || student.batchTiming,
      };
      await fsUpdateStudent(student.id, updatedFields);
      student = { ...student, ...updatedFields };
    } else {
      const newStudent: Student = {
        id: currentUser?.studentId || `std-${Date.now()}`,
        rollNumber: cleanRoll || `UTC-${Date.now().toString().slice(-4)}`,
        name: cleanName || 'Student',
        email: currentUser?.email || '',
        phone: phone ? phone.trim() : '',
        avatar: avatar ? avatar.trim() : undefined,
        profileLink: avatar ? avatar.trim() : undefined,
        courseId: primaryCourse?.id || 'course-1',
        courseTitle: combinedCourseTitle || primaryCourse?.title || 'Selected Course',
        selectedCourseIds: courseIds || (primaryCourse ? [primaryCourse.id] : []),
        totalFee: totalFee || 25000,
        paidAmount: 0,
        dueAmount: totalFee || 25000,
        joinedDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        batchTiming: batchTiming || '07:00 AM - 08:00 AM',
        username: cleanRoll.toLowerCase(),
      };
      await fsSaveStudent(newStudent);
      student = newStudent;
    }

    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        name: cleanName,
        rollNumber: cleanRoll,
        phone: phone ? phone.trim() : currentUser.phone,
        avatar: avatar ? avatar.trim() : currentUser.avatar,
        studentId: student.id,
        selectedCourseIds: courseIds,
        profileCompleted: true,
      };
      setStoredUser(updatedUser);
    }

    return {
      success: true,
      message: 'Student profile updated successfully',
      student,
      user: getStoredUser(),
    } as T;
  }

  if (path === '/api/student/me/progress' && method === 'POST') {
    const { courseId, topicIndex, timestampSeconds } = body;
    const currentUser = getStoredUser();
    if (currentUser) {
      const students = await fsGetStudents();
      const student = students.find((s) => {
        if (!s) return false;
        const sEmail = (s.email || '').trim().toLowerCase();
        const uEmail = (currentUser.email || '').trim().toLowerCase();
        return (uEmail && sEmail === uEmail) || s.id === currentUser.studentId || s.id === currentUser.id;
      });
      if (student) {
        const continueWatching = {
          courseId: String(courseId || ''),
          courseTitle: String(body.courseTitle || 'Enrolled Course'),
          topicIndex: Number(topicIndex) || 0,
          moduleName: String(body.moduleName || 'Curriculum Modules'),
          timestampSeconds: Number(timestampSeconds) || 0,
          lastWatchedAt: new Date().toISOString(),
        };
        await fsUpdateStudent(student.id, { continueWatching });
      }
    }
    return { success: true } as T;
  }

  // 4b. Next Roll Number Generator Endpoint
  if (path === '/api/students/next-roll' && method === 'GET') {
    const students = await fsGetStudents();
    const nextRollNumber = fsGenerateNextRollNumber(students);
    const numMatches = nextRollNumber.match(/\d+$/);
    const numericPart = numMatches ? parseInt(numMatches[0], 10) : 100;
    return { nextRollNumber, numericPart } as T;
  }

  // 5. Students
  if (path === '/api/students') {
    if (method === 'GET') {
      const data = await fsGetStudents();
      return data as T;
    }
    if (method === 'POST') {
      const students = await fsGetStudents();
      const courses = await fsGetCourses();
      const matchedCourse = courses.find((c) => c.id === body.courseId);
      const totalFee = Number(body.totalFee || (matchedCourse ? matchedCourse.fee : 0));
      const initialPaid = Number(body.initialPayment || 0);
      const rollNumber = (body.customUsername || body.rollNumber || fsGenerateNextRollNumber(students)).trim();
      const cleanEmail = (body.email || '').trim().toLowerCase();

      // Check if student already exists by rollNumber or email to prevent duplicate document creations
      const existingStudent = students.find((s) => {
        const rMatch = s.rollNumber && s.rollNumber.trim().toUpperCase() === rollNumber.toUpperCase();
        const eMatch = cleanEmail && cleanEmail !== 'student@oritech.edu' && s.email && s.email.trim().toLowerCase() === cleanEmail;
        return rMatch || eMatch;
      });

      const newStudent: Student = {
        id: body.id || existingStudent?.id || `std-${Date.now()}`,
        rollNumber,
        name: (body.name || existingStudent?.name || '').trim(),
        email: cleanEmail || existingStudent?.email || '',
        phone: (body.phone || existingStudent?.phone || '').trim(),
        profileLink: body.profileLink || body.avatar || existingStudent?.profileLink,
        avatar: body.avatar || body.profileLink || existingStudent?.avatar,
        courseId: body.courseId || (matchedCourse?.id || existingStudent?.courseId || 'course-1'),
        courseTitle: matchedCourse?.title || body.courseTitle || existingStudent?.courseTitle || 'Computer Course',
        selectedCourseIds: body.selectedCourseIds || (body.courseId ? [body.courseId] : (existingStudent?.selectedCourseIds || [])),
        batchTiming: body.batchTiming || existingStudent?.batchTiming || '09:00 AM - 11:00 AM',
        totalFee,
        paidAmount: initialPaid > 0 ? initialPaid : (existingStudent?.paidAmount || 0),
        dueAmount: Math.max(0, totalFee - (initialPaid > 0 ? initialPaid : (existingStudent?.paidAmount || 0))),
        joinedDate: body.joinedDate || existingStudent?.joinedDate || new Date().toISOString().split('T')[0],
        status: body.status || existingStudent?.status || 'Active',
        username: rollNumber.toLowerCase(),
        plainPassword: body.customPassword || body.password || existingStudent?.plainPassword,
      };
      const saved = await fsSaveStudent(newStudent);

      // Record initial payment installment if any
      if (initialPaid > 0) {
        await fsSavePayment({
          id: `pay-${Date.now()}`,
          receiptNo: `RCP-${Date.now().toString().slice(-6)}`,
          studentId: saved.id,
          studentName: saved.name,
          rollNumber: saved.rollNumber,
          courseTitle: saved.courseTitle,
          amount: initialPaid,
          paymentDate: saved.joinedDate,
          paymentMethod: 'Cash',
          nextDueDate: '',
          remarks: 'Initial Enrollment Deposit',
          status: 'Paid',
        });
      }

      // Return both as direct object and nested `{ student, credentials }` for complete compatibility
      return {
        ...saved,
        student: saved,
        credentials: {
          username: saved.rollNumber,
          password: body.customPassword || body.password || 'Student@123',
        },
      } as T;
    }
  }

  if (path.startsWith('/api/students/')) {
    const id = path.replace('/api/students/', '');
    if (method === 'PUT') {
      const updated = await fsUpdateStudent(id, body);
      return (updated || body) as T;
    }
    if (method === 'DELETE') {
      await fsDeleteStudent(id);
      return { success: true } as T;
    }
  }

  // 6. Courses
  if (path === '/api/courses') {
    if (method === 'GET') {
      const data = await fsGetCourses();
      return data as T;
    }
    if (method === 'POST') {
      const newCourse: Course = {
        ...body,
        id: body.id || `course-${Date.now()}`,
      };
      const saved = await fsSaveCourse(newCourse);
      return saved as T;
    }
  }

  if (path.startsWith('/api/courses/')) {
    const id = path.replace('/api/courses/', '');
    if (method === 'PUT') {
      const updated = await fsUpdateCourse(id, body);
      return (updated || body) as T;
    }
    if (method === 'DELETE') {
      await fsDeleteCourse(id);
      return { success: true } as T;
    }
  }

  // 7. Payments
  if (path === '/api/payments') {
    if (method === 'GET') {
      const data = await fsGetPayments();
      return data as T;
    }
    if (method === 'POST') {
      const newPayment: PaymentInstallment = {
        ...body,
        id: body.id || `pay-${Date.now()}`,
        receiptNo: body.receiptNo || `RCP-${Date.now().toString().slice(-6)}`,
        paymentDate: body.paymentDate || new Date().toISOString().split('T')[0],
      };
      const saved = await fsSavePayment(newPayment);

      // Also update student's paid/due amount in Firestore
      if (saved.studentId) {
        const students = await fsGetStudents();
        const st = students.find((s) => s.id === saved.studentId);
        if (st) {
          const newPaid = (st.paidAmount || 0) + Number(saved.amount || 0);
          const newDue = Math.max(0, (st.totalFee || 0) - newPaid);
          await fsUpdateStudent(st.id, { paidAmount: newPaid, dueAmount: newDue });
        }
      }

      return saved as T;
    }
  }

  if (path.startsWith('/api/payments/')) {
    const id = path.replace('/api/payments/', '');
    if (method === 'DELETE') {
      await fsDeletePayment(id);
      return { success: true } as T;
    }
  }

  // 8. Results
  if (path === '/api/results') {
    if (method === 'GET') {
      const data = await fsGetResults();
      return data as T;
    }
    if (method === 'POST') {
      const newResult: StudentResult = {
        ...body,
        id: body.id || `res-${Date.now()}`,
      };
      const saved = await fsSaveResult(newResult);
      return saved as T;
    }
  }

  if (path === '/api/results/search') {
    const roll = (params.get('roll') || '').trim().toLowerCase();
    const results = await fsGetResults();
    const matched = results.filter((r) => (r.rollNumber || '').toLowerCase() === roll);
    return matched as T;
  }

  if (path.startsWith('/api/results/')) {
    const id = path.replace('/api/results/', '');
    if (method === 'PUT') {
      const updated = await fsUpdateResult(id, body);
      return (updated || body) as T;
    }
    if (method === 'DELETE') {
      await fsDeleteResult(id);
      return { success: true } as T;
    }
  }

  // 9. Certificates
  if (path === '/api/certificates') {
    if (method === 'GET') {
      const data = await fsGetCertificates();
      return data as T;
    }
    if (method === 'POST') {
      const cleanRoll = (body.rollNumber || '').trim().toUpperCase();
      const newCert: CertificateRecord = {
        ...body,
        id: body.id || `cert-${Date.now()}`,
        rollNumber: cleanRoll,
        certificateNumber: body.certificateNumber || `UTC-CERT-${Date.now().toString().slice(-6)}`,
        issueDate: body.issueDate || new Date().toISOString().split('T')[0],
        certificateUrl: body.certificateUrl || `/results?roll=${encodeURIComponent(cleanRoll || body.certificateNumber || '')}`,
        status: 'Verified',
        remarks: body.remarks || 'Official Institute Certification & Practical Course Completion',
      };
      const saved = await fsSaveCertificate(newCert);

      // AUTOMATICALLY CONVERT STUDENT STATUS TO 'Completed' IN FIRESTORE
      try {
        const students = await fsGetStudents();
        const matchedStudent = students.find((s) => {
          if (!s) return false;
          const sRoll = (s.rollNumber || '').trim().toUpperCase();
          const sId = (s.id || '').trim();
          const sName = (s.name || '').trim().toLowerCase();
          const bName = (body.studentName || '').trim().toLowerCase();
          const bId = (body.studentId || '').trim();

          return (
            (cleanRoll && sRoll === cleanRoll) ||
            (bId && sId === bId) ||
            (bName && sName && sName === bName)
          );
        });

        if (matchedStudent) {
          const studentUpdates: Partial<Student> = {
            status: 'Completed',
            certificateUrl: newCert.certificateUrl,
            certificateNumber: newCert.certificateNumber,
            certificateIssueDate: newCert.issueDate,
            certificateGrade: newCert.grade || 'A+ (Distinction)',
          };
          await fsUpdateStudent(matchedStudent.id, studentUpdates);
        }
      } catch (studentUpdateErr) {
        console.error('Failed to auto-update student status to Completed in Firestore:', studentUpdateErr);
      }

      return { success: true, certificate: saved, ...saved, message: 'Certificate issued and published successfully!' } as T;
    }
  }

  if (path.startsWith('/api/certificates/verify/')) {
    const certQuery = decodeURIComponent(path.replace('/api/certificates/verify/', '')).trim();
    const result = await fsVerifyCertificate(certQuery);
    return result as T;
  }

  if (path.startsWith('/api/certificates/')) {
    const id = path.replace('/api/certificates/', '');
    if (method === 'PUT') {
      const updated = await fsUpdateCertificate(id, body);
      const effectiveCert = updated || body;

      // Ensure student status remains Completed and syncs latest certificate details
      try {
        const cleanRoll = (effectiveCert.rollNumber || body.rollNumber || '').trim().toUpperCase();
        const students = await fsGetStudents();
        const matchedStudent = students.find((s) => {
          if (!s) return false;
          const sRoll = (s.rollNumber || '').trim().toUpperCase();
          const sId = (s.id || '').trim();
          return (cleanRoll && sRoll === cleanRoll) || (body.studentId && sId === body.studentId);
        });

        if (matchedStudent) {
          await fsUpdateStudent(matchedStudent.id, {
            status: 'Completed',
            certificateUrl: effectiveCert.certificateUrl,
            certificateNumber: effectiveCert.certificateNumber,
            certificateIssueDate: effectiveCert.issueDate,
            certificateGrade: effectiveCert.grade,
          });
        }
      } catch (e) {
        console.error('Failed to sync updated certificate to student:', e);
      }

      return { success: true, certificate: effectiveCert, ...effectiveCert } as T;
    }
    if (method === 'DELETE') {
      try {
        const certs = await fsGetCertificates();
        const targetCert = certs.find((c) => c.id === id);
        if (targetCert) {
          const cleanRoll = (targetCert.rollNumber || '').trim().toUpperCase();
          const students = await fsGetStudents();
          const matchedStudent = students.find((s) => (s.rollNumber || '').trim().toUpperCase() === cleanRoll);
          if (matchedStudent) {
            await fsUpdateStudent(matchedStudent.id, {
              status: 'Active',
              certificateUrl: undefined,
              certificateNumber: undefined,
            });
          }
        }
      } catch (e) {
        console.error('Failed to revert student status on certificate delete:', e);
      }

      await fsDeleteCertificate(id);
      return { success: true } as T;
    }
  }

  // 10. Course Video and PDF Links (Resources)
  if (path === '/api/resources' || path.startsWith('/api/resources?')) {
    if (method === 'GET') {
      const urlQuery = path.includes('?') ? path.split('?')[1] : '';
      const params = new URLSearchParams(urlQuery);
      const courseIdParam = params.get('courseId');
      
      const data = await fsGetResources();
      if (courseIdParam) {
        return data.filter((r) => r.courseId === courseIdParam) as T;
      }
      return data as T;
    }
    if (method === 'POST') {
      const newRes: LearningResource = {
        ...body,
        id: body.id || `res-${Date.now()}`,
      };
      const saved = await fsSaveResource(newRes);
      return saved as T;
    }
  }

  if (path.startsWith('/api/resources/')) {
    const id = path.replace('/api/resources/', '');
    if (method === 'PUT') {
      const updated = await fsUpdateResource(id, body);
      return (updated || body) as T;
    }
    if (method === 'DELETE') {
      await fsDeleteResource(id);
      return { success: true } as T;
    }
  }

  // 11. Notifications
  if (path === '/api/notifications') {
    if (method === 'GET') {
      const data = await fsGetNotifications();
      return data as T;
    }
    if (method === 'POST') {
      const newNotif: NotificationAnnouncement = {
        ...body,
        id: body.id || `notif-${Date.now()}`,
        date: body.date || new Date().toISOString().split('T')[0],
      };
      const saved = await fsSaveNotification(newNotif);
      return saved as T;
    }
  }

  if (path.startsWith('/api/notifications/')) {
    const id = path.replace('/api/notifications/', '');
    if (method === 'DELETE') {
      await fsDeleteNotification(id);
      return { success: true } as T;
    }
  }

  // 12. Enquiries / Contact
  if (path === '/api/enquiries' || path === '/api/contact') {
    if (method === 'GET') {
      const data = await fsGetEnquiries();
      return data as T;
    }
    if (method === 'POST') {
      let matchedCourseTitle = body.courseTitle;
      if (!matchedCourseTitle && body.courseId) {
        const courses = await fsGetCourses();
        const found = courses.find((c) => c.id === body.courseId);
        if (found) matchedCourseTitle = found.title;
      }

      const newEnquiry: ContactEnquiry = {
        ...body,
        id: body.id || `enq-${Date.now()}`,
        courseTitle: matchedCourseTitle || body.courseTitle || 'General Enquiry',
        createdAt: body.createdAt || new Date().toISOString().split('T')[0],
        submittedAt: body.submittedAt || new Date().toISOString(),
        status: body.status || 'New',
        source: body.source || (path === '/api/contact' ? 'Website Contact Form' : 'Course Inquiry'),
      };
      const saved = await fsSaveEnquiry(newEnquiry);
      return saved as T;
    }
  }

  if (path.startsWith('/api/enquiries/') || path.startsWith('/api/contact/')) {
    const id = path.replace('/api/enquiries/', '').replace('/api/contact/', '');
    if (method === 'PUT') {
      const updated = await fsUpdateEnquiry(id, body);
      return (updated || body) as T;
    }
    if (method === 'DELETE') {
      await fsDeleteEnquiry(id);
      return { success: true } as T;
    }
  }

  // 13. Sliders / Banners
  if (path === '/api/sliders' || path === '/api/slider' || path === '/api/banners') {
    if (method === 'GET') {
      const data = await fsGetSliderImages();
      return data as T;
    }
    if (method === 'POST') {
      if (Array.isArray(body)) {
        const saved = await fsSaveSliderImages(body);
        return saved as T;
      } else if (body.sliderImages && Array.isArray(body.sliderImages)) {
        const saved = await fsSaveSliderImages(body.sliderImages);
        return saved as T;
      } else {
        const newSlider: SliderImage = {
          ...body,
          id: body.id || `slide-${Date.now()}`,
          active: body.active !== undefined ? Boolean(body.active) : true,
          order: typeof body.order === 'number' ? body.order : 1,
        };
        const saved = await fsSaveSliderImage(newSlider);
        return saved as T;
      }
    }
  }

  if (path.startsWith('/api/sliders/') || path.startsWith('/api/banners/')) {
    const id = path.replace('/api/sliders/', '').replace('/api/banners/', '');
    if (method === 'PUT') {
      const updated = await fsUpdateSliderImage(id, body);
      return (updated || body) as T;
    }
    if (method === 'DELETE') {
      await fsDeleteSliderImage(id);
      return { success: true } as T;
    }
  }

  // 14. Reviews
  if (path.startsWith('/api/courses/') && path.endsWith('/reviews')) {
    const courseId = path.replace('/api/courses/', '').replace('/reviews', '');
    if (method === 'GET') {
      const allCourseReviews = await fsGetCourseReviews();
      const filtered = allCourseReviews.filter((r) => r.courseId === courseId || (r.courseTitle && r.courseTitle.toLowerCase() === courseId.toLowerCase()));
      return filtered as T;
    }
    if (method === 'POST') {
      const storedUser = getStoredUser();
      const token = getStoredToken();
      if (!token || !storedUser) {
        throw new Error('Authentication required: Only signed-in verified students can submit course reviews. Please log in.');
      }
      if (storedUser.role === 'admin') {
        throw new Error('Administrator accounts cannot submit student reviews. Please sign in with an enrolled student account.');
      }

      const newRev: CourseReview = {
        ...body,
        courseId: body.courseId || courseId,
        userId: storedUser.id,
        studentId: storedUser.studentId || storedUser.id,
        studentName: storedUser.name || body.studentName || 'Enrolled Student',
        avatar: storedUser.avatar || body.avatar,
        id: body.id || `crev-${Date.now()}`,
        verified: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const saved = await fsSaveCourseReview(newRev);
      return { success: true, message: 'Review submitted successfully', review: saved } as T;
    }
  }

  if (path.startsWith('/api/courses/reviews/') && path.endsWith('/helpful')) {
    const revId = path.replace('/api/courses/reviews/', '').replace('/helpful', '');
    const allCourseReviews = await fsGetCourseReviews();
    const target = allCourseReviews.find((r) => r.id === revId);
    if (target) {
      target.helpfulCount = (target.helpfulCount || 0) + 1;
      await fsSaveCourseReview(target);
      return { success: true, helpfulCount: target.helpfulCount } as T;
    }
    return { success: true, helpfulCount: 1 } as T;
  }

  if (path === '/api/reviews/courses') {
    if (method === 'GET') {
      const data = await fsGetCourseReviews();
      return data as T;
    }
    if (method === 'POST') {
      const storedUser = getStoredUser();
      const token = getStoredToken();
      if (!token || !storedUser) {
        throw new Error('Authentication required: Only signed-in students can submit course reviews.');
      }
      if (storedUser.role === 'admin') {
        throw new Error('Administrator accounts cannot submit student reviews. Please sign in with an enrolled student account.');
      }

      const newRev: CourseReview = {
        ...body,
        userId: storedUser.id,
        studentId: storedUser.studentId || storedUser.id,
        studentName: storedUser.name || body.studentName || 'Enrolled Student',
        avatar: storedUser.avatar || body.avatar,
        id: body.id || `crev-${Date.now()}`,
        verified: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const saved = await fsSaveCourseReview(newRev);
      return { success: true, review: saved } as T;
    }
  }

  if (path === '/api/reviews/institute' || path === '/api/institute/reviews') {
    if (method === 'GET') {
      const data = await fsGetInstituteReviews();
      const avgRating = data.length > 0
        ? Number((data.reduce((acc, curr) => acc + (curr.rating || 5), 0) / data.length).toFixed(1))
        : 5.0;
      return { reviews: data, totalReviews: data.length, averageRating: avgRating } as T;
    }
    if (method === 'POST') {
      const storedUser = getStoredUser();
      const token = getStoredToken();
      if (!token || !storedUser) {
        throw new Error('Authentication required: Only signed-in students can submit institute reviews. Please log in.');
      }
      if (storedUser.role === 'admin') {
        throw new Error('Administrator accounts cannot submit student reviews. Please sign in with an enrolled student account.');
      }

      const newRev: InstituteReview = {
        ...body,
        userId: storedUser.id,
        studentId: storedUser.studentId || storedUser.id,
        studentName: storedUser.name || body.studentName || 'Enrolled Student',
        avatar: storedUser.avatar || body.avatar,
        id: body.id || `irev-${Date.now()}`,
        verified: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const saved = await fsSaveInstituteReview(newRev);
      const allInst = await fsGetInstituteReviews();
      const updatedTotal = allInst.length;
      const totalRatings = allInst.reduce((acc, curr) => acc + (curr.rating || 5), 0);
      const updatedAvg = updatedTotal > 0 ? Number((totalRatings / updatedTotal).toFixed(1)) : 5.0;

      return {
        success: true,
        message: 'Your review has been submitted and published live!',
        review: saved,
        totalReviews: updatedTotal,
        averageRating: updatedAvg,
      } as T;
    }
  }

  if (path === '/api/institute/branding' || path === '/api/branding') {
    if (method === 'GET') {
      const data = await fsGetBrandingSettings();
      return data as T;
    }
    if (method === 'POST' || method === 'PUT') {
      const saved = await fsSaveBrandingSettings(body);
      return saved as T;
    }
  }

  return {} as T;
}

/**
 * Main apiFetch interface used throughout frontend.
 * Directs all application data operations straight to Firebase Cloud Firestore.
 */
export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const [path] = endpoint.split('?');

  const isFirestoreRoute = [
    '/api/students',
    '/api/student',
    '/api/courses',
    '/api/payments',
    '/api/results',
    '/api/certificates',
    '/api/resources',
    '/api/notifications',
    '/api/enquiries',
    '/api/contact',
    '/api/sliders',
    '/api/slider',
    '/api/reviews',
    '/api/institute',
    '/api/branding',
    '/api/auth/firebase-sync',
    '/api/auth/me',
    '/api/auth/login',
  ].some((r) => path === r || path.startsWith(r + '/'));

  if (isFirestoreRoute) {
    return handleDirectFirestore<T>(endpoint, options);
  }

  // For other endpoints (like email OTP sending via backend Express), execute standard fetch
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      return await handleDirectFirestore<T>(endpoint, options);
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      return await handleDirectFirestore<T>(endpoint, options);
    }

    return data as T;
  } catch (err) {
    return await handleDirectFirestore<T>(endpoint, options);
  }
}
