import React from 'react';
import { Course } from '../types';
import { CourseReviews } from '../components/CourseReviews';
import { CourseDetailSkeleton } from '../components/Skeleton';
import { SEO } from '../components/SEO';
import { formatImageUrl } from '../lib/imageUtils';
import {
  Clock,
  ListChecks,
  BookOpen,
  Award,
  Calendar,
  Info,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface CourseDetailPageProps {
  course?: Course | null;
  onBack: () => void;
  onOpenEnroll: (course: Course) => void;
  onNavigate?: (path: string) => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course,
  onBack,
  onOpenEnroll,
  onNavigate,
}) => {
  if (!course) {
    return <CourseDetailSkeleton />;
  }

  const schedule = {
    morningBatch: course.schedule?.morningBatch || '7:00 AM – 12:00 PM',
    eveningBatch: course.schedule?.eveningBatch || '4:00 PM – 8:00 PM',
    note: course.schedule?.note || 'Each batch session lasts 1 hour. Flexible timing is available for working professionals and college students.',
  };

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || `${course.title} certification course at Oritech Computer.`,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Oritech Computer',
      sameAs: typeof window !== 'undefined' ? window.location.origin : 'https://oritech.edu',
    },
    educationalCredentialAwarded: 'ISO 9001:2015 Accredited Certificate of Completion',
    timeRequired: course.duration,
    courseCode: course.code,
    image: course.thumbnail,
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      priceCurrency: 'INR',
      price: course.price ? String(course.price) : 'Contact Institute',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title={`${course.title}${course.code ? ` (${course.code})` : ''} - Course Syllabus & Admission`}
        description={course.description ? `${course.description.slice(0, 150)}... Duration: ${course.duration}. ISO 9001:2015 certified training at Oritech Computer.` : `Learn ${course.title} at Oritech Computer. Duration: ${course.duration}. Hands-on practical lab training and recognized certification.`}
        path={`/courses/${course.id}`}
        ogType="article"
        ogImage={course.thumbnail}
        keywords={`${course.title}, ${course.code || ''}, learn ${course.title}, ${course.category || ''}, Oritech Computer course, syllabus`}
        structuredData={courseSchema}
      />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-900 hover:bg-slate-100 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </button>

        {/* Hero Course Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-full md:w-80 h-56 md:h-60 rounded-2xl overflow-hidden border border-slate-200 shadow-md shrink-0 bg-slate-100">
            <img
              src={formatImageUrl(course.thumbnail) || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'}
              alt={course.title || 'Course'}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80';
              }}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-5 text-center md:text-left">
            <div>
              <span className="text-xs font-mono font-extrabold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Course Code: {course.code || 'CERT'}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-indigo-950 mt-3 leading-snug">
                {course.title}
              </h1>
            </div>

            <div className="space-y-2 text-sm text-slate-700 font-semibold">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong className="text-slate-900 font-extrabold">Duration:</strong> {course.duration || '3 Months'}
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-amber-500 font-extrabold text-base leading-none">₹</span>
                <span>
                  <strong className="text-slate-900 font-extrabold">Total Fee:</strong> ₹
                  {Number(course.fee || 0).toLocaleString('en-IN')}/-
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {course.description || 'Comprehensive practical computer training course.'}
            </p>

            <div className="pt-2">
              <button
                onClick={() => onOpenEnroll(course)}
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-400 hover:bg-amber-500 text-indigo-950 font-black rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Enroll Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: Course Outline / Syllabus */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm border-l-8 border-l-indigo-950 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center">
              <ListChecks className="w-6 h-6 text-indigo-900" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-indigo-950">
              Course Outline / Syllabus
            </h2>
          </div>

          <div className="space-y-3">
            {course.syllabus && course.syllabus.length > 0 ? (
              course.syllabus.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-none"
                >
                  <CheckCircle2 className="w-5 h-5 text-indigo-900 shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-slate-800 font-semibold leading-relaxed">
                    {topic}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Full comprehensive syllabus module provided during orientation.</p>
            )}
          </div>
        </div>

        {/* Section 2: Two Columns Grid (Prerequisites & Certification) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prerequisites Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm border-l-8 border-l-indigo-950 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-indigo-950">
                Prerequisites
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {course.prerequisites || 'Basic computer literacy recommended. Ideal for students and job seekers.'}
            </p>
          </div>

          {/* Certification Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm border-l-8 border-l-indigo-950 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-indigo-950">
                Certification
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Upon successful completion and passing the final assessment, students will receive an{' '}
              <strong className="text-slate-900 font-extrabold">
                ISO 9001:2015 Certified Certificate in {course.title}.
              </strong>
            </p>
          </div>
        </div>

        {/* Section 3: Schedule & Batch Timing */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm border-l-8 border-l-indigo-950 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-indigo-950">
              Schedule & Batch Timing
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
              <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Morning Batches
              </p>
              <div className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-indigo-950 font-mono shadow-sm">
                {schedule.morningBatch}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
              <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Evening Batches
              </p>
              <div className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-indigo-950 font-mono shadow-sm">
                {schedule.eveningBatch}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-500 font-medium italic text-center">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{schedule.note}</span>
          </div>
        </div>

        {/* Section 4: Student Reviews & Feedback */}
        <CourseReviews course={course} onNavigate={onNavigate} />
      </div>
    </div>
  );
};
