import { Link } from "react-router-dom";
import { ArrowRight, Award, ShieldCheck, Smartphone, Zap } from "lucide-react";
import Logo from "../components/Logo";
import { Button } from "@/components/ui/button";

const features = [
  { Icon: Zap, title: "Proposals in minutes", sub: "Club managers submit, faculty approves — in a few clicks." },
  { Icon: Smartphone, title: "QR check-in", sub: "One scan marks attendance. No paper, no queues." },
  { Icon: Award, title: "Digital certificates", sub: "PDFs are issued automatically when an event wraps." },
  { Icon: ShieldCheck, title: "Role-aware access", sub: "Students, faculty and admins each get the right view." },
];

const steps = [
  { n: "01", title: "Propose", text: "Submit an event from your club dashboard." },
  { n: "02", title: "Approve", text: "Faculty reviews it — live in minutes." },
  { n: "03", title: "Check in", text: "Students scan the QR code at the venue." },
  { n: "04", title: "Certify", text: "Certificates are issued automatically." },
];

const LandingPage = () => {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[#F8FAFC]">
      {/* soft, hand-placed color blobs instead of a flat gradient wash */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-[#c4785a]/10 blur-3xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="no-underline">
          <Logo compact markSize={36} />
        </Link>
        <Button variant="outline" nativeButton={false} render={<Link to="/login" />}>
          Sign in
        </Button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 md:py-10">
        <div className="w-full">
          {/* Copy + features */}
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Campus events, made simple
            </div>

            <h1 className="mt-5 text-[clamp(2.3rem,4.6vw,3.5rem)] leading-[1.08] font-extrabold tracking-tight text-foreground">
              One place for every{" "}
              <span className="relative inline-block whitespace-nowrap text-primary">
                club, event
                <svg
                  aria-hidden="true"
                  viewBox="0 0 210 10"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-[#c4785a]"
                >
                  <path
                    d="M2 7.5C40 2.5 160 2.5 208 7.5"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>{" "}
              and certificate.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              Evento brings proposals, registrations, QR check-in, attendance and digital
              certificates into a single calm workspace built for the whole campus.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2 rounded-xl shadow-sm shadow-primary/20"
                nativeButton={false}
                render={<Link to="/login" />}
              >
                Sign in to your account
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" nativeButton={false} render={<Link to="/register" />}>
                Create an account
              </Button>
            </div>

            <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <li
                  key={f.title}
                  className="flex items-start gap-3 border-l-2 border-border pl-3.5 transition-colors hover:border-primary/50"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* How it works */}
        <div className="relative z-10 mt-20 md:mt-24">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">How it works</p>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.n} className="border-t-2 border-primary/15 pt-4">
                <span className="font-mono text-xs font-semibold text-primary/50">{step.n}</span>
                <p className="mt-2 text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl border-t border-border/70 px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Evento · College Club and Event Management System
      </footer>
    </div>
  );
};

export default LandingPage;
