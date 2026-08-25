import React, { useState, useEffect, useMemo } from 'react';
import {
  Video,
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Play,
  ExternalLink,
  BookOpen,
  Check,
  X,
  AlertCircle,
  Clock,
  Layers,
  FolderOpen,
  Download,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import { Course, LearningResource } from '../../types';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../lib/ToastContext';

interface CourseResourcesProps {
  courses: Course[];
  initialSelectedCourseId?: string | null;
}

export const CourseResources: React.FC<CourseResourcesProps> = ({
  courses,
  initialSelectedCourseId,
}) => {
  const toast = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialSelectedCourseId || (courses.length > 0 ? courses[0].id : '')
  );
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'video' | 'pdf'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'video' | 'pdf'>('video');
  const [editingResource, setEditingResource] = useState<LearningResource | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Form State
  const [formCourseId, setFormCourseId] = useState('');
  const [formModule, setFormModule] = useState('');
  const [isCustomModule, setIsCustomModule] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDuration, setFormDuration] = useState('25');
  const [formFileSize, setFormFileSize] = useState('4.5');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState('1');
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formPdfTitle, setFormPdfTitle] = useState('');

  useEffect(() => {
    if (initialSelectedCourseId) {
      setSelectedCourseId(initialSelectedCourseId);
    }
  }, [initialSelectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchResources(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchResources = async (courseId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<LearningResource[]>(`/api/resources?courseId=${courseId}`);
      setResources(data || []);
    } catch (err: any) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId);
  }, [courses, selectedCourseId]);

  // Extract syllabus modules for the current course
  const currentCourseModules = useMemo(() => {
    if (!currentCourse) return [];
    if (Array.isArray(currentCourse.syllabus)) {
      return currentCourse.syllabus.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof currentCourse.syllabus === 'string') {
      return (currentCourse.syllabus as string)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [currentCourse]);

  // Extract syllabus modules for the form's chosen course
  const formCourse = useMemo(() => {
    return courses.find((c) => c.id === formCourseId);
  }, [courses, formCourseId]);

  const formCourseModules = useMemo(() => {
    if (!formCourse) return [];
    if (Array.isArray(formCourse.syllabus)) {
      return formCourse.syllabus.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof formCourse.syllabus === 'string') {
      return (formCourse.syllabus as string)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [formCourse]);

  const handleOpenAddModal = (type: 'video' | 'pdf', targetModule?: string) => {
    setEditingResource(null);
    setModalType(type);
    const targetCourseId = selectedCourseId || (courses.length > 0 ? courses[0].id : '');
    setFormCourseId(targetCourseId);

    const c = courses.find((crs) => crs.id === targetCourseId);
    const availableMods = Array.isArray(c?.syllabus)
      ? c.syllabus.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const defaultModule = targetModule || (availableMods.length > 0 ? availableMods[0] : 'Module 1: Core Concepts & Practice');
    setFormModule(defaultModule);
    setIsCustomModule(!availableMods.includes(defaultModule));

    setFormTitle('');
    setFormUrl('');
    setFormDuration(type === 'video' ? '30' : '');
    setFormFileSize(type === 'pdf' ? '5.0' : '');
    setFormDescription('');
    setFormOrder(String(resources.filter((r) => r.type === type).length + 1));
    setFormPdfUrl('');
    setFormPdfTitle('');
    setActionError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (resource: LearningResource) => {
    setEditingResource(resource);
    setModalType(resource.type);
    setFormCourseId(resource.courseId);
    
    const c = courses.find((crs) => crs.id === resource.courseId);
    const availableMods = Array.isArray(c?.syllabus)
      ? c.syllabus.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const mod = resource.moduleName || 'General Module';
    setFormModule(mod);
    setIsCustomModule(!availableMods.includes(mod));

    setFormTitle(resource.title);
    setFormUrl(resource.url);
    setFormDuration(resource.durationMinutes ? String(resource.durationMinutes) : '');
    setFormFileSize(resource.fileSizeMb ? String(resource.fileSizeMb) : '');
    setFormDescription(resource.description || '');
    setFormOrder(resource.order ? String(resource.order) : '1');
    setFormPdfUrl(resource.pdfUrl || '');
    setFormPdfTitle(resource.pdfTitle || '');
    setActionError('');
    setIsAddModalOpen(true);
  };

  const handleFormCourseChange = (newCourseId: string) => {
    setFormCourseId(newCourseId);
    const c = courses.find((crs) => crs.id === newCourseId);
    const availableMods = Array.isArray(c?.syllabus)
      ? c.syllabus.map((s) => String(s).trim()).filter(Boolean)
      : [];
    if (availableMods.length > 0) {
      setFormModule(availableMods[0]);
      setIsCustomModule(false);
    } else {
      setFormModule('Module 1: General Module');
      setIsCustomModule(false);
    }
  };

  const handleSubmitResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!formCourseId) {
      setActionError('Please select a target course.');
      return;
    }
    if (!formModule.trim()) {
      setActionError('Please select or specify a module.');
      return;
    }
    if (!formTitle.trim()) {
      setActionError('Resource title is required.');
      return;
    }
    if (!formUrl.trim()) {
      setActionError('Resource URL / link is required.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      courseId: formCourseId,
      type: modalType,
      title: formTitle.trim(),
      moduleName: formModule.trim(),
      url: formUrl.trim(),
      description: formDescription.trim(),
      durationMinutes: modalType === 'video' && formDuration ? Number(formDuration) : undefined,
      fileSizeMb: modalType === 'pdf' && formFileSize ? Number(formFileSize) : undefined,
      order: formOrder ? Number(formOrder) : undefined,
      pdfUrl: formPdfUrl.trim() || undefined,
      pdfTitle: formPdfTitle.trim() || undefined,
    };

    try {
      if (editingResource) {
        await apiFetch(`/api/resources/${editingResource.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setActionSuccess(`Resource "${payload.title}" updated successfully.`);
        toast.success('Resource Updated', 'Resource details and attachments saved.', payload.title);
      } else {
        await apiFetch('/api/resources', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setActionSuccess(`New ${modalType === 'video' ? 'video lesson' : 'study notes'} uploaded to "${payload.moduleName}".`);
        toast.resourceUploaded(payload.title, modalType);
      }

      await fetchResources(selectedCourseId);
      setIsAddModalOpen(false);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save resource.');
      toast.error('Resource Upload Failed', err.message || 'Could not save resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (resourceId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await apiFetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
      });
      setActionSuccess(`Deleted "${title}".`);
      toast.resourceDeleted(title);
      await fetchResources(selectedCourseId);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete resource.');
      toast.error('Delete Resource Failed', err.message || 'Could not delete resource.');
    }
  };

  // Group resources by module
  const filteredResources = resources.filter((r) => {
    const matchesFilter = filterType === 'all' || r.type === filterType;
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Combine syllabus modules with any extra modules present in existing resources
  const allDisplayModules = useMemo(() => {
    const resourceModules = Array.from(new Set(resources.map((r) => r.moduleName || 'General Module')));
    const combined = [...currentCourseModules];
    resourceModules.forEach((m) => {
      if (!combined.includes(m)) {
        combined.push(m);
      }
    });
    return combined.length > 0 ? combined : ['General Curriculum'];
  }, [currentCourseModules, resources]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
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

      {/* Course Selector & Primary Actions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
        <div className="flex-1 max-w-xl">
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Select Course to Manage Materials</span>
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.code}) - {course.duration}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Add Video & Add Notes */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenAddModal('video')}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Upload Video Lesson</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal('pdf')}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Upload Notes / PDF</span>
          </button>
        </div>
      </div>

      {/* Course Modules Summary Banner */}
      {currentCourse && (
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold font-mono">
                {currentCourse.code}
              </span>
              <span className="text-xs text-slate-400 font-semibold">Configured Syllabus Modules:</span>
              <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">
                {currentCourseModules.length} Modules
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">{currentCourse.title}</h3>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300">Total Videos:</span>
              <span className="font-bold text-white">{resources.filter((r) => r.type === 'video').length}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">Total Files:</span>
              <span className="font-bold text-white">{resources.filter((r) => r.type === 'pdf').length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Type Toggle Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Materials ({resources.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('video')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              filterType === 'video' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos ({resources.filter((r) => r.type === 'video').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('pdf')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              filterType === 'pdf' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Notes ({resources.filter((r) => r.type === 'pdf').length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search lessons & notes..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Content Modules & List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">Loading course materials...</p>
        </div>
      ) : allDisplayModules.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No modules found for this course</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Add syllabus modules to <span className="font-bold text-slate-700">{currentCourse?.title || 'this course'}</span> in Course Management, then upload video lessons and PDF notes per module.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {allDisplayModules.map((modName, idx) => {
            const moduleItems = filteredResources.filter((r) => (r.moduleName || 'General Module') === modName);
            const isSyllabusModule = currentCourseModules.includes(modName);

            return (
              <div key={modName || idx} className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                {/* Module Title Header with Quick Upload Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-slate-900">{modName}</h3>
                        {isSyllabusModule && (
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                            Course Syllabus
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-400">
                        {moduleItems.length} {moduleItems.length === 1 ? 'material uploaded' : 'materials uploaded'}
                      </span>
                    </div>
                  </div>

                  {/* Module Quick Upload Shortcuts */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal('video', modName)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title={`Upload Video Lesson to "${modName}"`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>+ Add Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAddModal('pdf', modName)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title={`Upload PDF / Notes to "${modName}"`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>+ Add Notes</span>
                    </button>
                  </div>
                </div>

                {/* Module Items List or Empty State */}
                {moduleItems.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span>No materials uploaded for this module yet.</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAddModal('video', modName)}
                        className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Upload Video
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => handleOpenAddModal('pdf', modName)}
                        className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        Upload Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {moduleItems.map((res) => (
                      <div
                        key={res.id}
                        className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Left: Icon & Title & Description */}
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                              res.type === 'video'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {res.type === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900 truncate">{res.title}</h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  res.type === 'video'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {res.type === 'video' ? 'VIDEO LESSON' : 'PDF NOTES'}
                              </span>
                              {res.durationMinutes && (
                                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{res.durationMinutes} mins</span>
                                </span>
                              )}
                              {res.fileSizeMb && (
                                <span className="text-[11px] font-medium text-slate-500 font-mono">
                                  {res.fileSizeMb} MB
                                </span>
                              )}
                            </div>

                            {res.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
                                {res.description}
                              </p>
                            )}

                            {res.pdfUrl && (
                              <p className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span>Attached Study Notes: {res.pdfTitle || 'Download Lecture Notes'}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {res.type === 'video' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewVideoUrl(res.url)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Preview Video</span>
                              </button>
                              {res.pdfUrl && (
                                <a
                                  href={res.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Open PDF</span>
                                </a>
                              )}
                            </>
                          ) : (
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Open Link</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(res)}
                            className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                            title="Edit Resource"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteResource(res.id, res.title)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title="Delete Resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 sm:px-8 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  {modalType === 'video' ? (
                    <Video className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-emerald-400" />
                  )}
                  <span>
                    {editingResource
                      ? `Edit ${modalType === 'video' ? 'Video Lesson' : 'Study Notes'}`
                      : `Upload ${modalType === 'video' ? 'New Video Lesson' : 'New Study Notes'}`}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign materials directly to course syllabus modules
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitResource} className="p-6 sm:p-8 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Course Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Course *
                  </label>
                  <select
                    value={formCourseId}
                    onChange={(e) => handleFormCourseChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.code}) - {c.duration}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module Selection / Creation based on course syllabus */}
                <div className="sm:col-span-2 space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Select Course Module / Topic *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomModule(!isCustomModule)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      {isCustomModule ? 'Choose from Course Modules' : '+ Custom Topic Name'}
                    </button>
                  </div>

                  {!isCustomModule && formCourseModules.length > 0 ? (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {formCourseModules.map((mod, idx) => {
                        const isSelected = formModule === mod;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormModule(mod)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-5 h-5 rounded-md font-mono text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className="truncate">{mod}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formModule}
                      onChange={(e) => setFormModule(e.target.value)}
                      placeholder="e.g. Module 1: Python Core Foundations"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                    />
                  )}
                  <p className="text-[11px] text-slate-500 font-medium">
                    This file or lesson will appear grouped under this module in the student portal.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    {modalType === 'video' ? 'Video Lesson Title *' : 'Document / Notes Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={
                      modalType === 'video'
                        ? 'e.g. Lecture 01: Python Variables and Data Structures'
                        : 'e.g. Comprehensive Handbook & Cheat-Sheet (PDF)'
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    {modalType === 'video' ? 'Video URL / Stream Link *' : 'PDF / Document URL *'}
                  </label>
                  <input
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports YouTube, Vimeo, Google Drive, direct MP4/PDF links, or cloud storage endpoints.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lesson Order # (Sequence)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                    placeholder="1"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                  />
                </div>

                {modalType === 'video' && (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                )}

                {modalType === 'pdf' && (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Estimated File Size (MB)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formFileSize}
                      onChange={(e) => setFormFileSize(e.target.value)}
                      placeholder="e.g. 4.5"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description & Key Highlights
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of what will be learned in this material..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 resize-none font-medium"
                  />
                </div>

                {/* For Video: Optional Attached Notes */}
                {modalType === 'video' && (
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                    <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider block">
                      Optional Attached Handout / PDF Notes for this Video
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={formPdfTitle}
                          onChange={(e) => setFormPdfTitle(e.target.value)}
                          placeholder="Handout Title (e.g. Lecture 01 Slides)"
                          className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <input
                          type="url"
                          value={formPdfUrl}
                          onChange={(e) => setFormPdfUrl(e.target.value)}
                          placeholder="PDF Link (https://...)"
                          className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingResource ? 'Save Resource' : 'Upload Resource'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="p-4 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                <span>Video Lesson Preview</span>
              </span>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {previewVideoUrl.includes('youtube.com') || previewVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={
                    previewVideoUrl.includes('watch?v=')
                      ? previewVideoUrl.replace('watch?v=', 'embed/')
                      : previewVideoUrl.replace('youtu.be/', 'www.youtube.com/embed/')
                  }
                  className="w-full h-full"
                  allowFullScreen
                  title="Video preview"
                />
              ) : (
                <video src={previewVideoUrl} controls autoPlay className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
