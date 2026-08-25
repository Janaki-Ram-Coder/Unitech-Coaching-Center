import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Course } from '../types';
import { apiFetch } from '../lib/api';
import { SEO } from '../components/SEO';

interface ContactPageProps {
  courses: Course[];
}

interface FieldErrors {
  name?: string;
  phone?: string;
}

export const ContactPage: React.FC<ContactPageProps> = ({ courses }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [courseId, setCourseId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!name.trim()) {
      errors.name = 'Your name is required.';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const digits = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (digits.length < 10) {
      errors.phone = 'Please enter a valid phone number (at least 10 digits).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      setError('Please fix the highlighted form errors below.');
      return;
    }

    setLoading(true);

    try {
      const selectedCourse = courses.find((c) => c.id === courseId);
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          courseId,
          courseTitle: selectedCourse ? selectedCourse.title : 'General Academic Inquiry',
          message: message.trim(),
          source: 'Website Contact Form',
        }),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Oritech Computer, I am interested in course admissions and batch timings.`
  );
  const whatsappUrl = `https://wa.me/919437235124?text=${whatsappMessage}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <SEO
        title="Contact Us & Campus Admissions"
        description="Get in touch with Oritech Computer. Visit our modern campus in Rayagada, speak with our certified academic counselors, or connect on WhatsApp for course details and batch timings."
        path="/contact"
        keywords="contact Oritech Computer, institute address, phone number, admissions enquiry, computer center location Rayagada"
      />

      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="px-3.5 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black rounded-full uppercase shadow-xs">
          Get In Touch
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900">Contact Oritech Computer</h1>
        <p className="text-xs sm:text-sm text-stone-600 font-medium">
          Visit our campus, drop us a message, or connect with our academic counselors on WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="p-8 bg-white border border-stone-200 rounded-3xl shadow-xs space-y-6">
          <h2 className="text-2xl font-black text-stone-900">Send Us a Direct Message</h2>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-bold text-stone-900">Enquiry Sent Successfully!</h3>
              <p className="text-xs text-stone-600">
                Thank you <span className="text-orange-700 font-extrabold">{name}</span>. Our admission team will contact you shortly on <span className="font-mono text-orange-600 font-bold">{phone}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-stone-900 mb-1">YOUR NAME *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full bg-stone-50 border rounded-xl p-3 text-sm text-stone-900 focus:outline-none font-medium transition-colors ${
                    fieldErrors.name
                      ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                      : 'border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-[11px] font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-900 mb-1">PHONE NUMBER *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined });
                  }}
                  placeholder="e.g. 9437235124"
                  className={`w-full bg-stone-50 border rounded-xl p-3 text-sm text-stone-900 focus:outline-none font-mono font-bold transition-colors ${
                    fieldErrors.phone
                      ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                      : 'border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-[11px] font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.phone}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-900 mb-1">INTERESTED COURSE</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 font-medium cursor-pointer"
                >
                  <option value="">-- Select Course (Optional) --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.duration})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-900 mb-1">MESSAGE / INQUIRY</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about batch timings, fee installments, or lab facilities..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Contact Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Info & WhatsApp CTA & Map Placeholder */}
        <div className="space-y-6">
          <div className="p-8 bg-white border border-stone-200 rounded-3xl space-y-6 shadow-xs">
            <h2 className="text-2xl font-black text-stone-900">Campus Information</h2>

            <div className="space-y-4 text-xs text-stone-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-stone-900 text-sm">Main Campus Address</p>
                  <p className="mt-0.5 text-stone-600 font-medium">Sharma Complex, Beside Hotel Jyoti Mahal, Convent road, New Colony, Rayagada-765001, Odisha</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-stone-900 text-sm">Helpline & Enquiries</p>
                  <p className="font-mono text-stone-900 font-bold">+91 9437235124</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-stone-900 text-sm">Operating Hours</p>
                  <p className="text-stone-600 font-medium">Monday - Saturday: 08:00 AM - 08:00 PM (Sunday Closed)</p>
                </div>
              </div>
            </div>

            {/* Quick WhatsApp CTA Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2.5 text-sm cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          {/* Live Google Maps Location Embed */}
          <div className="p-4 sm:p-5 bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-stone-900 px-1">Campus on Maps</h3>
            <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-inner relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m23!1m12!1m3!1d35890.13698719617!2d83.40144171199545!3d19.177507686513483!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m8!3e6!4m0!4m5!1s0x3a3b44a9c08ae487%3A0x8a41a4a9f93e1536!2sOritech%20Computer%20Education%2C%20Convent%20Rd%2C%20New%20Colony%2C%20Rayagada%2C%20Odisha%20765001!3m2!1d19.1666515!2d83.4151251!5e0!3m2!1sen!2sin!4v1787495420005!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Oritech Computer Location"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
