export type Visibility = "public" | "unlisted" | "private";

export type Theme = "azure" | "violet" | "mint" | "sunset";

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  visibility: Visibility;
  theme: Theme;
}

export interface PostIndexEntry extends PostMeta {
  // usado só no índice interno (criptografado); nunca exposto por /api/posts
  // para quem não tem permissão de ver o post.
}

export interface PostIndex {
  posts: PostIndexEntry[];
}

export interface Post extends PostMeta {
  /** HTML já sanitizado, produzido pelo editor rico. */
  html: string;
}

export interface PostFormData {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags: string[];
  visibility: Visibility;
  theme: Theme;
  html: string;
}

export type Role = "admin" | "colaborador" | null;

export interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  contentType: "page" | "image" | "pdf" | "other";
}
