import React, { useState } from 'react';
import {
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import {
  auth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from '../lib/firebase';
import { apiFetch, setStoredToken } from '../lib/api';
import { User } from '../types';
import { MASTER_LOGO_URL } from '../lib/firestoreService';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
  onRegistered: (email: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigate,
  onRegistered,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field validations
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      
      // 1. Try Firebase Authentication User Creation
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;

        // Set display name and photoURL if provided
        await updateProfile(fbUser, {
          displayName: name.trim(),
          photoURL: profileLink.trim() || undefined,
        });

        // Send Firebase Email Verification
        try {
          await sendEmailVerification(fbUser);
        } catch (e) {
          console.warn('Firebase email verification send note:', e);
        }

        // Sync student account into Firestore students registry
        try {
          const syncRes = await apiFetch<{ token: string; user: User }>('/api/auth/firebase-sync', {
            method: 'POST',
            body: JSON.stringify({
              uid: fbUser.uid,
              email: cleanEmail,
              name: name.trim(),
              phone: phone.trim(),
              avatar: profileLink.trim() || undefined,
            }),
          });

          if (syncRes.token) {
            setStoredToken(syncRes.token);
          }
        } catch (e) {
          console.warn('Server sync error:', e);
        }

        onRegistered(cleanEmail);
        return;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          setError('This email address is already registered. Please sign in instead.');
          return;
        } else if (fbErr.code === 'auth/weak-password') {
          setError('Password is too weak. Please use at least 6 characters.');
          return;
        } else if (fbErr.code === 'auth/invalid-email') {
          setError('The email address provided is invalid.');
          return;
        }

        // If operation-not-allowed or any other Firebase Auth config error, fall back seamlessly
        console.warn('Firebase Auth client creation note:', fbErr.code, '- executing direct registration fallback');

        const directRes = await apiFetch<{ token: string; user: User }>('/api/auth/register-direct', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            email: cleanEmail,
            password,
            profileLink: profileLink.trim() || undefined,
          }),
        });

        if (directRes.token && directRes.user) {
          setStoredToken(directRes.token);
          onRegistered(cleanEmail);
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-stone-200 shadow-xl shadow-stone-200/50">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-1">
            <img
              src={MASTER_LOGO_URL}
              alt="Oritech Computer Logo"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="h-16 sm:h-20 w-auto max-w-[220px] object-contain mx-auto transition-transform hover:scale-102"
            />
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Firebase Account Sign Up
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            Join Oritech Computer with secure Firebase authentication
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-shake">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ankit Sharma"
                className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Profile Image Link */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Profile Image Link (Optional)
              </label>
              <span className="text-[10px] text-stone-400 font-medium">Photo URL</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Globe className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={profileLink}
                  onChange={(e) => setProfileLink(e.target.value)}
                  placeholder="https://images.unsplash.com/... or image link"
                  className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:bg-white outline-none transition-all"
                />
              </div>
              {profileLink && (
                <div className="w-10 h-10 rounded-xl border border-amber-300 overflow-hidden bg-stone-100 shrink-0 flex items-center justify-center shadow-xs">
                  <img
                    src={profileLink}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ankit@example.com"
                className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-11 pr-11 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:bg-white outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-60 text-white rounded-xl text-sm font-black shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-98"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Firebase Account...</span>
              </>
            ) : (
              <>
                <span>Create Account with Firebase</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Existing User Link */}
        <div className="pt-4 border-t border-stone-200 text-center">
          <p className="text-xs text-stone-600">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="font-extrabold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
            >
              Sign In to Your Account &rarr;
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
