export type MockUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
};

export type MockItemType = {
  id: string;
  name: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  isSystem: boolean;
  itemCount: number;
};

export type MockItem = {
  id: string;
  title: string;
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  description: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  itemTypeId: string;
  tags: string[];
  collectionIds: string[];
};

export type MockCollection = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  defaultTypeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
};

export const mockUser: MockUser = {
  id: "user_1",
  name: "John Doe",
  email: "demo@devstash.io",
  image: null,
  isPro: true
};

export const mockItemTypes: MockItemType[] = [
  {
    id: "type_snippet",
    name: "snippet",
    slug: "snippets",
    label: "Snippets",
    icon: "Code",
    color: "#3b82f6",
    isSystem: true,
    itemCount: 24
  },
  {
    id: "type_prompt",
    name: "prompt",
    slug: "prompts",
    label: "Prompts",
    icon: "Sparkles",
    color: "#8b5cf6",
    isSystem: true,
    itemCount: 18
  },
  {
    id: "type_command",
    name: "command",
    slug: "commands",
    label: "Commands",
    icon: "Terminal",
    color: "#f97316",
    isSystem: true,
    itemCount: 15
  },
  {
    id: "type_note",
    name: "note",
    slug: "notes",
    label: "Notes",
    icon: "StickyNote",
    color: "#fde047",
    isSystem: true,
    itemCount: 12
  },
  {
    id: "type_file",
    name: "file",
    slug: "files",
    label: "Files",
    icon: "File",
    color: "#6b7280",
    isSystem: true,
    itemCount: 5
  },
  {
    id: "type_image",
    name: "image",
    slug: "images",
    label: "Images",
    icon: "Image",
    color: "#ec4899",
    isSystem: true,
    itemCount: 3
  },
  {
    id: "type_link",
    name: "link",
    slug: "links",
    label: "Links",
    icon: "Link",
    color: "#10b981",
    isSystem: true,
    itemCount: 8
  }
];

export const mockCollections: MockCollection[] = [
  {
    id: "col_react_patterns",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    defaultTypeId: "type_snippet",
    createdAt: new Date("2026-01-05"),
    updatedAt: new Date("2026-04-20"),
    itemCount: 12
  },
  {
    id: "col_python_snippets",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    defaultTypeId: "type_snippet",
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-04-18"),
    itemCount: 8
  },
  {
    id: "col_context_files",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    defaultTypeId: "type_file",
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-04-15"),
    itemCount: 5
  },
  {
    id: "col_interview_prep",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    defaultTypeId: "type_note",
    createdAt: new Date("2026-02-12"),
    updatedAt: new Date("2026-04-10"),
    itemCount: 24
  },
  {
    id: "col_git_commands",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    defaultTypeId: "type_command",
    createdAt: new Date("2026-02-20"),
    updatedAt: new Date("2026-04-22"),
    itemCount: 15
  },
  {
    id: "col_ai_prompts",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    defaultTypeId: "type_prompt",
    createdAt: new Date("2026-03-01"),
    updatedAt: new Date("2026-04-25"),
    itemCount: 18
  }
];

