import axiosClient from "./axiosClient";
import { RagChatRequest, RagChatResponse, RagDocument, RagReindexResponse } from "@/types/rag";

export const chatWithAi = async (request: RagChatRequest): Promise<RagChatResponse> => {
  const response = await axiosClient.post("/api/rag/chat", request);
  return response.data.result;
};

export const reindexData = async (): Promise<RagReindexResponse> => {
  const response = await axiosClient.post("/api/rag/reindex");
  return response.data.result;
};

export const getIndexedDocuments = async (): Promise<RagDocument[]> => {
  const response = await axiosClient.get("/api/rag/documents");
  return response.data.result;
};
