import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  BookOpen,
  Video,
  UserPlus,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Users,
  FileText,
  Award,
  Inbox,
  MessageSquare,
  PhoneCall,
  Menu,
  X,
  ChevronRight,
  Database,
  GraduationCap,
  Bell,
  Activity,
  Image as ImageIcon,
} from 'lucide-react';
import { Course, Student, ContactEnquiry, SliderImage } from '../types';
import { apiFetch } from '../lib/api';
import { fsSubscribeCourses, fsSubscribeStudents, fsSubscribeEnquiries, fsSubscribeSliderImages } from '../lib/firestoreService';
import { CourseManagement } from '../components/admin/CourseManagement';
import { CourseResources } from '../components/admin/CourseResources';
import { StudentRegistration } from '../components/admin/StudentRegistration';
import { CertificateManagement } from '../components/admin/CertificateManagement';
import { EnquiryManagement } from '../components/admin/EnquiryManagement';
import { BannerManagement } from '../components/admin/BannerManagement';
import { LogoManagement } from '../components/admin/LogoManagement';

type AdminTab = 'students' | 'courses' | 'resources' | 'certificates' | 'enquiries' | 'banners' | 'logo';

interface MenuItem {
  id: AdminTab;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  category: 'core' | 'academic' | 'leads';
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('students');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [unreadEnquiriesCount, setUnreadEnquiriesCount] = useState<number>(0);
  const [bannersCount, setBannersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCourseForResources, setSelectedCourseForResources] = useState<string | null>(null);
  const [prefillStudentData, setPrefillStudentData] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    courseId?: string;
  } | null>(null);

  const fetchCoursesAndStudents = async () => {
    setIsRefreshing(true);
    try {
      const [coursesData, studentsData, enquiriesData, bannersData] = await Promise.all([
        apiFetch<Course[]>('/api/courses'),
        apiFetch<Student[]>('/api/students'),
        apiFetch<ContactEnquiry[]>('/api/enquiries').catch(() => []),
        apiFetch<SliderImage[]>('/api/sliders').catch(() => []),
      ]);
      setCourses(coursesData || []);
      setStudents(studentsData || []);
      if (Array.isArray(enquiriesData)) {
        const newCount = enquiriesData.filter((e) => e.status === 'New').length;
        setUnreadEnquiriesCount(newCount);
      }
      if (Array.isArray(bannersData)) {
        setBannersCount(bannersData.length);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchCoursesAndStudents();

    const unsubCourses = fsSubscribeCourses((liveCourses) => {
      setCourses(liveCourses);
      setLoading(false);
    });

    const unsubStudents = fsSubscribeStudents((liveStudents) => {
      setStudents(liveStudents);
      setLoading(false);
    });

    const unsubEnquiries = fsSubscribeEnquiries((liveEnquiries) => {
      if (Array.isArray(liveEnquiries)) {
        const newCount = liveEnquiries.filter((e) => e.status === 'New').length;
        setUnreadEnquiriesCount(newCount);
      }
    });

    const unsubBanners = fsSubscribeSliderImages((liveBanners) => {
      if (Array.isArray(liveBanners)) {
        setBannersCount(liveBanners.length);
      }
    });

    return () => {
      unsubCourses();
      unsubStudents();
      unsubEnquiries();
      unsubBanners();
    };
  }, []);

  const handleSelectCourseForResources = (courseId: string) => {
    setSelectedCourseForResources(courseId);
    setActiveTab('resources');
  };

  const handleConvertToStudent = (enquiry: ContactEnquiry) => {
    setPrefillStudentData({
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      courseId: enquiry.courseId,
    });
    setActiveTab('students');
  };

  const menuItems: MenuItem[] = [
    {
      id: 'students',
      title: 'Student Registration & Accounts',
      shortTitle: 'Students & Accounts',
      description: 'Admissions, Roll numbers & Auth',
      icon: UserPlus,
      badge: students.length > 0 ? `${students.length}` : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700',
      category: 'core',
    },
    {
      id: 'courses',
      title: 'Course Management',
      shortTitle: 'Courses',
      description: 'Fees, Syllabus, Durations & Catalog',
      icon: BookOpen,
      badge: courses.length > 0 ? `${courses.length}` : undefined,
      badgeColor: 'bg-slate-100 text-slate-700',
      category: 'core',
    },
    {
      id: 'resources',
      title: 'Videos & Notes Uploader',
      shortTitle: 'Study Materials',
      description: 'Video lectures & PDF modules',
      icon: Video,
      category: 'academic',
    },
    {
      id: 'certificates',
      title: 'Certification Uploader',
      shortTitle: 'Certificates',
      description: 'Issue credentials & verification IDs',
      icon: Award,
      category: 'academic',
    },
    {
      id: 'enquiries',
      title: 'Inquiries & Leads',
      shortTitle: 'Inquiries & Leads',
      description: 'Admission leads & follow-ups',
      icon: Inbox,
      badge: unreadEnquiriesCount > 0 ? `${unreadEnquiriesCount} New` : undefined,
      badgeColor: 'bg-amber-500 text-white animate-pulse',
      category: 'leads',
    },
    {
      id: 'banners',
      title: 'Hero Banners & Sliders',
      shortTitle: 'Banners & Sliders',
      description: 'Add & manage homepage slider images (links only)',
      icon: ImageIcon,
      badge: bannersCount > 0 ? `${bannersCount}` : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700',
      category: 'academic',
    },
    {
      id: 'logo',
      title: 'Institute Logo Link',
      shortTitle: 'Logo Link',
      description: 'Configure global institute logo image link (Navbar, Footer, Sign In)',
      icon: Sparkles,
      category: 'core',
    },
  ];

  const currentMenuItem = menuItems.find((m) => m.id === activeTab) || menuItems[0];
  const CurrentIcon = currentMenuItem.icon;

  const handleTabSelect = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    // Smooth scroll to top of content area on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-stone-50 py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span>Institute Administration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Admin Control Center
              </h1>
              <p className="text-stone-500 text-xs sm:text-sm mt-1 font-medium max-w-xl leading-relaxed">
                Manage courses, student accounts, study materials, certificates, banners, and admission leads with direct Firestore synchronization.
              </p>
            </div>

            {/* Quick Metrics & Refresh */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => handleTabSelect('enquiries')}
                className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'enquiries'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-amber-50 border-amber-200/80 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Inbox className="w-4 h-4 text-orange-600 shrink-0" />
                <span>{unreadEnquiriesCount} New Inquiries</span>
                {unreadEnquiriesCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTabSelect('banners')}
                className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'banners'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-amber-50/80 border-amber-200/80 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-orange-600 shrink-0" />
                <span>{bannersCount} Banners</span>
              </button>

              <div className="px-3.5 py-2 rounded-2xl bg-stone-100 border border-stone-200 flex items-center gap-2 text-xs font-bold text-stone-900">
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{courses.length} Courses</span>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2 text-xs font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Firestore Connected</span>
                <span className="sm:hidden">Live</span>
              </div>

              <button
                type="button"
                onClick={fetchCoursesAndStudents}
                disabled={isRefreshing}
                className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-60"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Burger Bar (Visible on mobile/tablet screens < lg) */}
        <div className="lg:hidden bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
            <span>Admin Menu</span>
            {unreadEnquiriesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-stone-900 text-amber-400 text-[10px] font-black">
                {unreadEnquiriesCount}
              </span>
            )}
          </button>

          {/* Active section label on mobile */}
          <div className="flex items-center gap-2 min-w-0 pr-1">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <CurrentIcon className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <span className="text-xs font-bold text-stone-800 truncate">
              {currentMenuItem.shortTitle}
            </span>
          </div>
        </div>

        {/* Mobile Slide-In Animated Menu Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-stone-950/50 backdrop-blur-xs lg:hidden"
              />

              {/* Drawer from Left */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                className="fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col lg:hidden"
              >
                {/* Drawer Header */}
                <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-stone-900">Admin Modules</h2>
                      <p className="text-[11px] text-stone-400 font-medium">Select a section to manage</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Menu List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 px-3 pt-2">
                    Management Sections
                  </p>
                  {menuItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTabSelect(item.id)}
                        className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                            : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-amber-50 text-orange-600 border border-amber-200'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-black truncate ${isActive ? 'text-white' : 'text-stone-900'}`}>
                              {item.title}
                            </p>
                            <p className={`text-[11px] truncate ${isActive ? 'text-amber-100' : 'text-stone-400'}`}>
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                              isActive ? 'bg-white text-orange-700' : item.badgeColor || 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Drawer Footer Status */}
                <div className="p-4 border-t border-stone-100 bg-stone-50/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Firestore Sync: Active</span>
                    </div>
                    <button
                      type="button"
                      onClick={fetchCoursesAndStudents}
                      className="text-orange-600 hover:text-orange-700 text-xs font-bold cursor-pointer"
                    >
                      Sync Now
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Layout with Left Vertical Sidebar on Desktop */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Desktop Left-Side Vertical Navigation Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24 space-y-4">
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs space-y-2">
              <div className="px-3 pt-2 pb-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                  Admin Navigation
                </p>
              </div>

              <div className="space-y-1.5">
                {menuItems.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabSelect(item.id)}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                          : 'hover:bg-stone-100/90 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-50 text-orange-600 border border-amber-200/80 group-hover:bg-amber-100'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-black truncate ${isActive ? 'text-white' : 'text-stone-900'}`}>
                            {item.shortTitle}
                          </p>
                          <p className={`text-[10px] truncate ${isActive ? 'text-amber-100' : 'text-stone-400'}`}>
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {item.badge ? (
                        <span
                          className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                            isActive ? 'bg-white text-orange-700' : item.badgeColor || 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isActive ? 'text-white' : 'text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sidebar Database Connection Badge */}
              <div className="pt-3 border-t border-stone-100 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-stone-600">Database: Active</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-orange-600 uppercase">
                    default
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Helper Summary Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/70 rounded-3xl p-4.5 text-xs text-stone-900 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 font-black text-amber-900">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>Instant Auto-Sync</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed font-medium">
                Changes saved in these sections automatically reflect on the student portal and public website in real time.
              </p>
            </div>
          </aside>

          {/* Right Main Content View */}
          <main className="flex-1 min-w-0 w-full space-y-6">
            {loading ? (
              <div className="bg-white border border-stone-200 rounded-3xl p-16 text-center shadow-xs">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-stone-600">Loading administration modules...</p>
              </div>
            ) : (
              <div className="transition-opacity duration-200">
                {activeTab === 'students' && (
                  <StudentRegistration
                    courses={courses}
                    onRefresh={fetchCoursesAndStudents}
                    initialStudentData={prefillStudentData}
                  />
                )}

                {activeTab === 'courses' && (
                  <CourseManagement
                    courses={courses}
                    onRefreshCourses={fetchCoursesAndStudents}
                    onSelectCourseForResources={handleSelectCourseForResources}
                  />
                )}

                {activeTab === 'resources' && (
                  <CourseResources
                    courses={courses}
                    initialSelectedCourseId={selectedCourseForResources}
                  />
                )}

                {activeTab === 'certificates' && (
                  <CertificateManagement
                    students={students}
                    courses={courses}
                    onRefresh={fetchCoursesAndStudents}
                  />
                )}

                {activeTab === 'enquiries' && (
                  <EnquiryManagement
                    courses={courses}
                    onConvertToStudent={handleConvertToStudent}
                  />
                )}

                {activeTab === 'banners' && (
                  <BannerManagement
                    onRefresh={fetchCoursesAndStudents}
                  />
                )}

                {activeTab === 'logo' && (
                  <LogoManagement
                    onRefresh={fetchCoursesAndStudents}
                  />
                )}
              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  );
};


