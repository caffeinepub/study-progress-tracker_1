import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Goal } from "../backend.d";
import { useActor } from "./useActor";

export function useListSubjects() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSubjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOverallStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["overallStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOverallStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecentSessions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["recentSessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubjectStats(subjectId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["subjectStats", subjectId?.toString()],
    queryFn: async () => {
      if (!actor || subjectId === null) return null;
      return actor.getSubjectStats(subjectId);
    },
    enabled: !!actor && !isFetching && subjectId !== null,
  });
}

export function useSessionsForSubject(subjectId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sessions", subjectId?.toString()],
    queryFn: async () => {
      if (!actor || subjectId === null) return [];
      return actor.getSessionsForSubject(subjectId);
    },
    enabled: !!actor && !isFetching && subjectId !== null,
  });
}

export function useAllSubjectStats(subjectIds: bigint[]) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: [
      "allSubjectStats",
      subjectIds.map((id) => id.toString()).join(","),
    ],
    queryFn: async () => {
      if (!actor || subjectIds.length === 0) return [];
      return Promise.all(subjectIds.map((id) => actor.getSubjectStats(id)));
    },
    enabled: !!actor && !isFetching && subjectIds.length > 0,
  });
}

export function useCreateSubject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createSubject(name, color);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subjectId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteSubject(subjectId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useLogSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subjectId,
      date,
      score,
      durationMinutes,
      notes,
    }: {
      subjectId: bigint;
      date: string;
      score: bigint;
      durationMinutes: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.logSession(subjectId, date, score, durationMinutes, notes);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recentSessions"] });
      qc.invalidateQueries({ queryKey: ["overallStats"] });
      qc.invalidateQueries({ queryKey: ["allSubjectStats"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["subjectStats"] });
    },
  });
}

// Goal and session update methods exist on the backend but types haven't been regenerated yet;
// cast actor to access them safely.
type ActorWithGoals = {
  listGoals(): Promise<Array<Goal>>;
  createGoal(
    subjectId: bigint,
    title: string,
    targetScore: bigint,
  ): Promise<bigint>;
  deleteGoal(goalId: bigint): Promise<void>;
  updateSession(
    id: bigint,
    date: string,
    score: bigint,
    durationMinutes: bigint,
    notes: string,
  ): Promise<void>;
  updateGoal(id: bigint, title: string, targetScore: bigint): Promise<void>;
};

export function useListGoals() {
  const { actor, isFetching } = useActor();
  return useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as unknown as ActorWithGoals).listGoals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subjectId,
      title,
      targetScore,
    }: {
      subjectId: bigint;
      title: string;
      targetScore: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as unknown as ActorWithGoals).createGoal(
        subjectId,
        title,
        targetScore,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useDeleteGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goalId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return (actor as unknown as ActorWithGoals).deleteGoal(goalId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      date,
      score,
      durationMinutes,
      notes,
    }: {
      id: bigint;
      date: string;
      score: bigint;
      durationMinutes: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as unknown as ActorWithGoals).updateSession(
        id,
        date,
        score,
        durationMinutes,
        notes,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["subjectStats"] });
      qc.invalidateQueries({ queryKey: ["allSubjectStats"] });
      qc.invalidateQueries({ queryKey: ["recentSessions"] });
    },
  });
}

export function useUpdateGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      targetScore,
    }: {
      id: bigint;
      title: string;
      targetScore: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as unknown as ActorWithGoals).updateGoal(
        id,
        title,
        targetScore,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
