export const TEAM_BRANDING = {
  CSK: { primaryColor: "#F7C600", secondaryColor: "#0B2E6D" },
  DC: { primaryColor: "#1D428A", secondaryColor: "#EF3340" },
  GT: { primaryColor: "#0B163F", secondaryColor: "#A9894D" },
  KKR: { primaryColor: "#3A225D", secondaryColor: "#D4AF37" },
  LSG: { primaryColor: "#00AEEF", secondaryColor: "#F37D20" },
  MI: { primaryColor: "#004BA0", secondaryColor: "#D1AB3E" },
  PBKS: { primaryColor: "#D71920", secondaryColor: "#B0B7BC" },
  RCB: { primaryColor: "#B11116", secondaryColor: "#0A0A0A" },
  RR: { primaryColor: "#EA1A85", secondaryColor: "#1B2A59" },
  SRH: { primaryColor: "#F26522", secondaryColor: "#111827" },
} as const;

export type TeamShortCode = keyof typeof TEAM_BRANDING;
