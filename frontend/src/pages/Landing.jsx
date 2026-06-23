import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  MapPin, 
  Bell, 
  CalendarCheck, 
  Users, 
  Lock, 
  ArrowRight, 
  Play, 
  Award,
  ChevronRight,
  Star
} from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();

  const features = [
    {
      title: 'Real-Time Location Tracking',
      desc: 'Monitor your child\'s coordinates on an interactive world map. Tracks bus routes, walking paths, and stops with zero delay.',
      icon: MapPin,
      color: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
    },
    {
      title: 'Smart Geofencing Boundaries',
      desc: 'Define custom safe zones like Home, School, and parks. Receive immediate notifications the instant a child crosses safe bounds.',
      icon: ShieldAlert,
      color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
    },
    {
      title: 'One-Click Emergency SOS',
      desc: 'Children or parents can trigger instant SOS alerts during emergencies, immediately notifying admins, teachers, and guardians.',
      icon: Bell,
      color: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'
    },
    {
      title: 'School Attendance Gates',
      desc: 'Records entry and exit stamps automatically. Integrates school rosters, bus departures, and classroom check-ins.',
      icon: CalendarCheck,
      color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
    }
  ];

  const stats = [
    { label: 'Children Protected', value: '18,540+', desc: 'Active daily tracking feeds' },
    { label: 'Connected Schools', value: '310+', desc: 'District-wide RFID portals' },
    { label: 'Alert Dispatch Speed', value: '0.4s', desc: 'Real-time push delivery' },
    { label: 'Customer Trust Rating', value: '4.9/5', desc: 'From 5,000+ parent reviews' }
  ];

  const testimonials = [
    {
      name: 'Deborah Vance',
      role: 'Parent of 2 students',
      quote: 'GuardianShield gives me complete peace of mind. Knowing the exact second the school bus enters the school geofence lets me organize my day without worrying.',
      stars: 5
    },
    {
      name: 'Principal Richard Jenkins',
      role: 'Lincoln Grammar School',
      quote: 'Implementing the RFID gate logs and check-in system reduced our attendance administration time by 40% and immediately resolved parent safety inquiries.',
      stars: 5
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0B0F19] dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="text-lg font-black tracking-tight">GuardianShield</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Product Features</a>
            <a href="#statistics" className="hover:text-slate-900 dark:hover:text-white transition-colors">Impact & Numbers</a>
            <a href="#testimonials" className="hover:text-slate-900 dark:hover:text-white transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center space-x-3.5">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center space-x-1 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-500/10 active:scale-[0.98] transition-all"
              >
                <span>Dashboard Console</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors px-2">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-brand-600 px-4.5 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-500/10 active:scale-[0.98] transition-all"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-28 flex-1 flex flex-col justify-center">
        {/* Decorative backdrop gradients */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/20 dark:bg-brand-500/10 blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/3 -z-10 h-80 w-80 rounded-full bg-teal-400/15 dark:bg-teal-500/5 blur-[120px]"></div>

        <div className="mx-auto max-w-7xl grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center space-x-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
              <Award className="h-3.5 w-3.5" />
              <span>Next-Gen Child Safety Ecosystem</span>
            </span>
            
            <h1 className="font-sans text-4xl font-extrabold sm:text-5xl lg:text-[52px] leading-[1.1] tracking-tight">
              Every Child's Journey, <br />
              <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent dark:from-brand-400 dark:via-indigo-400 dark:to-teal-400">
                Protected Every Moment
              </span>
            </h1>

            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto lg:mx-0 leading-relaxed font-sans font-medium">
              GuardianShield bridges the gap between parents and schools with real-time GPS maps, smart geofences, and instant SOS warning alerts. Keep your family secure.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-6 py-3.5 text-xs font-bold hover:scale-[1.02] active:scale-[0.99] transition-all shadow-lg"
              >
                <span>Protect Your Family Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-[#0B0F19]/40 px-6 py-3.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Play className="h-4 w-4 fill-current text-slate-500" />
                <span>Simulate Demo Console</span>
              </Link>
            </div>
          </div>

          {/* Hero Right Graphic Card Showcase */}
          <div className="lg:col-span-6 flex justify-center relative">
            <div className="w-full max-w-md bg-white/80 dark:bg-[#121826]/80 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800/80 p-5 relative overflow-hidden backdrop-blur-md transform hover:rotate-1 transition-transform duration-500">
              
              {/* Fake phone UI frame */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
                  <span className="text-[10px] font-bold text-slate-400">LIVE FEED: OAKWOOD CENTRAL</span>
                </div>
                <span className="text-[9px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">Secure</span>
              </div>

              {/* Graphic representation of map */}
              <div className="h-48 w-full rounded-xl bg-slate-100 dark:bg-slate-800/40 relative overflow-hidden flex items-center justify-center border border-slate-200/50 dark:border-slate-700/30">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]"></div>
                
                {/* Geofence safe circle */}
                <div className="h-28 w-28 rounded-full border-2 border-brand-500/40 bg-brand-500/5 flex items-center justify-center relative animate-pulse">
                  <span className="text-[8px] font-bold text-brand-500 tracking-wider absolute -top-4">SCHOOL BOUNDS</span>
                </div>

                {/* Simulated child location pin */}
                <div className="absolute top-24 left-1/3 flex flex-col items-center">
                  <div className="bg-green-500 text-white rounded-full p-1 shadow-lg ring-4 ring-white animate-bounce">
                    👶
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-600 bg-white/95 px-1.5 py-0.5 rounded shadow mt-1">Bobby (Home)</span>
                </div>
              </div>

              {/* Fake alerts log inside hero graphic */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#0B0F19]/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-[10px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">🚨 Incident Report</span>
                  <span className="text-slate-400">12 mins ago</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-sans px-1">
                  Bobby Green crossed **Green Residence** bounds heading to School bus route.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Showcase Section */}
      <section id="features" className="py-20 bg-white dark:bg-[#0E1321] px-6 border-t border-b border-slate-100 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl text-center space-y-4 mb-16">
          <h2 className="text-xs font-black uppercase text-brand-600 tracking-widest">Architectural Pillars</h2>
          <h3 className="text-2xl font-black sm:text-3xl tracking-tight">Built to Safeguard What Matters Most</h3>
          <p className="text-slate-500 max-w-md mx-auto text-xs font-semibold">Fully integrated client systems ensuring constant tracking connectivity.</p>
        </div>

        <div className="mx-auto max-w-7xl grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="bg-slate-50 dark:bg-[#121826] border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 hover:shadow-premium transition-all group hover:-translate-y-1 duration-300">
                <div className={`p-3 rounded-xl w-fit ${feat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2">{feat.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Impact Statistics Section */}
      <section id="statistics" className="py-20 px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center space-y-1">
              <p className="text-[28px] font-black text-slate-800 dark:text-white leading-none">{stat.value}</p>
              <p className="text-xs font-bold text-slate-500">{stat.label}</p>
              <p className="text-[10px] text-slate-400 font-sans">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-slate-100/50 dark:bg-[#0E1321]/40 px-6 border-t border-slate-100 dark:border-slate-800/40">
        <div className="mx-auto max-w-7xl text-center space-y-4 mb-16">
          <h2 className="text-xs font-black uppercase text-brand-600 tracking-widest">Client Testimonials</h2>
          <h3 className="text-2xl font-black sm:text-3xl tracking-tight">Approved by Parents and Educators</h3>
        </div>

        <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((test) => (
            <div key={test.name} className="bg-white dark:bg-[#121826] border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm relative">
              <div className="flex space-x-1 text-amber-400 mb-3">
                {[...Array(test.stars)].map((_, i) => (
                  <Star key={i} className="h-4.5 w-4.5 fill-current" />
                ))}
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic text-xs mb-4">"{test.quote}"</p>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{test.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">{test.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action Footer banner */}
      <section className="bg-brand-600 text-white py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-72 w-72 rounded-full bg-white/10 blur-[80px]"></div>
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-2xl font-black sm:text-3xl tracking-tight">Secure Your School District Today</h2>
          <p className="text-brand-100 max-w-md mx-auto text-xs leading-relaxed font-sans font-medium">
            Contact us for custom hardware integrations, parent access credentials setup, or classroom RFID tracking sensors.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <Link
              to="/register"
              className="rounded-xl bg-white text-brand-600 px-5.5 py-3 text-xs font-bold hover:scale-[1.02] transition-transform shadow-md"
            >
              Sign Up Free
            </Link>
            <Link
              to="/login"
              className="rounded-xl bg-brand-700 text-white px-5.5 py-3 text-xs font-bold hover:bg-brand-800 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#0B0F19] py-8 px-6 border-t border-slate-100 dark:border-slate-800/60 text-center text-[10px] text-slate-400 font-sans">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} GuardianShield Inc. All safety rights reserved.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Support Desk</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
