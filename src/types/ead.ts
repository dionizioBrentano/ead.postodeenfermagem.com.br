// Contratos e tipos TypeScript para os módulos EAD e blocos de conteúdo da Sala EAD.

export type ContentBlockType = 'text' | 'checklist' | 'alert' | 'image';

export interface TextBlock {
  type: 'text';
  title?: string;
  body: string;
}

export interface ChecklistBlock {
  type: 'checklist';
  title?: string;
  items: string[];
}

export interface AlertBlock {
  type: 'alert';
  level: 'info' | 'warning';
  title: string;
  body: string;
}

export interface ImageBlock {
  type: 'image';
  caption?: string;
  image_prompt?: string;
  alt: string;
}

export type ContentBlock = TextBlock | ChecklistBlock | AlertBlock | ImageBlock;

export interface Topic {
  topic_id: string;
  topic_title: string;
  content_blocks: ContentBlock[];
}

export interface SourceItem {
  type: 'video' | 'book' | 'article' | string;
  title: string;
  institution?: string;
  author?: string;
  authors?: string;
  edition?: string;
  year?: number;
  chapter?: string;
  chapters?: string[];
  journal?: string;
  source?: string;
  url?: string;
  relevant_timestamp?: string;
  note?: string;
  [key: string]: unknown;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface EadModule {
  module_id: string;
  module_title: string;
  order?: number;
  badge?: string;
  learning_objectives: string[];
  topics: Topic[];
  sources: SourceItem[];
  quiz: QuizQuestion[];
}

export interface EadModuleMetadata {
  id: string;
  slug: string;
  number: number;
  title: string;
  short_description: string;
  dataFile: string;
  duration_minutes?: number;
  topics_count?: number;
}
