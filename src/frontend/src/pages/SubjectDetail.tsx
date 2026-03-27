import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Minus,
  Pencil,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { Session } from "../backend.d";
import EditSessionModal from "../components/EditSessionModal";
import LogSessionModal from "../components/LogSessionModal";
import {
  useListSubjects,
  useSessionsForSubject,
  useSubjectStats,
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

export default function SubjectDetail() {
  const { subjectId } = useParams({ from: "/layout/subjects/$subjectId" });
  const subjectIdBigInt = BigInt(subjectId);
  const [logOpen, setLogOpen] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);

  const { data: subjects = [] } = useListSubjects();
  const { data: stats, isLoading: statsLoading } =
    useSubjectStats(subjectIdBigInt);
  const { data: sessions = [], isLoading: sessionsLoading } =
    useSessionsForSubject(subjectIdBigInt);

  const subject = subjects.find((s) => s.id.toString() === subjectId);

  const chartData = [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: s.date.slice(5),
      score: Number(s.score),
    }));

  const avgScore = stats ? Number(stats.averageScore) : 0;
  const delta = stats ? Number(stats.scoreDelta) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back nav + title */}
      <div className="flex items-center gap-3">
        <Link to="/subjects" data-ocid="subject_detail.back.button">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          {subject ? (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ background: subject.color }}
              >
                {subject.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {subject.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {stats ? Number(stats.sessionCount) : 0} sessions logged
                </p>
              </div>
            </div>
          ) : (
            <Skeleton className="h-10 w-48" />
          )}
        </div>
        <Button
          onClick={() => setLogOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-ocid="subject_detail.log_session.button"
        >
          <Plus className="mr-1 h-4 w-4" /> Log Session
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading
          ? ["1", "2", "3", "4"].map((sk) => (
              <Skeleton
                key={sk}
                className="h-24 rounded-lg"
                data-ocid="subject_detail.stats.loading_state"
              />
            ))
          : [
              {
                label: "Sessions",
                value: stats ? Number(stats.sessionCount).toString() : "0",
                icon: BookOpen,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                label: "Total Time",
                value: stats ? formatDuration(stats.totalDuration) : "0h",
                icon: Clock,
                color: "text-teal-600",
                bg: "bg-teal-50",
              },
              {
                label: "Avg Score",
                value: `${avgScore}%`,
                icon: Target,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Score Trend",
                value: delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "—",
                icon: delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus,
                color:
                  delta > 0
                    ? "text-emerald-600"
                    : delta < 0
                      ? "text-red-500"
                      : "text-muted-foreground",
                bg:
                  delta > 0
                    ? "bg-emerald-50"
                    : delta < 0
                      ? "bg-red-50"
                      : "bg-muted",
              },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="shadow-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {kpi.label}
                        </p>
                        <p className="text-xl font-bold text-foreground mt-1">
                          {kpi.value}
                        </p>
                      </div>
                      <div className={`${kpi.bg} ${kpi.color} p-2 rounded-lg`}>
                        <kpi.icon className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Score trend chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="shadow-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div
                className="text-center py-10"
                data-ocid="subject_detail.chart.empty_state"
              >
                <p className="text-sm text-muted-foreground">
                  Log sessions to see your score trend
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="subjectGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={subject?.color ?? "#2F9FA7"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={subject?.color ?? "#2F9FA7"}
                        stopOpacity={0}
                      />
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
                    stroke={subject?.color ?? "#2F9FA7"}
                    strokeWidth={2}
                    fill="url(#subjectGrad)"
                    dot={{ fill: subject?.color ?? "#2F9FA7", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Session history table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Session History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sessionsLoading ? (
              <div className="p-4 space-y-2">
                {["1", "2", "3"].map((sk) => (
                  <Skeleton key={sk} className="h-10 rounded" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div
                className="text-center py-10"
                data-ocid="subject_detail.sessions.empty_state"
              >
                <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No sessions logged for this subject yet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setLogOpen(true)}
                  data-ocid="subject_detail.log_first.button"
                >
                  Log first session
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
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
                      <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                        Notes
                      </th>
                      <th className="px-4 py-2.5 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {[...sessions]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((s, idx) => {
                        const score = Number(s.score);
                        const perf = perfLabel(score);
                        return (
                          <tr
                            key={s.id.toString()}
                            className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                            data-ocid={`subject_detail.session.item.${idx + 1}`}
                          >
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
                            <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate hidden md:table-cell">
                              {s.notes || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                onClick={() => setEditSession(s)}
                                data-ocid={`subject_detail.session.edit_button.${idx + 1}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <LogSessionModal
        open={logOpen}
        onOpenChange={setLogOpen}
        defaultSubjectId={subjectId}
      />

      <EditSessionModal
        session={editSession}
        open={editSession !== null}
        onOpenChange={(v) => {
          if (!v) setEditSession(null);
        }}
      />
    </div>
  );
}
