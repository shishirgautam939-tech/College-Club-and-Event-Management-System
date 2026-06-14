import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrollY > 50
            ? "bg-white/95 backdrop-blur-md shadow-xl shadow-gray-200 border-b border-gray-200"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-black shadow-lg shadow-indigo-500/30">
              E
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-gray-900">ECM</span>
              <span className="text-indigo-600"> Portal</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-xl transition-all duration-300"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-sm font-medium bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-100 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-100 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-indigo-50 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-3"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.04) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Campus Events & Clubs Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Where Campus
            <br />
            <span className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Life Happens
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover clubs, propose events, track participation, and be part of
            something bigger. Your one-stop platform for everything happening on
            campus.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group relative px-8 py-4 text-base font-semibold bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl transition-all duration-300 shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10">Join the Community</span>
              <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              to="/login"
              className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-500 rounded-2xl transition-all duration-300 hover:bg-gray-50"
            >
              Sign In
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { number: "8+", label: "Active Clubs" },
              { number: "80+", label: "Students" },
              { number: "24+", label: "Events" },
              { number: "400+", label: "Registrations" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:bg-indigo-50/50"
              >
                <div className="text-3xl font-black text-gray-900">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Features
            </p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Everything You Need
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              From joining clubs to attending events — manage your entire campus
              experience in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                ),
                title: "Club Management",
                desc: "Join clubs, hold positions like President, VP, Event Manager, and collaborate with peers.",
                iconClass: "bg-indigo-50 border-indigo-200 text-indigo-600",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                  </svg>
                ),
                title: "Event Discovery",
                desc: "Browse upcoming events, register with one click, and never miss what matters.",
                iconClass: "bg-purple-50 border-purple-200 text-purple-600",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                ),
                title: "Propose Events",
                desc: "Students can propose events for approval — from hackathons to cultural nights.",
                iconClass: "bg-amber-50 border-amber-200 text-amber-600",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                ),
                title: "Attendance Tracking",
                desc: "Mark and view attendance for every event — complete visibility for admins and faculty.",
                iconClass: "bg-emerald-50 border-emerald-200 text-emerald-600",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
                title: "Admin Dashboard",
                desc: "Powerful admin panel with stats, user management, and event approval workflows.",
                iconClass: "bg-rose-50 border-rose-200 text-rose-600",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                ),
                title: "Branch & Dept Views",
                desc: "Organized views by engineering branch and department for easy navigation.",
                iconClass: "bg-cyan-50 border-cyan-200 text-cyan-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative p-8 rounded-3xl bg-gray-50 border border-gray-200 hover:border-indigo-300 transition-all duration-500 hover:bg-white hover:shadow-md hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${feature.iconClass}`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-indigo-50/60 to-transparent" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">
              How It Works
            </p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900">
              Three Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Account",
                desc: "Sign up with your college roll number and get verified instantly.",
              },
              {
                step: "02",
                title: "Join & Explore",
                desc: "Browse clubs, discover events, and register for what interests you.",
              },
              {
                step: "03",
                title: "Participate",
                desc: "Attend events, get attendance tracked, and build your campus portfolio.",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-4/5 border-t border-dashed border-gray-300" />
                )}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-200 text-2xl font-black text-indigo-600 mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles Section ── */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">
              For Everyone
            </p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900">
              Built for Every Role
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                role: "Students",
                desc: "Join clubs, propose events, register for activities, and track your participation journey.",
                gradient: "from-indigo-600 to-blue-600",
                features: [
                  "Join any club on campus",
                  "Propose & register for events",
                  "View attendance records",
                  "Explore upcoming activities",
                ],
              },
              {
                role: "Faculty",
                desc: "Coordinate clubs, oversee events, manage attendance, and mentor student initiatives.",
                gradient: "from-purple-600 to-pink-600",
                features: [
                  "Coordinate club activities",
                  "Review event proposals",
                  "Mark event attendance",
                  "Monitor student engagement",
                ],
              },
              {
                role: "Admin",
                desc: "Full control over users, clubs, events, approvals, and campus-wide analytics.",
                gradient: "from-amber-500 to-orange-600",
                features: [
                  "Manage all users & roles",
                  "Approve/reject events",
                  "Create & configure clubs",
                  "View dashboard analytics",
                ],
              },
            ].map((item) => (
              <div
                key={item.role}
                className="group relative overflow-hidden rounded-3xl bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-2"
              >
                <div
                  className={`h-2 bg-linear-to-r ${item.gradient}`}
                />
                <div className="p-8">
                  <h3 className="text-2xl font-black mb-3 text-gray-900">{item.role}</h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    {item.desc}
                  </p>
                  <ul className="space-y-3">
                    {item.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                        <svg
                          className="w-4 h-4 text-emerald-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative py-32 px-6">
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="absolute inset-0 -m-12 rounded-[3rem] bg-linear-to-br from-indigo-100 via-purple-50 to-pink-100 blur-xl" />
          <div className="relative p-12 rounded-[2.5rem] bg-white border border-gray-200 shadow-xl">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 text-gray-900">
              Ready to Dive In?
            </h2>
            <p className="text-gray-500 text-lg mb-10 max-w-lg mx-auto">
              Join hundreds of students already using ECM Portal to stay
              connected with campus life.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-10 py-4 text-base font-semibold bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl transition-all duration-300 shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1"
              >
                Create Your Account
              </Link>
              <Link
                to="/login"
                className="px-10 py-4 text-base font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-500 rounded-2xl transition-all duration-300 hover:bg-gray-50"
              >
                I Already Have One
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-12 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-black">
              E
            </div>
            <span className="text-sm text-gray-500">
              Events & Clubs Management Portal
            </span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} NCIT. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
