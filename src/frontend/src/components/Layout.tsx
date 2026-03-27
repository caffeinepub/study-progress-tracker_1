import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BookMarked,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Plus,
  Target,
  User,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllSubjectStats,
  useListGoals,
  useListSubjects,
} from "../hooks/useQueries";
import LogSessionModal from "./LogSessionModal";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Subjects", href: "/subjects", icon: BookMarked },
  { label: "Goals", href: "/goals", icon: Target },
];

const BOTTOM_NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Subjects", href: "/subjects", icon: BookMarked },
  { label: "Goals", href: "/goals", icon: Target },
];

function AlertBell() {
  const navigate = useNavigate();
  const { data: subjects = [] } = useListSubjects();
  const { data: goals = [] } = useListGoals();
  const { data: subjectStats = [] } = useAllSubjectStats(
    subjects.map((s) => s.id),
  );

  const goalSubjectIds = new Set(goals.map((g) => g.subjectId.toString()));
  const strugglingCount = subjectStats.filter((st) => {
    const idStr = st.subject.id.toString();
    const notifyEnabled = localStorage.getItem(`notify_enabled_${idStr}`);
    return (
      goalSubjectIds.has(idStr) &&
      Number(st.averageScore) < 60 &&
      notifyEnabled !== "false"
    );
  }).length;

  return (
    <button
      type="button"
      className="relative p-2 rounded-full hover:bg-secondary transition-colors"
      onClick={() => navigate({ to: "/goals" })}
      aria-label={`Alerts: ${strugglingCount} subjects need attention`}
      data-ocid="header.alerts.button"
    >
      <Bell className="h-5 w-5 text-muted-foreground" />
      {strugglingCount > 0 && (
        <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">
          {strugglingCount}
        </span>
      )}
    </button>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [logOpen, setLogOpen] = useState(false);
  const { identity, clear } = useInternetIdentity();

  const principalStr = identity?.getPrincipal().toString() ?? "";
  const initials = principalStr.slice(0, 2).toUpperCase() || "ST";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.953 0.009 230)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
        <div className="flex items-center h-14 px-4 md:px-6 gap-4 md:gap-6">
          <div
            className="flex items-center gap-2 font-bold text-lg text-primary"
            data-ocid="header.link"
          >
            <BookOpen className="h-5 w-5" />
            <span>StudyTrack</span>
          </div>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-1 ml-4"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  data-ocid={`nav.${item.label.toLowerCase()}.link`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {/* Alert bell */}
            <AlertBell />

            {/* Desktop log button */}
            <Button
              size="sm"
              className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              onClick={() => setLogOpen(true)}
              data-ocid="header.log_session.button"
            >
              + LOG SESSION
            </Button>

            {/* User avatar with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild data-ocid="header.profile.button">
                <button
                  type="button"
                  className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
                >
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52"
                data-ocid="header.profile.dropdown_menu"
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground">
                    Signed in as
                  </p>
                  <p className="text-xs text-foreground font-mono truncate mt-0.5">
                    {principalStr.slice(0, 20)}…
                  </p>
                </div>
                <DropdownMenuItem
                  className="text-sm gap-2 cursor-pointer mt-1"
                  data-ocid="header.profile.link"
                >
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-sm gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={clear}
                  data-ocid="header.signout.button"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 md:px-6 py-5 max-w-screen-xl mx-auto w-full pb-24 md:pb-6">
        {children}
      </main>

      {/* Footer — hidden on mobile */}
      <footer className="hidden md:block bg-foreground text-primary-foreground/70 py-6 px-6 mt-8">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="font-semibold text-primary-foreground">
              StudyTrack
            </span>
            <span>— Your personal study progress tracker</span>
          </div>
          <span>
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary-foreground/90 hover:text-primary-foreground"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        aria-label="Bottom navigation"
      >
        <div className="flex items-center justify-around px-2 py-1">
          {/* Dashboard */}
          {(() => {
            const item = BOTTOM_NAV[0];
            const active = pathname === item.href;
            return (
              <Link
                to={item.href}
                data-ocid="bottom_nav.dashboard.link"
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors min-w-0 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${active ? "text-primary" : ""}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })()}

          {/* Subjects */}
          {(() => {
            const item = BOTTOM_NAV[1];
            const active = pathname.startsWith("/subjects");
            return (
              <Link
                to={item.href}
                data-ocid="bottom_nav.subjects.link"
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors min-w-0 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${active ? "text-primary" : ""}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })()}

          {/* Center Log button */}
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            data-ocid="bottom_nav.log.button"
            className="flex flex-col items-center gap-0.5 -mt-4"
          >
            <span className="bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
              <Plus className="h-7 w-7" />
            </span>
            <span className="text-xs font-medium text-primary mt-0.5">Log</span>
          </button>

          {/* Goals */}
          {(() => {
            const item = BOTTOM_NAV[2];
            const active = pathname.startsWith("/goals");
            return (
              <Link
                to={item.href}
                data-ocid="bottom_nav.goals.link"
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors min-w-0 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${active ? "text-primary" : ""}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })()}

          {/* Profile slot */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-ocid="bottom_nav.profile.button">
              <button
                type="button"
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground"
              >
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-primary/20 text-primary text-[9px] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span>Profile</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="w-52 mb-2"
              data-ocid="bottom_nav.profile.dropdown_menu"
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground">
                  Signed in as
                </p>
                <p className="text-xs text-foreground font-mono truncate mt-0.5">
                  {principalStr.slice(0, 20)}…
                </p>
              </div>
              <DropdownMenuItem
                className="text-sm gap-2 cursor-pointer text-destructive focus:text-destructive mt-1"
                onClick={clear}
                data-ocid="bottom_nav.signout.button"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <LogSessionModal open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}
