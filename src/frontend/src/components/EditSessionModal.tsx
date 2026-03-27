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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Session } from "../backend.d";
import { useUpdateSession } from "../hooks/useQueries";

interface Props {
  session: Session | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function EditSessionModal({
  session,
  open,
  onOpenChange,
}: Props) {
  const updateSession = useUpdateSession();

  const [date, setDate] = useState("");
  const [score, setScore] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (session) {
      setDate(session.date);
      setScore(Number(session.score).toString());
      setDuration(Number(session.durationMinutes).toString());
      setNotes(session.notes);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !score || !duration) {
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
      await updateSession.mutateAsync({
        id: session.id,
        date,
        score: BigInt(Math.round(scoreNum)),
        durationMinutes: BigInt(Math.round(durationNum)),
        notes,
      });
      toast.success("Session updated!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update session.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="edit_session.dialog">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-date">Date *</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-ocid="edit_session.date.input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-score">Score (0-100) *</Label>
              <Input
                id="edit-score"
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                data-ocid="edit_session.score.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-duration">Duration (min) *</Label>
              <Input
                id="edit-duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                data-ocid="edit_session.duration.input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="What did you study?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
              data-ocid="edit_session.notes.textarea"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="edit_session.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateSession.isPending}
              data-ocid="edit_session.save_button"
            >
              {updateSession.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
