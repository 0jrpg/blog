export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags?: string[];
}

export interface PostIndex {
  posts: PostMeta[];
}

export interface Post extends PostMeta {
  content: string[];
}

export type Role = "admin" | "colaborador";

export interface Collaborator {
  login: string;
  avatarUrl: string;
  permission: string;
  role: Role | null;
}

export interface PostFormData {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags: string[];
  content: string[];
}
