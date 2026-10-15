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
  image_file?: string;
  width?: number;
  height?: number;
}

export type ContentBlock = TextBlock | ChecklistBlock | AlertBlock | ImageBlock;

export interface Topic {
  topic_id: string;
  topic_title: string;
  content_blocks: ContentBlock[];
}

export interface SourceValidation {
  status: 'validada' | 'pendente';
  validated_at?: string;
  validated_by?: string;
}

export interface SourceItem {
  id?: string;
  short_label?: string;
  type: 'video' | 'book' | 'article' | string;
  title: string;
  institution?: string;
  author?: string;
  authors?: string;
  edition?: string;
  year?: number;
  chapter?: string;
  chapters?: string[];
  sections?: string[];
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  source?: string;
  url?: string;
  accessed_at?: string;
  relevant_timestamp?: string;
  video_start?: string;
  video_end?: string;
  note?: string;
  validation?: SourceValidation;
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

export interface BlockMeta {
  source_ids?: string[];
  status?: 'em_validacao';
}

export type AssuntoBloco = ContentBlock & BlockMeta;

export interface AssuntoTopico {
  topic_id: string;
  topic_title: string;
  content_blocks: AssuntoBloco[];
}

export type AssuntoQuestao = QuizQuestion & {
  source_ids?: string[];
};

export interface ItemFichaRef {
  block: 'gerais' | 'atividades';
  number: number;
}

export interface CompetenciaAssunto {
  status?: 'em_validacao';
  technician: string[];
  nurse: string[];
  source_ids: string[];
}

export interface PromptEstudo {
  id: string;
  title: string;
  text: string;
  accepts_question: boolean;
}

export type SituacaoRevisao = 'rascunho' | 'revisado' | 'publicado';

export interface RevisaoAssunto {
  status: SituacaoRevisao;
  version: number;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  next_review: string | null;
}

export interface AssuntoEstudo {
  format: 'assunto-estudo-v1';
  slug: string;
  title: string;
  short_description: string;
  assessment_items: ItemFichaRef[];
  learning_objectives: string[];
  competence: CompetenciaAssunto;
  topics: AssuntoTopico[];
  quiz: AssuntoQuestao[];
  study_prompts: PromptEstudo[];
  sources: SourceItem[];
  review: RevisaoAssunto;
}

export interface AssuntoIndiceItem {
  slug: string;
  dataFile: string;
}

