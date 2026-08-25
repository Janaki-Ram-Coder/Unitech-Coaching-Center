import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Award,
  Users,
  CheckCircle,
  Laptop,
  Clock,
  BookOpen,
  ArrowRight,
  Search,
  ShieldCheck,
  Star,
  Sparkles,
} from 'lucide-react';
import { Course, SliderImage } from '../types';
import { Testimonials } from '../components/Testimonials';
import { HeroSliderSkeleton, CourseCardSkeleton } from '../components/Skeleton';
import { SEO } from '../components/SEO';

interface HomePageProps {
  sliderImages: SliderImage[];
  popularCourses: Course[];
  isLoading?: boolean;
  onNavigate: (path: string) => void;
  onOpenEnroll: (course?: Course) => void;
  onSelectCourse?: (course: Course) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  sliderImages,
  popularCourses,
  isLoading = false,
  onNavigate,
  onOpenEnroll,
  onSelectCourse,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeSlides = useMemo(() => {
    if (!sliderImages || sliderImages.length === 0) return [];
    const activeOnly = sliderImages.filter((s) => s.active !== false);
    const sorted = (activeOnly.length > 0 ? activeOnly : sliderImages).sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    return sorted;
  }, [sliderImages]);

  // Auto-play hero slider every 5 seconds
  useEffect(() => {
    if (!activeSlides || activeSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlides]);

  const prevSlide = () => {
    if (!activeSlides || activeSlides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const nextSlide = () => {
    if (!activeSlides || activeSlides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const whyChooseUs = [
    {
      icon: Laptop,
      title: '100% Practical Training',
      description: 'Hands-on lab exercises on modern workstations with 1-on-1 instructor guidance.',
      color: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20',
    },
    {
      icon: Users,
      title: 'Expert Certified Faculty',
      description: 'Learn from industry veterans with 10+ years of real-world software experience.',
      color: 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20 font-bold',
    },
    {
      icon: ShieldCheck,
      title: 'ISO 9001:2015 Certificates',
      description: 'Gain government & corporate recognized certifications accepted worldwide.',
      color: 'bg-stone-900 text-amber-400 shadow-md border border-amber-400/30',
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      <SEO
        title="Oritech Computer - Premier Computer Training & Certification Institute"
        description="Join Oritech Computer for industry-leading computer courses: Python Full Stack, Web Development, DCA, PGDCA, Tally Prime with GST, and AI. ISO 9001:2015 Certified with 100% practical training."
        path="/"
        keywords="Oritech Computer, computer training institute, DCA course, PGDCA, Python full stack, Tally Prime GST, computer classes near me, coding institute"
      />

      {/* 1. DYNAMIC HERO SLIDER CAROUSEL */}
      {isLoading ? (
        <HeroSliderSkeleton />
      ) : activeSlides && activeSlides.length > 0 ? (
        <section className="relative w-full h-[calc(100svh-97px)] min-h-[375px] max-h-[515px] sm:h-[465px] lg:h-[505px] overflow-hidden bg-stone-950 flex items-center justify-center">
          {activeSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover opacity-75 sm:opacity-70 transform scale-105 transition-transform duration-10000"
              />
              {/* Base contrast gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-900/40 to-stone-950/25" />
              {/* Yellow, orange, and transparent gradient effect (20-30% opacity) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/25 via-orange-500/20 to-transparent pointer-events-none" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 text-center">
                <div className="max-w-3xl flex flex-col items-center justify-center my-auto">
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight sm:leading-snug drop-shadow-lg text-center">
                    {slide.title}
                  </h1>
                  <p className="mt-3 sm:mt-5 text-sm sm:text-base lg:text-lg text-stone-200 max-w-2xl mx-auto leading-relaxed drop-shadow font-medium text-center">
                    {slide.subtitle}
                  </p>
                  <div className="mt-[38px] sm:mt-10 flex flex-wrap items-center justify-center gap-4">
                    <button
                      onClick={() => onNavigate(slide.ctaLink || '/courses')}
                      className="px-8 py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center gap-2.5 text-sm sm:text-base cursor-pointer"
                    >
                      <span>{slide.ctaText || 'Explore Courses'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Carousel Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-stone-900/40 hover:bg-stone-900/70 text-white border border-white/20 backdrop-blur transition-all hidden sm:flex cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-stone-900/40 hover:bg-stone-900/70 text-white border border-white/20 backdrop-blur transition-all hidden sm:flex cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-8 bg-amber-400 shadow-sm shadow-amber-400/50' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="relative w-full h-[calc(100svh-97px)] min-h-[375px] max-h-[515px] sm:h-[465px] lg:h-[505px] overflow-hidden bg-stone-950 flex items-center justify-center text-white px-4">
          {/* Yellow, orange, and transparent gradient effect (20-30% opacity) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/25 via-orange-500/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/30 to-stone-950/20 pointer-events-none" />
          <div className="relative z-10 max-w-3xl flex flex-col items-center justify-center text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Premier Computer Training Center</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Oritech Computer
            </h1>
            <p className="text-sm sm:text-base text-stone-300 max-w-2xl font-medium leading-relaxed">
              Empowering students with 100% practical software training, career guidance, and ISO certified credentials.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('/courses')}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center gap-2.5 text-sm cursor-pointer"
              >
                <span>Browse Courses</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('/contact')}
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-extrabold rounded-2xl border border-white/20 transition-all text-sm cursor-pointer"
              >
                Contact Admissions
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. STATS BANNER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white border border-stone-200 rounded-2xl shadow-xs text-stone-800">
          <div className="text-center p-4">
            <p className="text-3xl font-black text-orange-600 font-mono">15+</p>
            <p className="text-xs text-stone-600 font-bold uppercase tracking-wider mt-1">Years Excellence</p>
          </div>
          <div className="text-center p-4 border-l border-stone-200">
            <p className="text-3xl font-black text-amber-500 font-mono">12,000+</p>
            <p className="text-xs text-stone-600 font-bold uppercase tracking-wider mt-1">Students Trained</p>
          </div>
          <div className="text-center p-4 border-l border-stone-200">
            <p className="text-3xl font-black text-orange-600 font-mono">100%</p>
            <p className="text-xs text-stone-600 font-bold uppercase tracking-wider mt-1">Practical Labs</p>
          </div>
          <div className="text-center p-4 border-l border-stone-200">
            <p className="text-3xl font-black text-amber-500 font-mono">25+</p>
            <p className="text-xs text-stone-600 font-bold uppercase tracking-wider mt-1">Certified Courses</p>
          </div>
        </div>
      </div>

      {/* 3. WHY CHOOSE US */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold text-orange-600 uppercase tracking-widest">Our Core Strengths</span>
          <h2 className="text-3xl font-black text-stone-900">Why Choose Oritech Computer?</h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto font-medium">
            We bridge the gap between academic theory and real-world IT industry skills with state-of-the-art lab infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {whyChooseUs.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group p-5 bg-white border border-stone-200 hover:border-amber-400 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex items-center sm:items-start gap-4"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-stone-900 leading-snug">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. POPULAR COURSES PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <span className="text-xs text-orange-600 font-extrabold uppercase tracking-widest">Featured Curriculums</span>
            <h2 className="text-3xl font-black text-stone-900 mt-1">Popular Career Programs</h2>
          </div>
          <button
            onClick={() => onNavigate('/courses')}
            className="flex items-center gap-2 text-xs font-extrabold text-stone-800 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <span>View All Courses</span>
            <ArrowRight className="w-4 h-4 text-orange-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <CourseCardSkeleton />
              <CourseCardSkeleton />
              <CourseCardSkeleton />
            </>
          ) : !popularCourses || popularCourses.length === 0 ? (
            <div className="col-span-full py-12 px-6 bg-white border border-stone-200 rounded-2xl text-center space-y-2">
              <p className="text-sm font-bold text-stone-900">No courses listed yet</p>
              <p className="text-xs text-stone-500 font-medium">New career programs will appear here once added in the Admin Panel.</p>
            </div>
          ) : (
            popularCourses.map((course) => (
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
                      src={course.thumbnail || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'}
                      alt={course.title || 'Course'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-lg text-xs font-mono font-extrabold shadow-md">
                      ₹{Number(course.fee || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-stone-900/90 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border border-amber-400/30">
                      {course.category || 'General'}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-500 font-mono font-semibold">
                      <span>Code: {course.code || 'CERT'}</span>
                      <span>Duration: {course.duration || '3 Months'}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                      {course.title || 'Certification Course'}
                    </h3>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{course.description || 'Comprehensive practical computer training.'}</p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEnroll(course);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-orange-500/20 text-center flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 5. STUDENT TESTIMONIALS & SOCIAL PROOF */}
      <Testimonials onOpenEnroll={() => onOpenEnroll()} onNavigate={onNavigate} />
    </div>
  );
};

