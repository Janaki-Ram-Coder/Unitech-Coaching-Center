import React from 'react';
import { Award, ShieldCheck, Users, Laptop, CheckCircle, Target, Eye, Sparkles } from 'lucide-react';
import { SEO } from '../components/SEO';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <SEO
        title="About Us - ISO 9001:2015 Certified Institute"
        description="Discover Oritech Computer: our mission, certified faculty, high-tech lab infrastructure, and government-recognized certifications empowering IT careers since 2011."
        path="/about"
        keywords="About Oritech Computer, computer institute history, ISO 9001 certified computer institute, IT faculty, computer lab facility"
      />

      {/* Hero Intro */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>About Oritech Computer</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight">
          Empowering IT Professionals & Careers Since 2011
        </h1>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
          Oritech Computer Training Institute is an ISO 9001:2015 certified center dedicated to high-impact technical education, practical hands-on laboratory learning, and industry placements.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white border border-stone-200 hover:border-amber-400 rounded-3xl space-y-4 shadow-xs transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-stone-900">Our Mission</h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
            To provide accessible, affordable, and 100% practical computer training that arms students with industry-relevant coding, accounting, and technical skills necessary for top career placements.
          </p>
        </div>

        <div className="p-8 bg-white border border-stone-200 hover:border-amber-400 rounded-3xl space-y-4 shadow-xs transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-md shrink-0">
              <Eye className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-stone-900">Our Vision</h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
            To be recognized as the premier IT training institute, bridging the gap between traditional education and rapid technological advancements in Full Stack, AI, Cyber Security, and Accounting.
          </p>
        </div>
      </div>

      {/* Infrastructure Highlights */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold text-orange-600 uppercase tracking-widest">Our Facilities</span>
          <h2 className="text-3xl font-black text-stone-900">State-of-the-Art Lab Infrastructure</h2>
          <p className="text-xs text-stone-600">Equipped for deep technical learning and hands-on coding sessions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-xs hover:border-amber-400 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-orange-600 flex items-center justify-center font-bold shrink-0">
                <Laptop className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-base font-extrabold text-stone-900">High-Speed Workstations</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">High-performance PCs equipped with SSDs, dual monitors for programming, and high-speed fiber internet.</p>
          </div>

          <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-xs hover:border-amber-400 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-base font-extrabold text-stone-900">Small Batch Sizes</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">Maximum 15 students per batch to ensure personalized 1-on-1 attention and instructor code reviews.</p>
          </div>

          <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-xs hover:border-amber-400 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="text-base font-extrabold text-stone-900">ISO Credentials</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">Official ISO 9001:2015 certification and verification credentials accepted across corporate firms.</p>
          </div>
        </div>
      </div>

      {/* Director Note */}
      <div className="p-8 bg-stone-950 text-white border-2 border-orange-500/40 rounded-3xl flex flex-col md:flex-row items-center gap-8 shadow-lg">
        <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-amber-400 shrink-0 bg-white shadow-md">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
            alt="Director"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-3 text-center md:text-left">
          <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">Founder & Director Message</span>
          <h3 className="text-2xl font-black text-white">"Skills build careers, not just certificates."</h3>
          <p className="text-xs text-stone-300 leading-relaxed">
            At Oritech Computer, our core philosophy centers on practical execution. Every student works on real projects, writes live code, and handles real accounting books. We welcome you to experience practical learning with us.
          </p>
          <p className="text-xs font-bold text-amber-400 font-mono">— Er. Rajesh V. Sharma (M.Tech Computer Science)</p>
        </div>
      </div>
    </div>
  );
};
