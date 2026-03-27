import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Lightbulb,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Goal } from "../backend.d";
import { useNotifications } from "../hooks/useNotifications";
import {
  useAllSubjectStats,
  useCreateGoal,
  useDeleteGoal,
  useListGoals,
  useListSubjects,
  useUpdateGoal,
} from "../hooks/useQueries";

function getImprovementTip(achieved: boolean, gap: number): string {
  if (achieved) return "🎉 Great job! Keep it up with consistent sessions.";
  if (gap <= 10)
    return "🔥 You're so close! Try one focused 45-min session this week.";
  if (gap <= 25)
    return "📖 Review your weakest sessions and focus on those topics.";
  return "⏱️ Start with shorter daily sessions (20–30 min) to build momentum.";
}

function EditGoalDialog({
  goal,
  onClose,
}: { goal: Goal; onClose: () => void }) {
  const [title, setTitle] = useState(goal.title);
  const [targetScore, setTargetScore] = useState(
    Number(goal.targetScore).toString(),
  );
  const [titleErr, setTitleErr] = useState("");
  const [scoreErr, setScoreErr] = useState("");
  const updateGoal = useUpdateGoal();

  async function handleSave() {
    let valid = true;
    if (!title.trim()) {
      setTitleErr("Title is required");
      valid = false;
    } else {
      setTitleErr("");
    }
    const score = Number(targetScore);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setScoreErr("Score must be between 0 and 100");
      valid = false;
    } else {
      setScoreErr("");
    }
    if (!valid) return;
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        title: title.trim(),
        targetScore: BigInt(score),
      });
      toast.success("Goal updated!");
      onClose();
    } catch {
      toast.error("Failed to update goal");
    }
  }

  return (
    <DialogContent data-ocid="goals.edit.dialog">
      <DialogHeader>
        <DialogTitle>Edit Goal</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-goal-title">Title</Label>
          <Input
            id="edit-goal-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleErr("");
            }}
            className={titleErr ? "border-destructive" : ""}
            data-ocid="goals.edit.input"
          />
          {titleErr && <p className="text-xs text-destructive">{titleErr}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-goal-score">Target Score (0–100)</Label>
          <Input
            id="edit-goal-score"
            type="number"
            min={0}
            max={100}
            value={targetScore}
            onChange={(e) => {
              setTargetScore(e.target.value);
              setScoreErr("");
            }}
            className={scoreErr ? "border-destructive" : ""}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            data-ocid="goals.edit.score.input"
          />
          {scoreErr && <p className="text-xs text-destructive">{scoreErr}</p>}
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          data-ocid="goals.edit.cancel_button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateGoal.isPending}
          data-ocid="goals.edit.save_button"
        >
          {updateGoal.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function Goals() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [targetScore, setTargetScore] = useState("80");
  const [titleErr, setTitleErr] = useState("");
  const [subjectErr, setSubjectErr] = useState("");
  const [scoreErr, setScoreErr] = useState("");

  const { data: goals = [], isLoading: goalsLoading } = useListGoals();
  const { data: subjects = [], isLoading: subjectsLoading } = useListSubjects();
  const { data: subjectStats = [] } = useAllSubjectStats(
    subjects.map((s) => s.id),
  );
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();
  const { checkAndNotify, permissionGranted } = useNotifications();

  // Auto-check notifications whenever page opens or becomes visible
  useEffect(() => {
    if (subjectStats.length > 0 && goals.length > 0) {
      checkAndNotify(subjectStats, goals);
    }

    function onVisibility() {
      if (
        document.visibilityState === "visible" &&
        subjectStats.length > 0 &&
        goals.length > 0
      ) {
        checkAndNotify(subjectStats, goals);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [subjectStats, goals, checkAndNotify]);

  const subjectMap = new Map(subjects.map((s) => [s.id.toString(), s]));
  const statsMap = new Map(
    subjectStats.map((st) => [
      st.subject.id.toString(),
      Number(st.averageScore),
    ]),
  );

  function reset() {
    setTitle("");
    setSubjectId("");
    setTargetScore("80");
    setTitleErr("");
    setSubjectErr("");
    setScoreErr("");
  }

  function validate(): boolean {
    let valid = true;
    if (!title.trim()) {
      setTitleErr("Title is required");
      valid = false;
    } else {
      setTitleErr("");
    }
    if (!subjectId) {
      setSubjectErr("Please select a subject");
      valid = false;
    } else {
      setSubjectErr("");
    }
    const score = Number(targetScore);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setScoreErr("Score must be between 0 and 100");
      valid = false;
    } else {
      setScoreErr("");
    }
    return valid;
  }

  async function handleCreate() {
    if (!validate()) return;
    const score = Number(targetScore);
    try {
      await createGoal.mutateAsync({
        subjectId: BigInt(subjectId),
        title: title.trim(),
        targetScore: BigInt(score),
      });
      toast.success("Goal created!");
      reset();
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create goal");
    }
  }

  async function handleDelete(goalId: bigint) {
    try {
      await deleteGoal.mutateAsync(goalId);
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal");
    }
  }

  function setNotifyEnabled(subjectIdStr: string, enabled: boolean) {
    localStorage.setItem(
      `notify_enabled_${subjectIdStr}`,
      enabled ? "true" : "false",
    );
  }

  // Local state for notify toggles
  const [notifyState, setNotifyState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (subjects.length > 0) {
      const state: Record<string, boolean> = {};
      for (const s of subjects) {
        const val = localStorage.getItem(`notify_enabled_${s.id.toString()}`);
        state[s.id.toString()] = val !== "false";
      }
      setNotifyState(state);
    }
  }, [subjects]);

  function toggleNotify(subjectIdStr: string) {
    const next = !notifyState[subjectIdStr];
    setNotifyState((prev) => ({ ...prev, [subjectIdStr]: next }));
    setNotifyEnabled(subjectIdStr, next);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Goals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Set target scores and track your progress
          </p>
          {!permissionGranted && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Enable notifications to get study alerts when you're falling
              behind.
            </p>
          )}
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(v) => {
            if (!v) reset();
            setCreateOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold self-start sm:self-auto"
              data-ocid="goals.open_modal_button"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="goals.dialog">
            <DialogHeader>
              <DialogTitle>New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {subjects.length === 0 && !subjectsLoading ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You need to{" "}
                  <Link
                    to="/subjects"
                    className="underline font-semibold"
                    onClick={() => setCreateOpen(false)}
                  >
                    add a subject
                  </Link>{" "}
                  first before creating a goal.
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="goal-title">Title</Label>
                <Input
                  id="goal-title"
                  placeholder="e.g. Ace the midterm"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setTitleErr("");
                  }}
                  className={titleErr ? "border-destructive" : ""}
                  data-ocid="goals.input"
                />
                {titleErr && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="goals.input.error_state"
                  >
                    {titleErr}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select
                  value={subjectId}
                  onValueChange={(v) => {
                    setSubjectId(v);
                    if (v) setSubjectErr("");
                  }}
                  disabled={subjects.length === 0}
                >
                  <SelectTrigger
                    className={subjectErr ? "border-destructive" : ""}
                    data-ocid="goals.select"
                  >
                    <SelectValue placeholder="Pick a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id.toString()} value={s.id.toString()}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ background: s.color }}
                          />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {subjectErr && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="goals.select.error_state"
                  >
                    {subjectErr}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-score">Target Score (0–100)</Label>
                <Input
                  id="goal-score"
                  type="number"
                  min={0}
                  max={100}
                  value={targetScore}
                  onChange={(e) => {
                    setTargetScore(e.target.value);
                    setScoreErr("");
                  }}
                  className={scoreErr ? "border-destructive" : ""}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  data-ocid="goals.score.input"
                />
                {scoreErr && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="goals.score.error_state"
                  >
                    {scoreErr}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  setCreateOpen(false);
                }}
                data-ocid="goals.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createGoal.isPending || subjects.length === 0}
                data-ocid="goals.submit_button"
              >
                {createGoal.isPending ? "Creating…" : "Create Goal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals grid */}
      {goalsLoading || subjectsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["1", "2", "3"].map((sk) => (
            <Skeleton
              key={sk}
              className="h-52 rounded-xl"
              data-ocid="goals.loading_state"
            />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-4"
          data-ocid="goals.empty_state"
        >
          <div className="bg-primary/10 rounded-full p-5">
            <Target className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">
              No goals yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Set a target score for a subject to start tracking
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setCreateOpen(true)}
            data-ocid="goals.primary_button"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add your first goal
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal, idx) => {
              const subject = subjectMap.get(goal.subjectId.toString());
              const currentScore = statsMap.get(goal.subjectId.toString()) ?? 0;
              const target = Number(goal.targetScore);
              const achieved = currentScore >= target;
              const gap = target - currentScore;
              const progressPct = Math.min(
                100,
                Math.round((currentScore / target) * 100),
              );
              const tip = getImprovementTip(achieved, gap);
              const isStruggling = !achieved && progressPct < 50;
              const subjectIdStr = goal.subjectId.toString();
              const notifyOn = notifyState[subjectIdStr] ?? true;

              return (
                <motion.div
                  key={goal.id.toString()}
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{
                    delay: idx * 0.06,
                    type: "spring",
                    stiffness: 260,
                    damping: 24,
                  }}
                  layout
                  data-ocid={`goals.item.${idx + 1}`}
                >
                  <Card
                    className={`shadow-card border-border hover:shadow-md transition-all duration-300 ${
                      isStruggling
                        ? "ring-2 ring-destructive/30 animate-[pulse_3s_ease-in-out_infinite]"
                        : ""
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold text-foreground truncate">
                            {goal.title}
                          </CardTitle>
                          {subject && (
                            <Badge
                              className="mt-1 text-white text-xs px-2 py-0.5"
                              style={{ background: subject.color }}
                            >
                              {subject.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Edit button */}
                          <Dialog
                            open={editGoal?.id === goal.id}
                            onOpenChange={(v) => {
                              if (!v) setEditGoal(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                onClick={() => setEditGoal(goal)}
                                data-ocid={`goals.edit_button.${idx + 1}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            {editGoal?.id === goal.id && (
                              <EditGoalDialog
                                goal={editGoal}
                                onClose={() => setEditGoal(null)}
                              />
                            )}
                          </Dialog>

                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(goal.id)}
                            disabled={deleteGoal.isPending}
                            data-ocid={`goals.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {achieved ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                          <CheckCircle2 className="h-5 w-5" />
                          Goal Achieved!
                        </div>
                      ) : null}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Current avg
                          </span>
                          <span className="font-semibold text-foreground">
                            {currentScore}% / {target}%
                          </span>
                        </div>
                        <Progress value={progressPct} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                          {progressPct}% to goal
                        </p>
                      </div>

                      {/* Improvement tip */}
                      <div className="flex items-start gap-2 bg-muted/60 rounded-lg px-3 py-2.5">
                        <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {tip}
                        </p>
                      </div>

                      {/* Notify me toggle */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground">
                          🔔 Notify me
                        </span>
                        <Switch
                          checked={notifyOn}
                          onCheckedChange={() => toggleNotify(subjectIdStr)}
                          data-ocid={`goals.notify.switch.${idx + 1}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
