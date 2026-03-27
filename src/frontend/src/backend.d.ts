import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Session {
    id: bigint;
    date: string;
    createdAt: Time;
    score: bigint;
    durationMinutes: bigint;
    subjectId: bigint;
    notes: string;
}
export type Time = bigint;
export interface SubjectStats {
    scoreDelta: bigint;
    subject: Subject;
    totalDuration: bigint;
    lastScore: bigint;
    sessionCount: bigint;
    averageScore: bigint;
}
export interface OverallStats {
    totalDuration: bigint;
    overallAverageScore: bigint;
    totalSessions: bigint;
}
export interface Subject {
    id: bigint;
    name: string;
    createdAt: Time;
    color: string;
}
export interface Goal {
    id: bigint;
    subjectId: bigint;
    title: string;
    targetScore: bigint;
    createdAt: Time;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    _initializeAccessControlWithSecret(adminToken: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    getCallerUserRole(): Promise<UserRole>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    createSubject(name: string, color: string): Promise<bigint>;
    deleteSubject(subjectId: bigint): Promise<void>;
    getOverallStats(): Promise<OverallStats>;
    getRecentSessions(): Promise<Array<Session>>;
    getSessionsForSubject(subjectId: bigint): Promise<Array<Session>>;
    getSubjectStats(subjectId: bigint): Promise<SubjectStats>;
    listSubjects(): Promise<Array<Subject>>;
    logSession(subjectId: bigint, date: string, score: bigint, durationMinutes: bigint, notes: string): Promise<bigint>;
    createGoal(subjectId: bigint, title: string, targetScore: bigint): Promise<bigint>;
    listGoals(): Promise<Array<Goal>>;
    deleteGoal(goalId: bigint): Promise<void>;
}
