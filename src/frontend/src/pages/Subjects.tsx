import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { BookMarked, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllSubjectStats,
  useCreateSubject,
  useDeleteSubject,
  useListSubjects,
} from "../hooks/useQueries";

const PRESET_COLORS = [
  "#2F9FA7",
  "#2F4B66",
  "#C9A23A",
  "#4A8C8C",
  "#8B5CF6",
  "#E85D4A",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
];

export default function Subjects() {
  const { data: subjects = [], isLoading } = useListSubjects();
  const { data: allStats = [] } = useAllSubjectStats(subjects.map((s) => s.id));
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();

  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a subject name");
      return;
    }
    try {
      await createSubject.mutateAsync({ name: name.trim(), color });
      toast.success(`Subject "${name}" created!`);
      setName("");
      setColor(PRESET_COLORS[0]);
    } catch {
      toast.error("Failed to create subject");
    }
  };

  const handleDelete = async (id: bigint, subjectName: string) => {
    try {
      await deleteSubject.mutateAsync(id);
      toast.success(`"${subjectName}" deleted`);
    } catch {
      toast.error("Failed to delete subject");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage the subjects you're studying
        </p>
      </div>

      {/* Add Subject Form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Add New Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreate}
              className="flex flex-col sm:flex-row gap-4 items-end"
            >
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="subjectName">Subject Name</Label>
                <Input
                  id="subjectName"
                  placeholder="e.g. Data Structures, Physics, French..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-ocid="subjects.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                        color === c
                          ? "ring-2 ring-offset-1 ring-foreground scale-110"
                          : ""
                      }`}
                      style={{ background: c }}
                      onClick={() => setColor(c)}
                      data-ocid="subjects.color.toggle"
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border-0 p-0"
                    title="Custom color"
                    data-ocid="subjects.custom_color.input"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={createSubject.isPending}
                className="shrink-0"
                data-ocid="subjects.add.button"
              >
                {createSubject.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Add Subject
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subjects List */}
      <div className="space-y-2">
        {isLoading ? (
          ["1", "2", "3"].map((sk) => (
            <Skeleton
              key={sk}
              className="h-20 rounded-lg"
              data-ocid="subjects.list.loading_state"
            />
          ))
        ) : subjects.length === 0 ? (
          <Card className="shadow-card border-border">
            <CardContent
              className="py-12 text-center"
              data-ocid="subjects.list.empty_state"
            >
              <BookMarked className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-foreground">No subjects yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first subject above to start tracking your study
                progress.
              </p>
            </CardContent>
          </Card>
        ) : (
          subjects.map((subject, idx) => {
            const st = allStats.find(
              (s) => s.subject.id.toString() === subject.id.toString(),
            );
            return (
              <motion.div
                key={subject.id.toString()}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                data-ocid={`subjects.item.${idx + 1}`}
              >
                <Card className="shadow-card border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                        style={{ background: subject.color }}
                      >
                        {subject.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">
                          {subject.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            {st ? Number(st.sessionCount) : 0} sessions
                          </span>
                          <span>
                            {st ? `Avg ${Number(st.averageScore)}%` : "No data"}
                          </span>
                          {st && Number(st.totalDuration) > 0 && (
                            <span>
                              {Math.floor(Number(st.totalDuration) / 60)}h{" "}
                              {Number(st.totalDuration) % 60}m total
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to="/subjects/$subjectId"
                          params={{ subjectId: subject.id.toString() }}
                          data-ocid={`subjects.view.button.${idx + 1}`}
                        >
                          <Button variant="outline" size="sm" className="gap-1">
                            View <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              data-ocid={`subjects.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-ocid="subjects.delete.dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete "{subject.name}"?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the subject and all
                                its sessions. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="subjects.delete.cancel.button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(subject.id, subject.name)
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-ocid="subjects.delete.confirm.button"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
