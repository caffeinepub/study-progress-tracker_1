import { useCallback, useEffect, useState } from "react";
import type { Goal } from "../backend.d";

type SubjectStat = {
  subject: { id: bigint; name: string };
  averageScore: bigint;
};

/** Pure logic — can be called outside React (e.g. in useQueries onSuccess) */
export function checkAndNotifyStandalone(
  subjectStats: SubjectStat[],
  goals: Goal[],
) {
  if (!goals.length || !subjectStats.length) return;
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  )
    return;

  const goalMap = new Map<string, Goal>();
  for (const g of goals) {
    goalMap.set(g.subjectId.toString(), g);
  }

  for (const stat of subjectStats) {
    const idStr = stat.subject.id.toString();
    const goal = goalMap.get(idStr);
    if (!goal) continue;

    const avg = Number(stat.averageScore);
    if (avg >= 60) continue;

    // Check per-subject notification toggle (default on)
    const notifyEnabled = localStorage.getItem(`notify_enabled_${idStr}`);
    if (notifyEnabled === "false") continue;

    // Throttle: once per 24h
    const lastKey = `notify_last_${idStr}`;
    const last = localStorage.getItem(lastKey);
    const now = Date.now();
    if (last && now - Number(last) < 24 * 60 * 60 * 1000) continue;

    try {
      new Notification(`Study Alert: ${stat.subject.name}`, {
        body: `Your average score is ${avg}%. Your goal is ${Number(goal.targetScore)}%. Time to study!`,
        icon: "/favicon.ico",
      });
      localStorage.setItem(lastKey, now.toString());
    } catch {
      // Notifications may be blocked
    }
  }
}

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(
    typeof Notification !== "undefined" &&
      Notification.permission === "granted",
  );

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermissionGranted(Notification.permission === "granted");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      setPermissionGranted(true);
      return;
    }
    if (Notification.permission === "denied") return;
    const result = await Notification.requestPermission();
    setPermissionGranted(result === "granted");
  }, []);

  const checkAndNotify = useCallback(
    (subjectStats: SubjectStat[], goals: Goal[]) => {
      checkAndNotifyStandalone(subjectStats, goals);
    },
    [],
  );

  return { permissionGranted, requestPermission, checkAndNotify };
}
