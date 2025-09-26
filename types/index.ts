export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export type RecipeType = "typescript" | "python";

export type RecipeCategory = "automation" | "agents";

export const CategorySubTags = {
  automation: ["web", "authentication", "utils"] as const,

  agents: ["testing", "deployment"] as const,
} as const;

export type SubTagsForCategory = {
  [K in RecipeCategory]: (typeof CategorySubTags)[K][number];
};

export type RecipeSubTag = SubTagsForCategory[RecipeCategory];

// Base metadata from front matter
export interface RecipeMetadata {
  id: string;
  title: string;
  description: string;
  date: string;
  categories: RecipeCategory[];
  tags: SubTagsForCategory[RecipeCategory][];
  dependencies?: Record<string, string>;
  external_url?: string;
}

// Code blocks extracted from markdown content
export interface RecipeFile {
  name: string;
  path: string;
  type: RecipeType;
  content: string;
  snippet?: string;
  preview?: any;
}

// Complete recipe with content and extracted files
export interface Recipe extends RecipeMetadata {
  content: string; // The full markdown content
  files: RecipeFile[]; // Extracted code blocks
}
