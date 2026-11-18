import type { Post, CreatePostInput, UpdatePostInput } from '../types/post';

const STORAGE_KEY = 'pmt_posts_data';

const INITIAL_MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'Mastering Database Relations with Eloquent in Laravel',
    category: 'Database',
    author: 'Sarah Jenkins',
    date: '2026-11-08',
    status: 'Published',
    imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Learn how to build expressive relational schemas, pivot assignments, and eager loading queries in modern Laravel applications.',
    content: `Eloquent provides an expressive object-relational mapper that makes interacting with database tables intuitive and pleasant.

In this article, we dive deep into one-to-many, many-to-many relationships, composite pivot tables, and eager loading constraints to prevent N+1 query performance bottlenecks.

Key Concepts Covered:
1. Defining reciprocal relationships in Eloquent models.
2. Utilizing with() to eager-load related records efficiently.
3. Leveraging transactions when mutating pivot records across multiple entities.
4. Ensuring database integrity with foreign keys and cascade rules.`,
    createdAt: '2026-11-08T10:00:00.000Z',
    updatedAt: '2026-11-08T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'Building High-Performance RESTful APIs',
    category: 'Backend',
    author: 'Alex Rivera',
    date: '2026-11-05',
    status: 'Published',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Essential design patterns, pagination strategies, and caching mechanisms for enterprise web APIs.',
    content: `Architecting APIs that scale to millions of requests requires careful attention to resource serialization, HTTP status code consistency, and proper rate limiting.

When designing pagination, cursor-based pagination frequently outperforms offset-based pagination on large datasets. Additionally, caching frequently requested queries using Redis significantly reduces database CPU load.

Best Practices:
- Always version your public endpoints.
- Return consistent error envelopes with machine-readable codes.
- Implement idempotency keys for mutable operations like billing or payments.`,
    createdAt: '2026-11-05T14:30:00.000Z',
    updatedAt: '2026-11-05T14:30:00.000Z',
  },
  {
    id: '3',
    title: 'Modern Frontend Architecture and State Management',
    category: 'Frontend',
    author: 'Maya Patel',
    date: '2026-11-02',
    status: 'Published',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Comparing client-side stores, server cache invalidation, and lightweight local storage approaches.',
    content: `State management in modern web apps is transitioning from monolithic client stores towards localized server-state synchronizers and reactive primitives.

By keeping local UI state decoupled from shared entity records, applications remain responsive, maintainable, and easy to reason about. Component boundaries should encapsulate transient form state, leaving global state clean and predictable.`,
    createdAt: '2026-11-02T09:15:00.000Z',
    updatedAt: '2026-11-02T09:15:00.000Z',
  },
  {
    id: '4',
    title: 'A Comprehensive Guide to Microservices and Docker',
    category: 'DevOps',
    author: 'David Kim',
    date: '2026-10-28',
    status: 'Draft',
    imageUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Step-by-step container orchestration, network isolation, and continuous deployment workflows.',
    content: `Transitioning a monolithic service architecture into distributed microservices brings both horizontal scalability and operational complexity.

Docker simplifies the packaging and deployment lifecycle, ensuring consistency between local development and cloud production clusters. Use multi-stage builds to minimize image sizes and enhance security.`,
    createdAt: '2026-10-28T16:45:00.000Z',
    updatedAt: '2026-10-28T16:45:00.000Z',
  },
  {
    id: '5',
    title: 'Designing Beautiful and Accessible UI Systems',
    category: 'Design',
    author: 'Elena Gomez',
    date: '2026-10-24',
    status: 'Published',
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    excerpt: 'How thoughtful contrast ratios, semantic HTML, and fluid typography create exceptional user experiences.',
    content: `Inclusive software begins with accessibility at the foundation of design tokens. Contrast ratios, keyboard navigation, focus rings, and screen reader announcements must not be afterthoughts.

Design systems that prioritize accessibility create more usable, delighting products for everyone across both desktop and mobile devices.`,
    createdAt: '2026-10-24T11:20:00.000Z',
    updatedAt: '2026-10-24T11:20:00.000Z',
  },
  {
    id: '6',
    title: 'Automated Testing Strategies for Enterprise Applications',
    category: 'Testing',
    author: 'Sarah Jenkins',
    date: '2026-10-20',
    status: 'Draft',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Balancing unit tests, integration suites, and end-to-end checks to ensure production confidence.',
    content: `A reliable automated testing suite is the most effective safety net for rapid product iteration.

Unit tests ensure individual domain functions behave correctly, while integration tests verify database constraints, transactions, and API endpoints. Together, they create confidence for seamless continuous integration.`,
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-20T08:00:00.000Z',
  },
];

