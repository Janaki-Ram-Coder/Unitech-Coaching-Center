import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Clock,
  IndianRupee,
  Video,
  FileText,
  Star,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Layers,
  GraduationCap,
  ArrowUp,
  ArrowDown,
  ListOrdered,
} from 'lucide-react';
import { Course } from '../../types';
import { useToast } from '../../lib/ToastContext';
import {
  fsSaveCourse,
  fsUpdateCourse,
  fsDeleteCourse,
} from '../../lib/firestoreService';

interface CourseManagementProps {
  courses: Course[];
  onRefreshCourses: () => Promise<void>;
  onSelectCourseForResources: (courseId: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Programming & Software',
  'Accounting & Finance',
  'Office & Basic Skills',
  'Design & Multimedia',
  'Hardware & Networking',
  'Data Science & AI',
];

const PRESET_THUMBNAILS = [
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
];

export const CourseManagement: React.FC<CourseManagementProps> = ({
  courses,
  onRefreshCourses,
  onSelectCourseForResources,
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [modalError, setModalError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [duration, setDuration] = useState('3 Months');
  const [fee, setFee] = useState('15000');
  const [level, setLevel] = useState('Beginner to Intermediate');
  const [prerequisites, setPrerequisites] = useState('Basic Computer Literacy');
  const [description, setDescription] = useState('');
  const [modulesList, setModulesList] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState(PRESET_THUMBNAILS[0]);
  const [popular, setPopular] = useState(false);

  const categories = ['All', ...Array.from(new Set(courses.map((c) => c.category).concat(DEFAULT_CATEGORIES)))];

  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setTitle('');
    setCode(`ORI-${Math.floor(100 + Math.random() * 900)}`);
    setCategory(DEFAULT_CATEGORIES[0]);
    setDuration('3 Months');
    setFee('15000');
    setLevel('Beginner to Intermediate');
    setPrerequisites('Basic Computer Literacy');
    setDescription('');
    setModulesList([]);
    setThumbnail(PRESET_THUMBNAILS[Math.floor(Math.random() * PRESET_THUMBNAILS.length)]);
    setPopular(false);
    setActionError('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setCode(course.code);
    setCategory(course.category);
    setDuration(course.duration);
    setFee(course.fee.toString());
    setLevel(course.level || 'Beginner to Intermediate');
    setPrerequisites(course.prerequisites || 'Basic Computer Literacy');
    setDescription(course.description || '');
    
    // Parse syllabus array
    let parsedSyllabus: string[] = [];
    if (Array.isArray(course.syllabus)) {
      parsedSyllabus = course.syllabus.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof course.syllabus === 'string') {
      parsedSyllabus = (course.syllabus as string)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (parsedSyllabus.length === 0) {
      parsedSyllabus = ['Module 1: General Curriculum'];
    }
    setModulesList(parsedSyllabus);

    setThumbnail(course.thumbnail || PRESET_THUMBNAILS[0]);
    setPopular(course.popular || false);
    setActionError('');
    setModalError('');
    setIsModalOpen(true);
  };

  // Module List Manipulation Handlers
  const handleAddModule = () => {
    setModulesList((prev) => [...prev, '']);
  };

  const handleUpdateModule = (index: number, value: string) => {
    setModulesList((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleRemoveModule = (index: number) => {
    setModulesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    setModulesList((prev) => {
      const updated = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setModalError('');
    setActionSuccess('');

    if (!title.trim()) {
      setModalError('Course title is required.');
      return;
    }
    if (fee === '' || isNaN(Number(fee)) || Number(fee) < 0) {
      setModalError('Please enter a valid course fee (0 or positive number).');
      return;
    }
    if (!duration.trim()) {
      setModalError('Course duration is required.');
      return;
    }

    setLoading(true);

    const validModules = modulesList
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload: Course = {
      id: editingCourse ? editingCourse.id : `course-${Date.now()}`,
      title: title.trim(),
      code: code.trim() || `ORI-${Math.floor(100 + Math.random() * 900)}`,
      category: category.trim(),
      duration: duration.trim(),
      fee: Number(fee),
      level: level.trim(),
      prerequisites: prerequisites.trim(),
      description: description.trim(),
      syllabus: validModules.length > 0 ? validModules : ['General Curriculum Modules'],
      thumbnail: thumbnail.trim() || PRESET_THUMBNAILS[0],
      popular,
    };

    try {
      if (editingCourse) {
        await fsUpdateCourse(editingCourse.id, payload);
        setActionSuccess(`Course "${payload.title}" updated successfully in Firestore.`);
        toast.courseUpdated(payload.title);
      } else {
        await fsSaveCourse(payload);
        setActionSuccess(`New course "${payload.title}" saved to Firestore.`);
        toast.courseCreated(payload.title);
      }

      // Close modal first for instant smooth UI response
      setIsModalOpen(false);

      // Trigger non-blocking refresh
      try {
        await onRefreshCourses();
      } catch (_) {}

      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('permission') || errMsg.includes('Permission') || errMsg.includes('PERMISSION_DENIED')) {
        const helpfulMsg = 'Firestore write permission denied. In Firebase Console, go to the "Security" tab and set rules to "allow read, write: if true;" then click Publish.';
        setModalError(helpfulMsg);
        setActionError(helpfulMsg);
        toast.error('Permission Denied', helpfulMsg);
      } else {
        setModalError(errMsg || 'Failed to save course to Firestore.');
        setActionError(errMsg || 'Failed to save course.');
        toast.error('Failed to Save Course', errMsg || 'An error occurred while saving the course to Firestore.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteCourse = async () => {
    if (!deleteTarget) return;

    const { id: courseId, title: courseTitle } = deleteTarget;
    setIsDeletingId(courseId);
    try {
      await fsDeleteCourse(courseId);

      setActionSuccess(`Course "${courseTitle}" deleted from Firestore.`);
      toast.courseDeleted(courseTitle);
      setDeleteTarget(null);
      await onRefreshCourses();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete course.');
      toast.error('Delete Course Failed', err.message || 'Could not delete course from Firestore.');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-red-700 hover:text-red-950 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Action & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by course title, code, or topic..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filters & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Course</span>
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No courses found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm || selectedCategory !== 'All'
              ? 'Try adjusting your search or category filter.'
              : 'Click "Add New Course" to publish your first institute course.'}
          </p>
          {!searchTerm && selectedCategory === 'All' && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Course</span>
              </button>
            </div>
          )}
          {(searchTerm || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="mt-4 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Course Card Thumbnail */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-600/90 text-white font-mono text-[11px] font-bold tracking-wider backdrop-blur-xs">
                    {course.code}
                  </span>
                  {course.popular && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Popular</span>
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <span className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg font-medium">
                    {course.category}
                  </span>
                  <span className="bg-indigo-950/80 px-2.5 py-1 rounded-lg font-extrabold text-indigo-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{course.duration}</span>
                  </span>
                </div>
              </div>

              {/* Course Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 font-medium">
                    {course.description || 'Comprehensive certified course designed for career readiness.'}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-emerald-700 font-extrabold text-base">
                      <span className="text-xs text-slate-400 font-normal">Fee:</span>
                      <span className="font-mono">₹{course.fee.toLocaleString()}</span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {course.level || 'All Levels'}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectCourseForResources(course.id)}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Manage Videos & Notes</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(course)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDeletingId === course.id}
                      onClick={() => setDeleteTarget({ id: course.id, title: course.title })}
                      className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Delete Course</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-slate-900">"{deleteTarget.title}"</span>?
              </p>
              <p className="text-[11px] text-red-600 font-semibold bg-red-50 p-2 rounded-xl border border-red-100 mt-2">
                All associated videos, syllabus topics, and notes for this course will be removed.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingId !== null}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingId !== null}
                onClick={handleConfirmDeleteCourse}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingId ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 sm:px-8 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black">
                  {editingCourse ? 'Edit Course Details' : 'Create New Course'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingCourse ? 'Update curriculum, pricing, or metadata' : 'Fill in the course syllabus, fees, and info'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCourse} className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-semibold flex items-start gap-2.5 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Error Publishing Course</p>
                    <p className="mt-0.5 text-xs text-red-700 leading-relaxed">{modalError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalError('')}
                    className="text-red-700 hover:text-red-950 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Full Stack Web & AI Development"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g., ORI-201"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Programming & Software"
                    list="category-presets"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                  <datalist id="category-presets">
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration *
                  </label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 3 Months (120 Hours)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Course Fee (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="e.g., 18000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Beginner to Intermediate">Beginner to Intermediate</option>
                    <option value="Intermediate to Advanced">Intermediate to Advanced</option>
                    <option value="Advanced / Professional">Advanced / Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Prerequisites
                  </label>
                  <input
                    type="text"
                    value={prerequisites}
                    onChange={(e) => setPrerequisites(e.target.value)}
                    placeholder="e.g., Basic Computer Literacy / 10th Pass"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Course Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a comprehensive summary of key skills taught and job readiness..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-medium resize-none"
                />
              </div>

              {/* List-Based Syllabus Modules Builder */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-indigo-600" />
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Course Syllabus & Modules List ({modulesList.length}) *
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Add topics in sequential learning order
                  </span>
                </div>

                {modulesList.length === 0 ? (
                  <div className="text-center py-6 px-4 bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                    <p className="font-bold text-slate-700">No syllabus modules added yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click the "+ Add New Module" button below to add topics one by one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {modulesList.map((moduleItem, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200/90 shadow-2xs group hover:border-indigo-300 transition-colors"
                      >
                        {/* Order Badge */}
                        <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                          {idx + 1}
                        </span>

                        {/* Topic Name Input */}
                        <input
                          type="text"
                          value={moduleItem}
                          onChange={(e) => handleUpdateModule(idx, e.target.value)}
                          placeholder={`e.g. Module ${idx + 1}: Topic title / curriculum unit`}
                          className="flex-1 bg-transparent px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400"
                        />

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveModule(idx, 'up')}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === modulesList.length - 1}
                            onClick={() => handleMoveModule(idx, 'down')}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove Module Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveModule(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors ml-1"
                            title="Remove Module"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Module Button */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Module</span>
                  </button>
                </div>
              </div>

              {/* Thumbnail Selection */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Thumbnail Image URL
                </label>
                <input
                  type="url"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                />

                <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">Presets:</span>
                  {PRESET_THUMBNAILS.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setThumbnail(img)}
                      className={`w-10 h-8 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        thumbnail === img ? 'border-indigo-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured / Popular Checkbox */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popular}
                    onChange={(e) => setPopular(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Mark as Popular / Featured Course on Homepage
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingCourse ? 'Save Changes' : 'Publish Course'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
