import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import LogSessionModal from "../components/LogSessionModal";
import {
  useAllSubjectStats,
  useListGoals,
  useListSubjects,
  useOverallStats,
  useRecentSessions,
} from "../hooks/useQueries";

function formatDuration(minutes: bigint): string {
  const m = Number(minutes);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  return `${h}h ${rem}m`;
}

function perfLabel(score: number): { label: string; className: string } {
  if (score >= 80)
    return {
      label: "Improving",
      className: "bg-green-100 text-green-700 border-green-200",
    };
  if (score >= 60)
    return {
      label: "Stable",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    };
  return {
    label: "Needs Attention",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  };
}

function CircularProgress({
  percent,
  color,
}: { percent: number; color: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 52 52"
      aria-label={`${percent}% progress`}
      role="img"
    >
      <title>{`${percent}%`}</title>
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="#e8edf2"
        strokeWidth="5"
      />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text
        x="26"
        y="30"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="#1B2B3A"
      >
        {percent}%
      </text>
    </svg>
  );
}

export default function Dashboard() {
  const [logOpen, setLogOpen] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  const { data: stats, isLoading: statsLoading } = useOverallStats();
  const { data: sessions = [], isLoading: sessionsLoading } =
    useRecentSessions();
  const { data: subjects = [], isLoading: subjectsLoading } = useListSubjects();
  const { data: subjectStats = [] } = useAllSubjectStats(
    subjects.map((s) => s.id),
  );
  const { data: goals = [] } = useListGoals();

  const subjectMap = new Map<string, (typeof subjects)[0]>(
    subjects.map((s) => [s.id.toString(), s]),
  );
  const statsMap = new Map(
    subjectStats.map((st) => [
      st.subject.id.toString(),
      Number(st.averageScore),
    ]),
  );

  // Build chart data from sessions
  const sessionsByDate = sessions.reduce<
    Record<string, { total: number; count: number }>
  >((acc, s) => {
    const d = s.date;
    if (!acc[d]) acc[d] = { total: 0, count: 0 };
    acc[d].total += Number(s.score);
    acc[d].count += 1;
    return acc;
  }, {});
  const progressChartData = (
    Object.entries(sessionsByDate) as [
      string,
      { total: number; count: number },
    ][]
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, { total, count }]) => ({
      date: date.slice(5),
      score: Math.round(total / count),
    }));

  const barChartData = subjectStats.map((st) => ({
    name:
      st.subject.name.length > 12
        ? `${st.subject.name.slice(0, 12)}…`
        : st.subject.name,
    score: Number(st.averageScore),
    fill: st.subject.color,
  }));

  const displayedSessions = showAllSessions ? sessions : sessions.slice(0, 5);

  const hasData = sessions.length > 0;
  const sampleProgress = [
    { date: "03-01", score: 72 },
    { date: "03-05", score: 78 },
    { date: "03-10", score: 74 },
    { date: "03-15", score: 82 },
    { date: "03-20", score: 86 },
    { date: "03-25", score: 89 },
  ];
  const sampleBar = [
    { name: "Data Structures", score: 88, fill: "#2F9FA7" },
    { name: "Acad. Writing", score: 74, fill: "#2F4B66" },
    { name: "Org. Chemistry", score: 61, fill: "#C9A23A" },
    { name: "History of Art", score: 91, fill: "#4A8C8C" },
  ];

  const chartData = hasData ? progressChartData : sampleProgress;
  const barData = hasData ? barChartData : sampleBar;

  // Active goals (not yet achieved)
  const activeGoals = goals
    .filter((g) => {
      const current = statsMap.get(g.subjectId.toString()) ?? 0;
      return current < Number(g.targetScore);
    })
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Study Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your learning progress and performance
          </p>
        </div>
        <Button
          onClick={() => setLogOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold self-start sm:self-auto"
          data-ocid="dashboard.log_session.button"
        >
          + LOG NEW SESSION
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? ["1", "2", "3", "4"].map((sk) => (
              <Skeleton
                key={sk}
                className="h-28 rounded-lg"
                data-ocid="dashboard.kpi.loading_state"
              />
            ))
          : [
              {
                label: "Total Sessions",
                value: stats ? Number(stats.totalSessions).toString() : "0",
                sub: "study sessions logged",
                icon: BookOpen,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                label: "Total Study Time",
                value: stats ? formatDuration(stats.totalDuration) : "0h",
                sub: "hours of focused study",
                icon: Clock,
                color: "text-teal-600",
                bg: "bg-teal-50",
              },
              {
                label: "Avg. Performance",
                value: stats ? `${Number(stats.overallAverageScore)}%` : "—",
                sub: "average session score",
                icon: Target,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Active Subjects",
                value: subjects.length.toString(),
                sub: "subjects being tracked",
                icon: TrendingUp,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="shadow-card border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {kpi.label}
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {kpi.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {kpi.sub}
                        </p>
                      </div>
                      <div className={`${kpi.bg} ${kpi.color} p-2 rounded-lg`}>
                        <kpi.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Goals Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        <Card className="shadow-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Goals Overview
              </CardTitle>
              <Link
                to="/goals"
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
                data-ocid="dashboard.goals.link"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div
                className="flex items-center gap-3 py-3"
                data-ocid="dashboard.goals.empty_state"
              >
                <div className="bg-primary/10 rounded-lg p-2">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    No goals set yet
                  </p>
                  <Link
                    to="/goals"
                    className="text-xs text-primary hover:underline"
                    data-ocid="dashboard.set_first_goal.link"
                  >
                    Set your first goal →
                  </Link>
                </div>
              </div>
            ) : activeGoals.length === 0 ? (
              <p className="text-sm text-emerald-600 font-medium py-2">
                🎉 All goals achieved! Set new ones to keep improving.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                {activeGoals.map((goal, idx) => {
                  const subject = subjectMap.get(goal.subjectId.toString());
                  const current = statsMap.get(goal.subjectId.toString()) ?? 0;
                  const target = Number(goal.targetScore);
                  const pct = Math.min(
                    100,
                    Math.round((current / target) * 100),
                  );
                  return (
                    <div
                      key={goal.id.toString()}
                      className="flex-1 border border-border rounded-lg p-3 space-y-2"
                      data-ocid={`dashboard.goal.item.${idx + 1}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {goal.title}
                        </p>
                        {subject && (
                          <Badge
                            className="text-white text-xs px-1.5 py-0 flex-shrink-0"
                            style={{ background: subject.color }}
                          >
                            {subject.name}
                          </Badge>
                        )}
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        {current}% / {target}% · {pct}% there
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Two-column content band */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Progress Overview Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-card border-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Progress Overview
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Score trend over recent sessions
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#2F9FA7"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#2F9FA7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf2" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6B7C8F" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#6B7C8F" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e8edf2",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, "Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#2F9FA7"
                    strokeWidth={2}
                    fill="url(#scoreGrad)"
                    dot={{ fill: "#2F9FA7", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {!hasData && (
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Sample data — log sessions to see your real progress
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Subject Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="shadow-card border-border h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">
                  Subject Cards
                </CardTitle>
                <Link
                  to="/subjects"
                  className="text-xs text-primary hover:underline flex items-center gap-0.5"
                  data-ocid="dashboard.subjects.link"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {subjectsLoading ? (
                ["1", "2", "3"].map((sk) => (
                  <Skeleton key={sk} className="h-14 rounded-lg" />
                ))
              ) : subjects.length === 0 ? (
                <div
                  className="text-center py-8"
                  data-ocid="dashboard.subjects.empty_state"
                >
                  <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No subjects yet
                  </p>
                  <Link to="/subjects">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      data-ocid="dashboard.add_subject.button"
                    >
                      Add Subject
                    </Button>
                  </Link>
                </div>
              ) : (
                subjects.slice(0, 5).map((subject, idx) => {
                  const st = subjectStats.find(
                    (s) => s.subject.id.toString() === subject.id.toString(),
                  );
                  const avgScore = st ? Number(st.averageScore) : 0;
                  const delta = st ? Number(st.scoreDelta) : 0;
                  const perf = perfLabel(avgScore);
                  return (
                    <Link
                      key={subject.id.toString()}
                      to="/subjects/$subjectId"
                      params={{ subjectId: subject.id.toString() }}
                      data-ocid={`dashboard.subject.item.${idx + 1}`}
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ background: subject.color }}
                        >
                          {subject.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {subject.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${perf.className}`}
                            >
                              {perf.label}
                            </span>
                            {delta !== 0 && (
                              <span
                                className={`flex items-center gap-0.5 text-xs font-medium ${
                                  delta > 0
                                    ? "text-emerald-600"
                                    : "text-red-500"
                                }`}
                              >
                                {delta > 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {Math.abs(delta)}pts
                              </span>
                            )}
                            {delta === 0 && st && (
                              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                <Minus className="h-3 w-3" />
                                No change
                              </span>
                            )}
                          </div>
                        </div>
                        <CircularProgress
                          percent={avgScore}
                          color={subject.color}
                        />
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second two-column band */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sessions Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Recent Study Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sessionsLoading ? (
                <div className="p-4 space-y-2">
                  {["1", "2", "3", "4"].map((sk) => (
                    <Skeleton key={sk} className="h-10 rounded" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div
                  className="text-center py-10"
                  data-ocid="dashboard.sessions.empty_state"
                >
                  <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No sessions logged yet
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setLogOpen(true)}
                    data-ocid="dashboard.log_first.button"
                  >
                    Log your first session
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                            Subject
                          </th>
                          <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                            Date
                          </th>
                          <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                            Duration
                          </th>
                          <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                            Score
                          </th>
                          <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedSessions.map((s, idx) => {
                          const subj = subjectMap.get(s.subjectId.toString());
                          const score = Number(s.score);
                          const perf = perfLabel(score);
                          return (
                            <tr
                              key={s.id.toString()}
                              className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                              data-ocid={`sessions.item.${idx + 1}`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                    style={{
                                      background: subj?.color ?? "#6B7C8F",
                                    }}
                                  >
                                    {(subj?.name ?? "?")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                  <span className="font-medium text-foreground truncate max-w-[100px]">
                                    {subj?.name ?? "Unknown"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {s.date}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {formatDuration(s.durationMinutes)}
                              </td>
                              <td className="px-4 py-3 font-semibold text-foreground">
                                {score}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${perf.className}`}
                                >
                                  {perf.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {sessions.length > 5 && (
                    <div className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllSessions((p) => !p)}
                        data-ocid="sessions.show_more.button"
                        className="text-primary"
                      >
                        {showAllSessions
                          ? "Show less"
                          : `Show ${sessions.length - 5} more`}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Insights Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="shadow-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Performance Insights
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Average score per subject
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={barData}
                  margin={{ top: 8, right: 8, bottom: 0, left: -10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e8edf2"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6B7C8F" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#6B7C8F" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e8edf2",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, "Avg Score"]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} fill="#2F4B66" />
                </BarChart>
              </ResponsiveContainer>
              {!hasData && (
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Sample data — log sessions to see real insights
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <LogSessionModal open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}
