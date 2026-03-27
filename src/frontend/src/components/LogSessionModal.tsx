import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useListSubjects, useLogSession } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultSubjectId?: string;
}

export default function LogSessionModal({
  open,
  onOpenChange,
  defaultSubjectId,
}: Props) {
  const { data: subjects = [] } = useListSubjects();
  const logSession = useLogSession();

  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? "");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [score, setScore] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setSubjectId(defaultSubjectId ?? "");
    setDate(new Date().toISOString().split("T")[0]);
    setScore("");
    setDuration("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !score || !duration) {
      toast.error("Please fill all required fields");
      return;
    }
    const scoreNum = Number(score);
    const durationNum = Number(duration);
    if (scoreNum < 0 || scoreNum > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }
    try {
      await logSession.mutateAsync({
        subjectId: BigInt(subjectId),
        date,
        score: BigInt(Math.round(scoreNum)),
        durationMinutes: BigInt(Math.round(durationNum)),
        notes,
      });
      toast.success("Session logged successfully!");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to log session. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="log_session.dialog">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Log Study Session
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger data-ocid="log_session.subject.select">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id.toString()} value={s.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: s.color }}
                      />
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {subjects.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No subjects yet — add one on the Subjects page first.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-ocid="log_session.date.input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="score">Score (0-100) *</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 85"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                data-ocid="log_session.score.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (min) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="e.g. 60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                data-ocid="log_session.duration.input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="What did you study? Any insights?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
              data-ocid="log_session.notes.textarea"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="log_session.cancel.button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={logSession.isPending}
              data-ocid="log_session.submit.button"
            >
              {logSession.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging...
                </>
              ) : (
                "Log Session"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
