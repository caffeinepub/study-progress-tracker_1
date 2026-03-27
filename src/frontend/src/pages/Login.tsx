import { Button } from "@/components/ui/button";
import { BarChart3, BookOpen, Loader2, Target, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Track Progress",
    desc: "Monitor your score trends across all subjects over time",
  },
  {
    icon: BarChart3,
    title: "Performance Insights",
    desc: "Visualize which subjects need more attention with charts",
  },
  {
    icon: Target,
    title: "Goal-Oriented",
    desc: "Set targets and see your improvement and decrements clearly",
  },
];

export default function Login() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.953 0.009 230)" }}
    >
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
          {/* Left: branding */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary p-3 rounded-xl">
                <BookOpen className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  StudyTrack
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your academic progress tracker
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-foreground leading-tight">
                Master your studies,
                <br />
                <span className="text-primary">one session at a time.</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Log your study sessions, track score trends, identify areas for
                improvement, and celebrate your progress.
              </p>
            </div>

            <div className="space-y-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="bg-primary/10 text-primary p-2 rounded-lg mt-0.5 flex-shrink-0">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {f.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: login card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="bg-card rounded-2xl border border-border shadow-card p-8 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">
                  Welcome back
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign in to access your study dashboard
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground text-xs uppercase tracking-wide">
                    What you get:
                  </p>
                  <ul className="space-y-1 mt-2">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Personal study
                      session logs
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Score trend charts
                      per subject
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Performance
                      insights & stats
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-5"
                  onClick={login}
                  disabled={isLoggingIn}
                  data-ocid="login.primary_button"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing
                      in...
                    </>
                  ) : (
                    "Sign In to StudyTrack"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secured by Internet Identity — no passwords needed.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <footer className="bg-foreground text-primary-foreground/70 py-5 px-6 text-sm">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="font-semibold text-primary-foreground">
              StudyTrack
            </span>
          </div>
          <span>
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary-foreground"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
