/**
 * Pro-Connect DB 타입 (Supabase public 스키마)
 */

export type ProfileRole =
  | "lawyer"
  | "labor_attorney"
  | "tax_accountant"
  | "patent_attorney"
  | "other";

export type PostStatus = "open" | "closed";

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: ProfileRole;
  certificate_number: string | null;
  office_location: string | null;
  verification_status: boolean;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string | null;
  budget: string | null;
  deadline: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  post_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
}

export interface PostWithAuthor extends Post {
  author?: Pick<Profile, "id" | "full_name" | "role" | "office_location"> | null;
}
