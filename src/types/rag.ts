export interface RagChatRequest {
  message: string;
  topK?: number;
}

export interface RagCitation {
  documentId: string;
  type: string;
  title: string;
  contentSnippet: string;
  relevanceScore: number;
}

export interface RagChatResponse {
  answer: string;
  citations: RagCitation[];
}

export interface RagDocument {
  documentId: string;
  type: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
}

export interface RagReindexResponse {
  documentCount: number;
}
