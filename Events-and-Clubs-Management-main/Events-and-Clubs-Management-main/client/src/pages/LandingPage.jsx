import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-cream-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-700 text-white flex items-center justify-center font-semibold">
            CC
          </div>
          <span className="text-lg font-semibold text-stone-800">Campus Connect</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary">
            Join now
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <section className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-brand-700 mb-3">College events & clubs, made simple</p>
            <h1 className="text-4xl md:text-5xl font-semibold text-stone-800 leading-tight mb-5">
              Show up, take part, and leave with proof you were there.
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed mb-8">
              Browse campus events, join clubs, check in with QR codes, and collect digital
              certificates when events wrap up — all in one friendly place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-6 py-3">
                Create your account
              </Link>
              <Link to="/login" className="btn-secondary px-6 py-3">
                I already have one
              </Link>
            </div>
          </div>

          <div className="card p-8 space-y-5">
            <h2 className="text-xl font-semibold text-stone-800">What you can do here</h2>
            <ul className="space-y-4 text-stone-600">
              <li className="flex gap-3">
                <span className="text-brand-700">✓</span>
                <span>Discover and register for approved campus events</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-700">✓</span>
                <span>Scan a QR code at the venue to verify your attendance</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-700">✓</span>
                <span>Download a digital certificate after participating</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-700">✓</span>
                <span>Propose events, manage clubs, and track participation</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-20 grid md:grid-cols-3 gap-6">
          {[
            {
              title: "For students",
              text: "Register, check in with QR, and keep your certificates in one place.",
            },
            {
              title: "For faculty",
              text: "Review proposals, run attendance, and close out events smoothly.",
            },
            {
              title: "For admins",
              text: "Manage users, clubs, approvals, and campus-wide event activity.",
            },
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <h3 className="font-semibold text-stone-800 mb-2">{item.title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        Events & Clubs Management · Built for campus life
      </footer>
    </div>
  );
};

export default LandingPage;
