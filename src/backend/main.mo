import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type Subject = {
    id : Nat;
    name : Text;
    color : Text;
    createdAt : Time.Time;
  };

  module Subject {
    public func compare(s1 : Subject, s2 : Subject) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };
  };

  type Session = {
    id : Nat;
    subjectId : Nat;
    date : Text;
    score : Nat;
    durationMinutes : Nat;
    notes : Text;
    createdAt : Time.Time;
  };

  module Session {
    public func compare(s1 : Session, s2 : Session) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };

    public func compareByCreatedAt(s1 : Session, s2 : Session) : Order.Order {
      Int.compare(s2.createdAt, s1.createdAt);
    };
  };

  type Goal = {
    id : Nat;
    subjectId : Nat;
    title : Text;
    targetScore : Nat;
    createdAt : Time.Time;
  };

  module Goal {
    public func compare(g1 : Goal, g2 : Goal) : Order.Order {
      Nat.compare(g1.id, g2.id);
    };
  };

  type SubjectStats = {
    subject : Subject;
    sessionCount : Nat;
    averageScore : Nat;
    totalDuration : Nat;
    lastScore : Nat;
    scoreDelta : Int;
  };

  type OverallStats = {
    totalSessions : Nat;
    totalDuration : Nat;
    overallAverageScore : Nat;
  };

  // Keep original UserProfile type to preserve userProfiles stable var
  public type UserProfile = {
    name : Text;
  };

  // Keep original UserData type to preserve users stable var compatibility
  type UserData = {
    var nextSubjectId : Nat;
    subjects : Map.Map<Nat, Subject>;
    var nextSessionId : Nat;
    sessions : Map.Map<Nat, Session>;
  };

  // Goals stored separately per user (new stable var — additions are always safe)
  type GoalData = {
    var nextGoalId : Nat;
    goals : Map.Map<Nat, Goal>;
  };

  // Preserve all original stable vars
  let users = Map.empty<Principal, UserData>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // New stable var for goals — safe to add
  let goalsByUser = Map.empty<Principal, GoalData>();

  // Subject Management
  public shared ({ caller }) func createSubject(name : Text, color : Text) : async Nat {
    let userData = getUserData(caller);
    let subjectId = userData.nextSubjectId;
    let subject : Subject = {
      id = subjectId;
      name;
      color;
      createdAt = Time.now();
    };
    userData.subjects.add(subjectId, subject);
    userData.nextSubjectId += 1;
    subjectId;
  };

  public query ({ caller }) func listSubjects() : async [Subject] {
    let userData = getUserData(caller);
    userData.subjects.values().toArray().sort();
  };

  public shared ({ caller }) func deleteSubject(subjectId : Nat) : async () {
    let userData = getUserData(caller);
    if (not userData.subjects.containsKey(subjectId)) {
      Runtime.trap("Subject not found");
    };
    userData.subjects.remove(subjectId);
  };

  // Session Management
  public shared ({ caller }) func logSession(subjectId : Nat, date : Text, score : Nat, durationMinutes : Nat, notes : Text) : async Nat {
    let userData = getUserData(caller);
    if (not userData.subjects.containsKey(subjectId)) {
      Runtime.trap("Subject does not exist");
    };
    if (score > 100) {
      Runtime.trap("Score must be between 0 and 100");
    };

    let sessionId = userData.nextSessionId;
    let session : Session = {
      id = sessionId;
      subjectId;
      date;
      score;
      durationMinutes;
      notes;
      createdAt = Time.now();
    };
    userData.sessions.add(sessionId, session);
    userData.nextSessionId += 1;
    sessionId;
  };

  public shared ({ caller }) func updateSession(id : Nat, date : Text, score : Nat, durationMinutes : Nat, notes : Text) : async () {
    let userData = getUserData(caller);
    let existing = switch (userData.sessions.get(id)) {
      case (null) { Runtime.trap("Session not found") };
      case (?s) { s };
    };
    if (score > 100) {
      Runtime.trap("Score must be between 0 and 100");
    };
    let updated : Session = {
      id = existing.id;
      subjectId = existing.subjectId;
      date;
      score;
      durationMinutes;
      notes;
      createdAt = existing.createdAt;
    };
    userData.sessions.add(id, updated);
  };

  public query ({ caller }) func getSessionsForSubject(subjectId : Nat) : async [Session] {
    let userData = getUserData(caller);
    let sessions = List.empty<Session>();
    for (session in userData.sessions.values()) {
      if (session.subjectId == subjectId) {
        sessions.add(session);
      };
    };
    sessions.toArray().sort();
  };

  public query ({ caller }) func getRecentSessions() : async [Session] {
    let userData = getUserData(caller);
    userData.sessions.values().toArray().sort(Session.compareByCreatedAt).sliceToArray(0, 20);
  };

  // Statistics
  public query ({ caller }) func getSubjectStats(subjectId : Nat) : async SubjectStats {
    let userData = getUserData(caller);
    let subject = switch (userData.subjects.get(subjectId)) {
      case (null) { Runtime.trap("Subject not found") };
      case (?s) { s };
    };

    var sessionCount = 0;
    var totalScore = 0;
    var totalDuration = 0;
    var lastScore = 0;
    var prevScore = 0;

    for (session in userData.sessions.values()) {
      if (session.subjectId == subjectId) {
        sessionCount += 1;
        totalScore += session.score;
        totalDuration += session.durationMinutes;
        prevScore := lastScore;
        lastScore := session.score;
      };
    };

    let averageScore = if (sessionCount > 0) { totalScore / sessionCount } else { 0 };
    let scoreDelta = lastScore - prevScore;

    {
      subject;
      sessionCount;
      averageScore;
      totalDuration;
      lastScore;
      scoreDelta;
    };
  };

  public query ({ caller }) func getOverallStats() : async OverallStats {
    let userData = getUserData(caller);
    var totalSessions = 0;
    var totalScore = 0;
    var totalDuration = 0;

    for (session in userData.sessions.values()) {
      totalSessions += 1;
      totalScore += session.score;
      totalDuration += session.durationMinutes;
    };

    let overallAverageScore = if (totalSessions > 0) { totalScore / totalSessions } else { 0 };

    {
      totalSessions;
      totalDuration;
      overallAverageScore;
    };
  };

  // Goals Management
  public shared ({ caller }) func createGoal(subjectId : Nat, title : Text, targetScore : Nat) : async Nat {
    let userData = getUserData(caller);
    if (not userData.subjects.containsKey(subjectId)) {
      Runtime.trap("Subject does not exist");
    };
    if (targetScore > 100) {
      Runtime.trap("Target score must be between 0 and 100");
    };
    let gd = getGoalData(caller);
    let goalId = gd.nextGoalId;
    let goal : Goal = {
      id = goalId;
      subjectId;
      title;
      targetScore;
      createdAt = Time.now();
    };
    gd.goals.add(goalId, goal);
    gd.nextGoalId += 1;
    goalId;
  };

  public query ({ caller }) func listGoals() : async [Goal] {
    let gd = getGoalData(caller);
    gd.goals.values().toArray().sort();
  };

  public shared ({ caller }) func deleteGoal(goalId : Nat) : async () {
    let gd = getGoalData(caller);
    if (not gd.goals.containsKey(goalId)) {
      Runtime.trap("Goal not found");
    };
    gd.goals.remove(goalId);
  };

  public shared ({ caller }) func updateGoal(id : Nat, title : Text, targetScore : Nat) : async () {
    let gd = getGoalData(caller);
    let existing = switch (gd.goals.get(id)) {
      case (null) { Runtime.trap("Goal not found") };
      case (?g) { g };
    };
    if (targetScore > 100) {
      Runtime.trap("Target score must be between 0 and 100");
    };
    let updated : Goal = {
      id = existing.id;
      subjectId = existing.subjectId;
      title;
      targetScore;
      createdAt = existing.createdAt;
    };
    gd.goals.add(id, updated);
  };

  // Helper Functions
  func getUserData(user : Principal) : UserData {
    switch (users.get(user)) {
      case (null) {
        let newUserData : UserData = {
          var nextSubjectId = 0;
          subjects = Map.empty<Nat, Subject>();
          var nextSessionId = 0;
          sessions = Map.empty<Nat, Session>();
        };
        users.add(user, newUserData);
        newUserData;
      };
      case (?userData) { userData };
    };
  };

  func getGoalData(user : Principal) : GoalData {
    switch (goalsByUser.get(user)) {
      case (null) {
        let newGoalData : GoalData = {
          var nextGoalId = 0;
          goals = Map.empty<Nat, Goal>();
        };
        goalsByUser.add(user, newGoalData);
        newGoalData;
      };
      case (?gd) { gd };
    };
  };

  // Keep profile methods to preserve stable var compatibility
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };
};
