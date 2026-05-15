export type AuthUserSummary = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthProfileSummary = {
  id: string;
  username: string;
  displayName: string | null;
  isPublic: boolean;
};

export type AuthSessionSummary = {
  user: AuthUserSummary;
  profile: AuthProfileSummary;
};
