import { Link } from "react-router-dom";
import Logo from "../components/Logo";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <header className="max-w-3xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link to="/" className="no-underline">
          <Logo compact markSize={36} />
        </Link>
        <Link to="/login" className="nav-link text-sm">
          Sign in
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="flex justify-center">
            <Logo showText={false} markSize={72} />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-stone-800 tracking-tight leading-snug">
              College Club and Event Management System
            </h1>
            <p className="text-stone-500 text-base">
              Events, clubs, and attendance — in one place.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/login" className="btn-primary w-full sm:w-auto px-8">
              Sign in
            </Link>
            <Link to="/register" className="btn-secondary w-full sm:w-auto px-8">
              Create account
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-stone-400">
        College Club and Event Management System
      </footer>
    </div>
  );
};

export default LandingPage;
