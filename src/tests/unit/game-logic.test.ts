import { MatchStage, MatchStatus } from "@prisma/client";

import {
  canSubmitPrediction,
  computeLeaderboard,
  getPredictionAvailabilityLabel,
  isPredictionLocked,
  isPredictionMatchDay,
} from "@/lib/game";

describe("game logic", () => {
  it("locks predictions at the exact cutoff instant", () => {
    const cutoff = new Date("2026-03-28T13:00:00.000Z");

    expect(isPredictionLocked(new Date("2026-03-28T12:59:59.999Z"), cutoff)).toBe(false);
    expect(isPredictionLocked(new Date("2026-03-28T13:00:00.000Z"), cutoff)).toBe(true);
  });

  it("opens predictions only on the match day in IST", () => {
    const startTimeUtc = new Date("2026-03-28T14:00:00.000Z");
    const cutoffTimeUtc = new Date("2026-03-28T13:00:00.000Z");

    expect(isPredictionMatchDay(new Date("2026-03-27T18:29:59.000Z"), startTimeUtc)).toBe(
      false,
    );
    expect(isPredictionMatchDay(new Date("2026-03-27T18:30:00.000Z"), startTimeUtc)).toBe(
      true,
    );

    expect(
      canSubmitPrediction(
        new Date("2026-03-27T18:29:59.000Z"),
        startTimeUtc,
        cutoffTimeUtc,
      ),
    ).toBe(false);
    expect(
      canSubmitPrediction(
        new Date("2026-03-27T18:30:00.000Z"),
        startTimeUtc,
        cutoffTimeUtc,
      ),
    ).toBe(true);
  });

  it("blocks future-day submissions even when the cutoff has not passed", () => {
    const startTimeUtc = new Date("2026-04-03T14:00:00.000Z");
    const cutoffTimeUtc = new Date("2026-04-03T13:00:00.000Z");
    const now = new Date("2026-04-02T12:00:00.000Z");

    expect(canSubmitPrediction(now, startTimeUtc, cutoffTimeUtc)).toBe(false);
    expect(
      getPredictionAvailabilityLabel(
        {
          startTimeUtc,
          cutoffTimeUtc,
          status: MatchStatus.SCHEDULED,
          settledAt: null,
          winningTeamId: null,
        },
        now,
      ),
    ).toBe("Predictions open on 3 Apr");
  });

  it("computes leaderboard points, accuracy, missed picks, and late-join filtering", () => {
    const memberships = [
      {
        userId: "u1",
        joinedAt: new Date("2026-03-27T00:00:00.000Z"),
        user: { id: "u1", name: "Aarav", image: null, email: "aarav@example.com" },
      },
      {
        userId: "u2",
        joinedAt: new Date("2026-04-02T13:05:00.000Z"),
        user: { id: "u2", name: "Mira", image: null, email: "mira@example.com" },
      },
    ];

    const matches = [
      {
        id: "m1",
        matchNumber: 1,
        stage: MatchStage.LEAGUE,
        status: MatchStatus.COMPLETED,
        startTimeUtc: new Date("2026-03-28T14:00:00.000Z"),
        cutoffTimeUtc: new Date("2026-03-28T13:00:00.000Z"),
        winningTeamId: "t1",
        settledAt: new Date("2026-03-28T18:00:00.000Z"),
      },
      {
        id: "m2",
        matchNumber: 2,
        stage: MatchStage.LEAGUE,
        status: MatchStatus.COMPLETED,
        startTimeUtc: new Date("2026-04-03T14:00:00.000Z"),
        cutoffTimeUtc: new Date("2026-04-03T13:00:00.000Z"),
        winningTeamId: "t3",
        settledAt: new Date("2026-04-03T18:00:00.000Z"),
      },
    ];

    const predictions = [
      {
        userId: "u1",
        matchId: "m1",
        predictedTeamId: "t1",
        submittedAt: new Date("2026-03-28T12:40:00.000Z"),
      },
      {
        userId: "u1",
        matchId: "m2",
        predictedTeamId: "t4",
        submittedAt: new Date("2026-04-03T12:40:00.000Z"),
      },
    ];

    const rows = computeLeaderboard(memberships, matches, predictions);

    expect(rows[0]).toMatchObject({
      userId: "u1",
      points: 1,
      correct: 1,
      wrong: 1,
      missed: 0,
      eligibleMatches: 2,
    });
    expect(rows[0]?.accuracy).toBeCloseTo(0.5);

    expect(rows[1]).toMatchObject({
      userId: "u2",
      points: 0,
      correct: 0,
      wrong: 0,
      missed: 1,
      eligibleMatches: 1,
    });
    expect(rows[1]?.accuracy).toBe(0);
  });

  it("excludes abandoned and no-result matches from the accuracy denominator", () => {
    const memberships = [
      {
        userId: "u1",
        joinedAt: new Date("2026-03-27T00:00:00.000Z"),
        user: { id: "u1", name: "Aarav", image: null, email: "aarav@example.com" },
      },
    ];

    const matches = [
      {
        id: "m1",
        matchNumber: 1,
        stage: MatchStage.LEAGUE,
        status: MatchStatus.NO_RESULT,
        startTimeUtc: new Date("2026-03-28T14:00:00.000Z"),
        cutoffTimeUtc: new Date("2026-03-28T13:00:00.000Z"),
        winningTeamId: null,
        settledAt: new Date("2026-03-28T18:00:00.000Z"),
      },
      {
        id: "m2",
        matchNumber: 2,
        stage: MatchStage.LEAGUE,
        status: MatchStatus.ABANDONED,
        startTimeUtc: new Date("2026-03-29T14:00:00.000Z"),
        cutoffTimeUtc: new Date("2026-03-29T13:00:00.000Z"),
        winningTeamId: null,
        settledAt: new Date("2026-03-29T18:00:00.000Z"),
      },
    ];

    const rows = computeLeaderboard(memberships, matches, []);

    expect(rows[0]).toMatchObject({
      points: 0,
      eligibleMatches: 0,
      missed: 0,
      wrong: 0,
      correct: 0,
    });
    expect(rows[0]?.accuracy).toBe(0);
  });
});
