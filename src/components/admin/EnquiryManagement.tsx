import React, { useState, useEffect, useMemo } from 'react';
import {
  Inbox,
  Search,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  CheckCircle2,
  Clock,
  UserPlus,
  Trash2,
  Edit3,
  Filter,
  Download,
  Plus,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Calendar,
  Sparkles,
  ChevronDown,
  X,
  Send,
  HelpCircle,
  UserCheck,
  Building,
  PhoneCall,
  StickyNote,
} from 'lucide-react';
import { ContactEnquiry, Course } from '../../types';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../lib/ToastContext';

interface EnquiryManagementProps {
  courses: Course[];
  onConvertToStudent?: (enquiry: ContactEnquiry) => void;
}

export const EnquiryManagement: React.FC<EnquiryManagementProps> = ({
  courses,
  onConvertToStudent,
}) => {
  const toast = useToast();
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'New' | 'Contacted' | 'Enrolled' | 'Closed'>('All');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Modal States
  const [selectedEnquiryForDetail, setSelectedEnquiryForDetail] = useState<ContactEnquiry | null>(null);
  const [editingNotesEnquiry, setEditingNotesEnquiry] = useState<ContactEnquiry | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Manual Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newSource, setNewSource] = useState('Walk-in / Front Desk');
  const [newStatus, setNewStatus] = useState<'New' | 'Contacted' | 'Enrolled'>('New');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [addError, setAddError] = useState('');

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState<ContactEnquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEnquiries = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await apiFetch<ContactEnquiry[]>('/api/enquiries');
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load enquiries:', err);
      toast.error('Failed to fetch inquiry submissions: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Update Status Handler
  const handleUpdateStatus = async (enquiry: ContactEnquiry, newStatus: 'New' | 'Contacted' | 'Enrolled' | 'Closed') => {
    const previousStatus = enquiry.status;
    // Optimistic UI update
    setEnquiries((prev) =>
      prev.map((item) => (item.id === enquiry.id ? { ...item, status: newStatus } : item))
    );

    try {
      await apiFetch(`/api/enquiries/${enquiry.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Inquiry marked as "${newStatus}"`);
    } catch (err: any) {
      // Revert on error
      setEnquiries((prev) =>
        prev.map((item) => (item.id === enquiry.id ? { ...item, status: previousStatus } : item))
      );
      toast.error('Failed to update status: ' + (err.message || 'Unknown error'));
    }
  };

  // Save Counselor Notes Handler
  const handleSaveNotes = async () => {
    if (!editingNotesEnquiry) return;
    setIsSavingNotes(true);

    try {
      await apiFetch(`/api/enquiries/${editingNotesEnquiry.id}`, {
        method: 'PUT',
        body: JSON.stringify({ notes: notesInput.trim() }),
      });

      setEnquiries((prev) =>
        prev.map((item) =>
          item.id === editingNotesEnquiry.id ? { ...item, notes: notesInput.trim() } : item
        )
      );

      if (selectedEnquiryForDetail && selectedEnquiryForDetail.id === editingNotesEnquiry.id) {
        setSelectedEnquiryForDetail((prev) => (prev ? { ...prev, notes: notesInput.trim() } : null));
      }

      toast.success('Counselor notes saved successfully');
      setEditingNotesEnquiry(null);
    } catch (err: any) {
      toast.error('Failed to save notes: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Create Walk-in / Direct Inquiry Handler
  const handleCreateNewEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!newName.trim() || !newPhone.trim()) {
      setAddError('Student Name and Phone Number are required fields.');
      return;
    }

    const digits = newPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setAddError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmittingNew(true);
    const selectedCourseObj = courses.find((c) => c.id === newCourseId);

    try {
      const newRecord: Partial<ContactEnquiry> = {
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim(),
        courseId: newCourseId || '',
        courseTitle: selectedCourseObj ? selectedCourseObj.title : 'General Academic Inquiry',
        message: newMessage.trim() || 'Direct walk-in / Phone inquiry logged by academic counselor.',
        source: newSource,
        status: newStatus,
        createdAt: new Date().toISOString().split('T')[0],
        submittedAt: new Date().toISOString(),
      };

      const saved = await apiFetch<ContactEnquiry>('/api/enquiries', {
        method: 'POST',
        body: JSON.stringify(newRecord),
      });

      setEnquiries((prev) => [saved, ...prev]);
      toast.success('Inquiry logged successfully!');
      setIsAddModalOpen(false);

      // Reset form
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewCourseId('');
      setNewMessage('');
    } catch (err: any) {
      setAddError(err.message || 'Failed to save new inquiry.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Delete Inquiry Handler
  const handleDeleteEnquiry = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await apiFetch(`/api/enquiries/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      setEnquiries((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      if (selectedEnquiryForDetail && selectedEnquiryForDetail.id === deleteTarget.id) {
        setSelectedEnquiryForDetail(null);
      }
      toast.success('Inquiry record deleted successfully');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error('Failed to delete inquiry: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (enquiries.length === 0) {
      toast.info('No inquiry data available to export.');
      return;
    }

    const headers = ['ID', 'Date', 'Full Name', 'Phone Number', 'Email', 'Interested Course', 'Status', 'Lead Source', 'Message', 'Counselor Notes'];
    const rows = filteredEnquiries.map((e) => [
      `"${e.id}"`,
      `"${e.createdAt || ''}"`,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.phone}"`,
      `"${e.email || ''}"`,
      `"${(e.courseTitle || '').replace(/"/g, '""')}"`,
      `"${e.status}"`,
      `"${(e.source || 'Website').replace(/"/g, '""')}"`,
      `"${(e.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(e.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Oritech_Inquiries_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported inquiry records to CSV.');
  };

  // Filtered & Sorted Enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries
      .filter((enq) => {
        // Status filter
        if (statusFilter !== 'All' && enq.status !== statusFilter) return false;

        // Course filter
        if (selectedCourseFilter !== 'All' && enq.courseId !== selectedCourseFilter && enq.courseTitle !== selectedCourseFilter) {
          return false;
        }

        // Search Term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = enq.name?.toLowerCase().includes(q);
          const matchPhone = enq.phone?.toLowerCase().includes(q);
          const matchEmail = enq.email?.toLowerCase().includes(q);
          const matchCourse = enq.courseTitle?.toLowerCase().includes(q);
          const matchMessage = enq.message?.toLowerCase().includes(q);
          const matchNotes = enq.notes?.toLowerCase().includes(q);
          return matchName || matchPhone || matchEmail || matchCourse || matchMessage || matchNotes;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.submittedAt || b.createdAt || 0).getTime();
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [enquiries, searchTerm, statusFilter, selectedCourseFilter, sortBy]);

  // Statistics
  const counts = useMemo(() => {
    const total = enquiries.length;
    const newCount = enquiries.filter((e) => e.status === 'New').length;
    const contactedCount = enquiries.filter((e) => e.status === 'Contacted').length;
    const enrolledCount = enquiries.filter((e) => e.status === 'Enrolled').length;
    const closedCount = enquiries.filter((e) => e.status === 'Closed').length;
    return { total, newCount, contactedCount, enrolledCount, closedCount };
  }, [enquiries]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Lead Conversion Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setStatusFilter('All')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'All'
              ? 'bg-indigo-900 text-white border-indigo-900 shadow-md ring-2 ring-indigo-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-80">Total Inquiries</span>
            <Inbox className="w-4 h-4 opacity-75" />
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono mt-2">{counts.total}</p>
          <p className="text-[10px] mt-1 opacity-70 font-semibold">All received leads</p>
        </div>

        <div
          onClick={() => setStatusFilter('New')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'New'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30'
              : 'bg-white border-amber-200 hover:border-amber-300 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">New / Unread</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <p className={`text-2xl sm:text-3xl font-black font-mono mt-2 ${statusFilter === 'New' ? 'text-white' : 'text-amber-600'}`}>
            {counts.newCount}
          </p>
          <p className="text-[10px] mt-1 text-slate-500 font-semibold">Requires follow-up</p>
        </div>

        <div
          onClick={() => setStatusFilter('Contacted')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Contacted'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
              : 'bg-white border-blue-200 hover:border-blue-300 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">Contacted</span>
            <PhoneCall className="w-4 h-4 text-blue-500" />
          </div>
          <p className={`text-2xl sm:text-3xl font-black font-mono mt-2 ${statusFilter === 'Contacted' ? 'text-white' : 'text-blue-600'}`}>
            {counts.contactedCount}
          </p>
          <p className="text-[10px] mt-1 text-slate-500 font-semibold">Follow-up in progress</p>
        </div>

        <div
          onClick={() => setStatusFilter('Enrolled')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Enrolled'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/30'
              : 'bg-white border-emerald-200 hover:border-emerald-300 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">Enrolled</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className={`text-2xl sm:text-3xl font-black font-mono mt-2 ${statusFilter === 'Enrolled' ? 'text-white' : 'text-emerald-700'}`}>
            {counts.enrolledCount}
          </p>
          <p className="text-[10px] mt-1 text-slate-500 font-semibold">Converted to student</p>
        </div>

        <div
          onClick={() => setStatusFilter('Closed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Closed'
              ? 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-400/30'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Closed</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className={`text-2xl sm:text-3xl font-black font-mono mt-2 ${statusFilter === 'Closed' ? 'text-white' : 'text-slate-700'}`}>
            {counts.closedCount}
          </p>
          <p className="text-[10px] mt-1 text-slate-500 font-semibold">Resolved / Not Interested</p>
        </div>
      </div>

      {/* 2. Control Toolbar: Search, Filters & Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, phone, email, course title, or counselor notes..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-medium transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Walk-in / Call Lead</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              title="Download Leads to CSV Spreadsheet"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => fetchEnquiries(true)}
              disabled={refreshing}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              title="Refresh Inquiries"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar: Status Tabs & Course Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">Filter:</span>
            {(['All', 'New', 'Contacted', 'Enrolled', 'Closed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Course Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="course-filter-select" className="text-xs font-bold text-slate-500">Course:</label>
              <select
                id="course-filter-select"
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
              >
                <option value="All">All Courses ({courses.length})</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="sort-order-select" className="text-xs font-bold text-slate-500">Sort:</label>
              <select
                id="sort-order-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Inquiries List / Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">Loading student contact inquiries from Firestore...</p>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Inquiries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'All' || selectedCourseFilter !== 'All'
                ? 'No inquiries match your current filter settings. Try clearing the search or status filter.'
                : 'No student inquiries or contact form submissions yet. New website submissions will appear here automatically.'}
            </p>
          </div>
          {(searchTerm || statusFilter !== 'All' || selectedCourseFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setSelectedCourseFilter('All');
              }}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredEnquiries.map((enquiry) => {
            const whatsappMsg = encodeURIComponent(
              `Hello ${enquiry.name}, this is Oritech Computer regarding your inquiry for ${enquiry.courseTitle || 'our certification courses'}. How can we assist you today?`
            );
            const cleanPhone = enquiry.phone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${whatsappMsg}`;

            return (
              <div
                key={enquiry.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md ${
                  enquiry.status === 'New'
                    ? 'border-amber-300 bg-amber-50/20'
                    : enquiry.status === 'Enrolled'
                    ? 'border-emerald-300 bg-emerald-50/15'
                    : enquiry.status === 'Contacted'
                    ? 'border-blue-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left: Contact Info & Message Preview */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-black text-slate-900 truncate">
                        {enquiry.name}
                      </h4>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          enquiry.status === 'New'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : enquiry.status === 'Contacted'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : enquiry.status === 'Enrolled'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {enquiry.status}
                      </span>

                      {/* Source Tag */}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {enquiry.source || 'Website Form'}
                      </span>

                      {/* Date */}
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {enquiry.createdAt || 'Recent'}
                      </span>
                    </div>

                    {/* Course Tag & Phone/Email details */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg font-bold">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{enquiry.courseTitle || 'General Program Inquiry'}</span>
                      </div>

                      <a
                        href={`tel:${enquiry.phone}`}
                        className="flex items-center gap-1 text-slate-700 hover:text-indigo-600 font-mono font-bold"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{enquiry.phone}</span>
                      </a>

                      {enquiry.email && (
                        <a
                          href={`mailto:${enquiry.email}`}
                          className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 truncate max-w-xs"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{enquiry.email}</span>
                        </a>
                      )}
                    </div>

                    {/* Student Query Message */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-medium">
                      <p className="line-clamp-2">
                        <strong className="text-slate-900 font-bold">Message: </strong>
                        {enquiry.message || 'No custom message provided.'}
                      </p>
                    </div>

                    {/* Counselor Follow-up Notes (if any) */}
                    {enquiry.notes && (
                      <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
                        <StickyNote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[11px] uppercase tracking-wider text-amber-800">Counselor Note:</p>
                          <p className="font-medium text-xs mt-0.5">{enquiry.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Quick Interactive Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-between gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto">
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-1.5 w-full lg:w-auto">
                      <span className="text-[11px] font-bold text-slate-500 lg:hidden">Status:</span>
                      <select
                        aria-label={`Status for ${enquiry.name}`}
                        value={enquiry.status}
                        onChange={(e) =>
                          handleUpdateStatus(
                            enquiry,
                            e.target.value as 'New' | 'Contacted' | 'Enrolled' | 'Closed'
                          )
                        }
                        className="w-full lg:w-36 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
                      >
                        <option value="New">🟡 New Lead</option>
                        <option value="Contacted">🔵 Contacted</option>
                        <option value="Enrolled">🟢 Enrolled</option>
                        <option value="Closed">⚪ Closed</option>
                      </select>
                    </div>

                    {/* Quick Communication Buttons */}
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${enquiry.phone}`}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 transition-colors"
                        title="Call Student Directly"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      {enquiry.email && (
                        <a
                          href={`mailto:${enquiry.email}?subject=Oritech Computer Admission Inquiry`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesEnquiry(enquiry);
                          setNotesInput(enquiry.notes || '');
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 transition-colors cursor-pointer"
                        title="Add/Edit Counselor Note"
                      >
                        <StickyNote className="w-4 h-4" />
                      </button>

                      {onConvertToStudent && (
                        <button
                          type="button"
                          onClick={() => onConvertToStudent(enquiry)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Register this person as an active student"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Register</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(enquiry)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition-colors cursor-pointer"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL: Add Walk-in / Direct Inquiry Lead */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Log New Student Inquiry</h3>
                  <p className="text-xs text-slate-500 font-medium">Record walk-in visitor or telephone inquiry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewEnquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ankit Kumar"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ankit@example.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Interested Course
                  </label>
                  <select
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">-- General / Not Sure --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Lead Source
                  </label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Walk-in / Front Desk">Walk-in / Front Desk</option>
                    <option value="Phone Call Inquiry">Phone Call Inquiry</option>
                    <option value="WhatsApp Referral">WhatsApp Referral</option>
                    <option value="Social Media Ad">Social Media Ad</option>
                    <option value="Website Form">Website Form</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Inquiry Details / Message
                </label>
                <textarea
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Notes about student requirements, preferred timing, qualifications..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNew ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Lead...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Lead Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Edit Counselor Notes */}
      {editingNotesEnquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <StickyNote className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Counselor Notes for {editingNotesEnquiry.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingNotesEnquiry(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Record follow-up remarks, promised batch times, discount agreements, or parent discussions:
              </p>
              <textarea
                rows={4}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. Called on 14th March. Student confirmed joining Python morning 9 AM batch on Monday."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingNotesEnquiry(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingNotes ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Confirm Delete Inquiry */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Delete Inquiry Record?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete the inquiry from <strong className="text-slate-800">{deleteTarget.name}</strong> ({deleteTarget.phone})?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEnquiry}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
