export interface AppUser {
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface AppSession {
  user: AppUser;
}
