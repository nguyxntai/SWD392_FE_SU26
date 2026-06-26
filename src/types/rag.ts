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

export interface VisionChatRequest {
  productId?: string;
  barcode?: string;
  imageUrl: string;
  question: string;
  context?: {
    note?: string;
    [key: string]: any;
  };
}

export interface VisionChatResponse {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  summary: string;
  observations: string[];
  possibleCauses: string[];
  recommendedActions: string[];
  followUpQuestions: string[];
  relatedProduct?: any;
  disclaimer: string;
}
