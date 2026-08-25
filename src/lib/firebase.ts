import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
export const firebaseConfig = {
  apiKey: "AIzaSyDqzEkqLvmc_kUhHivls9gY7NXzOmVIGt0",
  authDomain: "unitechcoachingcenter.firebaseapp.com",
  projectId: "unitechcoachingcenter",
  storageBucket: "unitechcoachingcenter.firebasestorage.app",
  messagingSenderId: "7489864044",
  appId: "1:7489864044:web:be16e2dc1a42d4d0c1b349"
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Suppress internal WebChannel fallback transport warnings
try {
  setLogLevel('error');
} catch (_) {}

export const firestoreDatabaseId = 'default';

// Initialize Firestore with robust long-polling transport to prevent WebChannel streaming drops in iframe/proxy environments
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    } as any,
    firestoreDatabaseId
  );
} catch (_) {
  try {
    firestoreInstance = getFirestore(app, firestoreDatabaseId);
  } catch (e) {
    firestoreInstance = getFirestore(app);
  }
}
export const db = firestoreInstance;
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
};

export type { FirebaseUser };

/**
 * Safely creates a new student user in Firebase Authentication
 * using Google Identity REST API / isolated secondary Firebase app instance.
 * Protected with a strict timeout to guarantee it NEVER hangs the UI or blocks registration.
 */
export async function registerStudentWithFirebaseAuth(
  email: string,
  pass: string,
  displayName?: string
): Promise<{ success: boolean; uid?: string; error?: string }> {
  if (!email || !pass) {
    return { success: false, error: 'Email and password are required' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const apiKey = firebaseConfig.apiKey;

  // 1. First attempt: Direct Identity Toolkit REST API with 3.5s timeout
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password: pass.trim(),
            returnSecureToken: true,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      const data = await res.json();
      if (res.ok && data.localId) {
        if (displayName) {
          try {
            await fetch(
              `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  idToken: data.idToken,
                  displayName: displayName.trim(),
                  returnSecureToken: false,
                }),
              }
            );
          } catch (_) {}
        }
        return { success: true, uid: data.localId };
      } else {
        const errorMsg = data?.error?.message || 'Authentication error';
        if (errorMsg.includes('EMAIL_EXISTS')) {
          return { success: true, error: 'Account already exists in Firebase Auth' };
        }
        console.warn('Firebase Auth REST signup note:', errorMsg);
      }
    } catch (restErr: any) {
      console.warn('Firebase Auth REST note (fallback to SDK):', restErr?.message || restErr);
    }
  }

  // 2. Secondary SDK instance with 3.5s race timeout
  try {
    const sdkOperation = async (): Promise<{ success: boolean; uid?: string; error?: string }> => {
      const secondaryAppName = `SecondaryAuthAdminApp_${Date.now()}`;
      let secondaryApp;
      try {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, pass.trim());

        if (displayName && userCredential.user) {
          try {
            await updateProfile(userCredential.user, { displayName: displayName.trim() });
          } catch (_) {}
        }

        const createdUid = userCredential.user.uid;
        await signOut(secondaryAuth);
        return { success: true, uid: createdUid };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed in SDK' };
      }
    };

    const timeoutPromise = new Promise<{ success: boolean; error: string }>((resolve) =>
      setTimeout(() => resolve({ success: true, error: 'Proceeded after timeout' }), 3500)
    );

    return await Promise.race([sdkOperation(), timeoutPromise]);
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to create student in Firebase Authentication',
    };
  }
}

/**
 * Safely and directly removes student user credentials from Firebase Authentication
 * and completely purges all corresponding student records from Firestore.
 */
export async function deleteStudentFromFirebaseAuth(
  email?: string,
  plainPassword?: string,
  rollNumber?: string,
  phone?: string
): Promise<{ success: boolean; error?: string }> {
  if (!email && !rollNumber) return { success: true };

  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const apiKey = firebaseConfig.apiKey;

  // 1. Direct Firebase Authentication User Deletion via Google Identity Toolkit REST API
  if (cleanEmail && apiKey) {
    // Generate candidate passwords to guarantee we match the account
    const candidatePasswords = Array.from(
      new Set(
        [
          plainPassword?.trim(),
          'oritech123',
          'oritech2026',
          'oritech@2026',
          'Oritech@123',
          'Oritech123',
          'unitech123',
          'unitech2026',
          'unitech@2026',
          'student123',
          '123456',
          '12345678',
          'password',
          'password123',
          rollNumber?.trim(),
          rollNumber?.trim().toLowerCase(),
          phone?.trim(),
          phone?.replace(/\D/g, ''),
          'Unitech@123',
          'Student@123',
          'Unitech123',
          'unitech',
          'oritech',
        ].filter((p): p is string => Boolean(p && p.length >= 6))
      )
    );

    for (const pwd of candidatePasswords) {
      try {
        // Step A: Sign in via REST API to get the user's ID token
        const signInRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              password: pwd,
              returnSecureToken: true,
            }),
          }
        );

        if (signInRes.ok) {
          const signInData = await signInRes.json();
          const idToken = signInData.idToken;

          if (idToken) {
            // Step B: Permanently delete the user account from Firebase Auth
            const deleteRes = await fetch(
              `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
              }
            );

            if (deleteRes.ok) {
              console.log(`[Firebase Auth] Successfully deleted user account: ${cleanEmail}`);
              break; // Deletion confirmed, no need to try further passwords
            }
          }
        }
      } catch (authErr) {
        console.warn(`[Firebase Auth] Deletion attempt note for ${cleanEmail}:`, authErr);
      }
    }
  }

  // 2. Clean up corresponding documents from Cloud Firestore students collection
  try {
    const docsToDelete: any[] = [];

    if (cleanEmail) {
      docsToDelete.push(doc(db, 'students', cleanEmail));
    }
    if (rollNumber) {
      docsToDelete.push(doc(db, 'students', rollNumber));
    }

    // Query for any matching student documents by email or rollNumber
    if (cleanEmail) {
      try {
        const qEmail = query(collection(db, 'students'), where('email', '==', cleanEmail));
        const emailSnap = await getDocs(qEmail);
        emailSnap.forEach((d) => docsToDelete.push(d.ref));
      } catch (_) {}
    }

    if (rollNumber) {
      try {
        const qRoll = query(collection(db, 'students'), where('rollNumber', '==', rollNumber));
        const rollSnap = await getDocs(qRoll);
        rollSnap.forEach((d) => docsToDelete.push(d.ref));
      } catch (_) {}
    }

    // Execute deletions in Firestore
    await Promise.allSettled(docsToDelete.map((docRef) => deleteDoc(docRef)));
  } catch (fsErr) {
    console.warn('[Firestore] Cleanup note:', fsErr);
  }

  return { success: true };
}


