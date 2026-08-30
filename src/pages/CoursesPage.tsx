import React, { useState } from 'react';
import { Search, BookOpen, Clock, CheckCircle2, ChevronRight, Sparkles, Filter, X } from 'lucide-react';
import { Course } from '../types';
import { CourseCardSkeleton } from '../components/Skeleton';
import { SEO } from '../components/SEO';
import { formatImageUrl } from '../lib/imageUtils';

interface CoursesPageProps {
  courses: Course[];
  isLoading?: boolean;
  onOpenEnroll: (course?: Course) => void;
  onSelectCourse?: (course: Course) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
  courses,
  isLoading = false,
  onOpenEnroll,
  onSelectCourse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Programming & Software',
    'Web & App Development',
    'Office Automation & Tally',
    'Cyber Security & Networking',
    'Graphic Design',
  ];

  const filteredCourses = courses.filter((c) => {
    if (!c) return false;
    const cat = c.category || 'Programming & Software';
    const matchesCategory = selectedCategory === 'All' || cat === selectedCategory;
    const term = searchTerm.toLowerCase();
    const title = (c.title || '').toLowerCase();
    const code = (c.code || '').toLowerCase();
    const desc = (c.description || '').toLowerCase();
    const matchesSearch = !searchTerm.trim() || title.includes(term) || code.includes(term) || desc.includes(term);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <SEO
        title="Computer Courses & Certifications - DCA, PGDCA, Python, Tally, Web Development"
        description="Explore computer courses at Oritech Computer: DCA, PGDCA, Python Full Stack, Web Development, Tally Prime with GST, and AI. Get course details, syllabus, duration, and ISO recognized certifications."
        path="/courses"
        keywords="computer courses catalog, DCA syllabus, PGDCA admission, Python programming course, Tally Prime course, Web design classes, Oritech Computer courses"
      />

      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider shadow-xs">
          <BookOpen className="w-3.5 h-3.5 text-orange-600" />
          <span>Course Catalog & Syllabi</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight">
          Industry Certified Computer Courses
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-medium">
          Browse our career-oriented certification courses designed for 100% practical lab practice and industry readiness.
        </p>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses by keyword, language, software or course code..."
            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold text-stone-600 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5 text-orange-600" />
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-amber-50/70 hover:text-orange-700 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white border border-stone-200 rounded-3xl shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-orange-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-stone-900">No Courses Added Yet</h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
            Your Firestore courses collection is ready for real data. Log in to the Admin Panel to create your first course.
          </p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-white border border-stone-200 rounded-2xl text-stone-600 text-sm font-medium">
          No courses match your filter criteria. Try searching with a different keyword.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="group bg-white border border-stone-200 hover:border-amber-400 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div
                onClick={() => onSelectCourse && onSelectCourse(course)}
                className="cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden bg-stone-100">
                  <img
                    src={formatImageUrl(course.thumbnail) || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'}
                    alt={course.title || 'Course'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-lg text-sm font-mono font-extrabold shadow-md">
                    ₹{Number(course.fee || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-stone-900/90 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border border-amber-400/30">
                    {course.category || 'General'}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-500">
                    <span className="text-orange-600 font-extrabold">{course.code || 'CERT'}</span>
                    <span className="flex items-center gap-1 text-stone-600">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {course.duration || '3 Months'}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-stone-900 group-hover:text-orange-600 transition-colors">
                    {course.title || 'Certification Course'}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{course.description || 'Comprehensive professional computer training.'}</p>

                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-1">
                    <p className="text-[10px] font-mono uppercase text-orange-700 font-extrabold">Prerequisites</p>
                    <p className="text-xs text-stone-700 font-medium">{course.prerequisites || 'Basic Computer Knowledge'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEnroll(course);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-orange-500/20 text-center cursor-pointer active:scale-98"
                >
                  Enroll Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
