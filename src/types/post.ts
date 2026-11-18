export type PostStatus = 'Published' | 'Draft';

export interface Post {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  status: PostStatus;
  imageUrl: string;
  excerpt: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  title: string;
  category: string;
  author?: string;
  status: PostStatus;
  imageUrl?: string;
  excerpt?: string;
  content: string;
}

export interface UpdatePostInput {
  title?: string;
  category?: string;
  author?: string;
  status?: PostStatus;
  imageUrl?: string;
  excerpt?: string;
  content?: string;
}