/**
 * Helper to retrieve stored posts or initialize with 6 mock posts.
 */
function loadPostsFromStorage(): Post[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_POSTS));
      return [...INITIAL_MOCK_POSTS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_POSTS));
      return [...INITIAL_MOCK_POSTS];
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load posts from localStorage, fallback to initial mock:', error);
    return [...INITIAL_MOCK_POSTS];
  }
}

/**
 * Helper to persist posts to localStorage.
 */
function savePostsToStorage(posts: Post[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    console.error('Failed to save posts to localStorage:', error);
  }
}

/**
 * Fetch all posts.
 * Supports filtering by category and search term.
 */
export async function getPosts(): Promise<Post[]> {
  // TODO: Replace with fetch('/api/posts', { method: 'GET' }) when backend endpoint is available.
  const posts = loadPostsFromStorage();
  return Promise.resolve(posts);
}

/**
 * Fetch a single post by ID.
 */
export async function getPostById(id: string): Promise<Post | null> {
  // TODO: Replace with fetch(`/api/posts/${id}`, { method: 'GET' }) when backend endpoint is available.
  const posts = loadPostsFromStorage();
  const post = posts.find((p) => String(p.id) === String(id));
  return Promise.resolve(post || null);
}

/**
 * Create a new post.
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  // TODO: Replace with fetch('/api/posts', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(input)
  // }) when backend endpoint is available.

  const posts = loadPostsFromStorage();
  const now = new Date();
  const dateFormatted = now.toISOString().split('T')[0];

  const newPost: Post = {
    id: Date.now().toString(),
    title: input.title.trim(),
    category: input.category || 'General',
    author: input.author?.trim() || 'Admin User',
    date: dateFormatted,
    status: input.status,
    imageUrl:
      input.imageUrl?.trim() ||
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    excerpt:
      input.excerpt?.trim() ||
      (input.content.trim().slice(0, 140) + (input.content.length > 140 ? '...' : '')),
    content: input.content.trim(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const updatedPosts = [newPost, ...posts];
  savePostsToStorage(updatedPosts);
  return Promise.resolve(newPost);
}

/**
 * Update an existing post by ID.
 */
export async function updatePost(id: string, input: UpdatePostInput): Promise<Post> {
  // TODO: Replace with fetch(`/api/posts/${id}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(input)
  // }) when backend endpoint is available.

  const posts = loadPostsFromStorage();
  const index = posts.findIndex((p) => String(p.id) === String(id));

  if (index === -1) {
    throw new Error(`Post with id "${id}" was not found.`);
  }

  const existing = posts[index];
  const now = new Date();

  const updated: Post = {
    ...existing,
    title: input.title !== undefined ? input.title.trim() : existing.title,
    category: input.category !== undefined ? input.category : existing.category,
    author: input.author !== undefined ? input.author.trim() : existing.author,
    status: input.status !== undefined ? input.status : existing.status,
    imageUrl:
      input.imageUrl !== undefined && input.imageUrl.trim() !== ''
        ? input.imageUrl.trim()
        : existing.imageUrl,
    excerpt:
      input.excerpt !== undefined
        ? input.excerpt.trim()
        : input.content !== undefined
        ? input.content.trim().slice(0, 140) + (input.content.length > 140 ? '...' : '')
        : existing.excerpt,
    content: input.content !== undefined ? input.content.trim() : existing.content,
    updatedAt: now.toISOString(),
  };

  posts[index] = updated;
  savePostsToStorage(posts);
  return Promise.resolve(updated);
}

/**
 * Delete a post by ID.
 */
export async function deletePost(id: string): Promise<boolean> {
  // TODO: Replace with fetch(`/api/posts/${id}`, { method: 'DELETE' }) when backend endpoint is available.
  const posts = loadPostsFromStorage();
  const filtered = posts.filter((p) => String(p.id) !== String(id));

  if (filtered.length === posts.length) {
    return Promise.resolve(false);
  }

  savePostsToStorage(filtered);
  return Promise.resolve(true);
}

/**
 * Reset posts data to the initial 6 mock posts.
 */
export function resetMockPosts(): Post[] {
  savePostsToStorage(INITIAL_MOCK_POSTS);
  return [...INITIAL_MOCK_POSTS];
}
