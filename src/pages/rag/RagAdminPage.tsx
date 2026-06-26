import { useState, useEffect } from "react";
import { Database, RefreshCw, Server, Search, FileText } from "lucide-react";
import { reindexData, getIndexedDocuments } from "@/services/ragService";
import { RagDocument } from "@/types/rag";
import { getApiErrorMessage } from "@/services/apiError";
import { toast } from "sonner";

import { Navigation } from "@/components/Navigation";

export function RagAdminPage() {
  const [isReindexing, setIsReindexing] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [search, setSearch] = useState("");

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await getIndexedDocuments();
      setDocuments(docs || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load indexed documents"));
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const result = await reindexData();
      toast.success(`Đã cập nhật ${result.documentCount} tài liệu cho AI.`);
      loadDocuments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reindex data"));
    } finally {
      setIsReindexing(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title?.toLowerCase().includes(search.toLowerCase()) || 
    doc.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="text-primary" />
            RAG Data Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the knowledge base for the AI Assistant.
          </p>
        </div>
        <button
          onClick={handleReindex}
          disabled={isReindexing}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <Server size={18} className={isReindexing ? "animate-pulse" : ""} />
          {isReindexing ? "Đang cập nhật..." : "Cập nhật dữ liệu AI"}
        </button>
      </div>

      <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <FileText size={18} className="text-primary" />
            <span>Indexed Documents ({documents.length})</span>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <button
              onClick={loadDocuments}
              disabled={isLoadingDocs}
              className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} className={isLoadingDocs ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/5 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Preview</th>
                <th className="px-6 py-4 font-medium text-right">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingDocs ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="animate-spin mx-auto mb-2 text-primary" size={24} />
                    Loading documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No documents found. Click 'Cập nhật dữ liệu AI' to index data.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.documentId} className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground max-w-[200px] truncate" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell max-w-[300px]">
                      <p className="text-muted-foreground truncate" title={doc.content}>
                        {doc.content}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="group relative inline-block text-left">
                        <button className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground hover:text-foreground border border-border">
                          {Object.keys(doc.metadata || {}).length} keys
                        </button>
                        <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-popover border border-border rounded-xl shadow-xl text-xs font-mono text-popover-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 whitespace-pre-wrap break-all">
                          {JSON.stringify(doc.metadata, null, 2)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