export const mockItems: MockItem[] = [
  {
    id: "item_useauth_hook",
    title: "useAuth Hook",
    contentType: "TEXT",
    content:
      "import { useContext } from 'react';\nimport { AuthContext } from './AuthContext';\n\nexport function useAuth() {\n  const context = useContext(AuthContext);\n  if (!context) throw new Error('useAuth must be used within AuthProvider');\n  return context;\n}",
    url: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    description: "Custom authentication hook for React applications",
    language: "typescript",
    isFavorite: true,
    isPinned: true,
    lastUsedAt: new Date("2026-04-20"),
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
    itemTypeId: "type_snippet",
    tags: ["react", "auth", "hooks"],
    collectionIds: ["col_react_patterns"]
  },
  {
    id: "item_api_error_handling",
    title: "API Error Handling Pattern",
    contentType: "TEXT",
    content:
      "async function fetchWithRetry(url, options = {}, retries = 3) {\n  for (let i = 0; i < retries; i++) {\n    try {\n      const res = await fetch(url, options);\n      if (!res.ok) throw new Error(`HTTP ${res.status}`);\n      return res.json();\n    } catch (err) {\n      if (i === retries - 1) throw err;\n      await new Promise(r => setTimeout(r, 2 ** i * 1000));\n    }\n  }\n}",
    url: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    description: "Fetch wrapper with exponential backoff retry logic",
    language: "javascript",
    isFavorite: false,
    isPinned: true,
    lastUsedAt: new Date("2026-04-18"),
    createdAt: new Date("2026-01-12"),
    updatedAt: new Date("2026-01-12"),
    itemTypeId: "type_snippet",
    tags: ["api", "error-handling", "fetch"],
    collectionIds: ["col_react_patterns"]
  },
  {
    id: "item_git_undo_commit",
    title: "Undo last commit (keep changes)",
    contentType: "TEXT",
    content: "git reset --soft HEAD~1",
    url: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    description: "Reverts the last commit but keeps the changes staged",
    language: "bash",
    isFavorite: true,
    isPinned: false,
    lastUsedAt: new Date("2026-04-22"),
    createdAt: new Date("2026-02-20"),
    updatedAt: new Date("2026-02-20"),
    itemTypeId: "type_command",
    tags: ["git", "commit"],
    collectionIds: ["col_git_commands"]
  },
  {
    id: "item_code_review_prompt",
    title: "Code Review Prompt",
    contentType: "TEXT",
    content:
      "Review the following code for:\n1. Security vulnerabilities\n2. Performance issues\n3. Code quality and readability\n4. Edge cases\n\nProvide specific, actionable feedback with code examples.",
    url: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    description: "Comprehensive code review prompt for AI assistants",
    language: null,
    isFavorite: false,
    isPinned: false,
    lastUsedAt: new Date("2026-04-19"),
    createdAt: new Date("2026-03-05"),
    updatedAt: new Date("2026-03-05"),
    itemTypeId: "type_prompt",
    tags: ["code-review", "ai"],
    collectionIds: ["col_ai_prompts"]
  },
  {
    id: "item_python_decorator",
    title: "Timing Decorator",
    contentType: "TEXT",
    content:
      "import time\nfrom functools import wraps\n\ndef timer(func):\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        result = func(*args, **kwargs)\n        print(f'{func.__name__} took {time.perf_counter() - start:.4f}s')\n        return result\n    return wrapper",
    url: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    description: "Decorator to measure function execution time",
    language: "python",
    isFavorite: false,
    isPinned: false,
    lastUsedAt: new Date("2026-04-10"),
    createdAt: new Date("2026-02-15"),
    updatedAt: new Date("2026-02-15"),
    itemTypeId: "type_snippet",
    tags: ["python", "decorator", "performance"],
    collectionIds: ["col_python_snippets"]
  },
  {
    id: "item_nextjs_docs_link",
    title: "Next.js App Router Docs",
    contentType: "URL",
    content: null,
    url: "https://nextjs.org/docs/app",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    description: "Official Next.js App Router documentation",
    language: null,
    isFavorite: true,
    isPinned: false,
    lastUsedAt: new Date("2026-04-23"),
    createdAt: new Date("2026-03-15"),
    updatedAt: new Date("2026-03-15"),
    itemTypeId: "type_link",
    tags: ["nextjs", "docs"],
    collectionIds: ["col_react_patterns"]
  },
  {
    id: "item_system_design_notes",
    title: "System Design Fundamentals",
    contentType: "TEXT",
    content:
      "# System Design Cheat Sheet\n\n- Load balancing: round-robin, least-connections\n- Caching: Redis, CDN, browser\n- Databases: SQL vs NoSQL tradeoffs\n- Sharding strategies\n- CAP theorem",
    url: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    description: "Quick reference for system design interviews",
    language: null,
    isFavorite: false,
    isPinned: false,
    lastUsedAt: new Date("2026-04-08"),
    createdAt: new Date("2026-02-12"),
    updatedAt: new Date("2026-02-12"),
    itemTypeId: "type_note",
    tags: ["system-design", "interview"],
    collectionIds: ["col_interview_prep"]
  },
  {
    id: "item_project_context_file",
    title: "Project Architecture Context",
    contentType: "FILE",
    content: null,
    url: null,
    fileUrl: "https://example.r2.dev/project-architecture.md",
    fileName: "project-architecture.md",
    fileSize: 4821,
    description: "Architecture overview file for AI assistant context",
    language: null,
    isFavorite: false,
    isPinned: false,
    lastUsedAt: new Date("2026-04-15"),
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
    itemTypeId: "type_file",
    tags: ["architecture", "context"],
    collectionIds: ["col_context_files"]
  }
];
