import type { MatchStage, MatchStatus, PredictionsRevealMode } from "@prisma/client";

export type AppUser = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
};

export type RoomSummaryView = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  joinedAt: string | null;
  memberCount: number;
  allowlistEnabled: boolean;
};

export type MatchTeamView = {
  id: string;
  name: string;
  shortCode: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

export type MatchDistributionView = {
  totalPredictions: number;
  picks: Array<{
    teamId: string;
    shortCode: string;
    count: number;
    percentage: number;
  }>;
};

export type MatchIndividualPickView = {
  userId: string;
  name: string;
  image: string | null;
  pickedTeamId: string;
  pickedTeamShortCode: string;
};

export type MatchCardView = {
  id: string;
  externalRef: string | null;
  matchNumber: number | null;
  stage: MatchStage;
  status: MatchStatus;
  startTimeUtc: string;
  cutoffTimeUtc: string;
  venue: string | null;
  city: string | null;
  teamA: MatchTeamView;
  teamB: MatchTeamView;
  winningTeamId: string | null;
  myPredictionTeamId: string | null;
  myPredictionSubmittedAt: string | null;
  isLocked: boolean;
  canPredictToday: boolean;
  isCollapsedFutureFixture: boolean;
  predictionAvailabilityLabel: string;
  countdownLabel: string;
  revealAggregate: boolean;
  revealIndividualPicks: boolean;
  showRoomPicksDisclosure: boolean;
  distribution: MatchDistributionView | null;
  individualPicks: MatchIndividualPickView[];
};

export type DashboardView = {
  greetingName: string;
  room: RoomSummaryView;
  joinedRooms: RoomSummaryView[];
  myRank: number | null;
  revealMode: PredictionsRevealMode;
  today: MatchCardView[];
  upcoming: MatchCardView[];
  settled: MatchCardView[];
};

export type RoomsHomeView = {
  currentRoomSlug: string | null;
  rooms: RoomSummaryView[];
};

export type RoomPicksView = {
  room: RoomSummaryView;
  todayMatches: MatchCardView[];
  pastMatches: MatchCardView[];
};

export type LeaderboardRowView = {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  points: number;
  correct: number;
  wrong: number;
  missed: number;
  eligibleMatches: number;
  accuracy: number;
  currentStreak: number;
};

export type HistoryRowView = {
  matchId: string;
  matchNumber: number | null;
  stage: MatchStage;
  startTimeUtc: string;
  venue: string | null;
  city: string | null;
  teamA: MatchTeamView;
  teamB: MatchTeamView;
  myPredictionTeamId: string | null;
  winningTeamId: string | null;
  status: MatchStatus;
  resultLabel: "Pre-Join" | "Pending" | "Correct" | "Wrong" | "Skipped" | "No Result";
  pointsEarned: number;
};

export type AdminRoomListItemView = {
  id: string;
  slug: string;
  name: string;
  code: string;
  isActive: boolean;
  allowlistEnabled: boolean;
  memberCount: number;
  inviteCount: number;
};

export type AdminRoomMemberView = {
  userId: string;
  name: string;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  joinedAt: string;
  removedAt: string | null;
  isActive: boolean;
};
