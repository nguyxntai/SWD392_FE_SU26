import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { analyzeVision } from "@/services/ragService";
import { VisionChatRequest, VisionChatResponse } from "@/types/rag";
import { getApiErrorMessage } from "@/services/apiError";
import { uploadProductImage } from "@/services/cloudinaryService";
import { toast } from "sonner";
import { 
  Camera, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  Loader2,
  Image as ImageIcon
} from "lucide-react";

export function VisionCheckPage() {
  const [barcode, setBarcode] = useState("");
  const [question, setQuestion] = useState("Kiểm tra sản phẩm này có bất thường không?");
  const [note, setNote] = useState("");
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [inputType, setInputType] = useState<"file" | "url">("file");
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VisionChatResponse | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh");
      return;
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreviewUrl("");
  };

  const handleAnalyze = async () => {
    let finalImageUrl = imageUrlInput;

    if (inputType === "file") {
      if (!imageFile) {
        toast.error("Vui lòng chọn hình ảnh để phân tích");
        return;
      }
      setIsLoading(true);
      try {
        finalImageUrl = await uploadProductImage(imageFile);
      } catch (error) {
        setIsLoading(false);
        toast.error("Lỗi upload ảnh lên Cloudinary");
        return;
      }
    } else {
      if (!finalImageUrl.trim()) {
        toast.error("Vui lòng nhập URL hình ảnh");
        return;
      }
    }

    if (!question.trim()) {
      toast.error("Vui lòng nhập câu hỏi cho AI");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const payload: VisionChatRequest = {
        imageUrl: finalImageUrl,
        question: question.trim(),
      };

      if (barcode.trim()) {
        payload.barcode = barcode.trim();
      }

      if (note.trim()) {
        payload.context = { note: note.trim() };
      }

      const aiResponse = await analyzeVision(payload);
      setResult(aiResponse);
      toast.success("Phân tích hoàn tất");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Phân tích thất bại"));
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW": return "text-green-600 bg-green-100 border-green-200";
      case "MEDIUM": return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "HIGH": return "text-red-600 bg-red-100 border-red-200";
      default: return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "LOW": return <CheckCircle size={24} className="text-green-600" />;
      case "MEDIUM": return <AlertTriangle size={24} className="text-yellow-600" />;
      case "HIGH": return <XCircle size={24} className="text-red-600" />;
      default: return <Info size={24} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Camera className="w-8 h-8" />
            AI Vision Product Check
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload product images and let AI detect abnormalities, defects, or verify authenticity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Cột Trái */}
          <div className="lg:col-span-5 space-y-6 bg-background p-6 rounded-2xl shadow-sm border border-border h-fit">
            
            <div className="space-y-3">
              <label className="text-sm font-semibold">Image Source</label>
              <div className="flex bg-muted/50 p-1 rounded-xl">
                <button
                  onClick={() => setInputType("file")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    inputType === "file" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setInputType("url")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    inputType === "url" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Image URL
                </button>
              </div>

              {inputType === "file" ? (
                <div className="mt-4">
                  {imagePreviewUrl ? (
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-border group">
                      <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={removeImage}
                          className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or WEBP</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageFileChange} />
                    </label>
                  )}
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  {imageUrlInput && (
                    <div className="w-full aspect-square rounded-xl overflow-hidden border border-border">
                      <img src={imageUrlInput} alt="URL Preview" className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Invalid+URL&size=500&background=f1f5f9`;
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Barcode (Optional)</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode"
                className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What do you want to ask about this image?"
                className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Additional Note (Context)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="E.g., Customer reported a strange smell"
                className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                rows={2}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isLoading || (inputType === 'file' ? !imageFile : !imageUrlInput)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-bold shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <ImageIcon size={20} />
                  Analyze Image
                </>
              )}
            </button>
          </div>

          {/* Kết quả Cột Phải */}
          <div className="lg:col-span-7">
            {isLoading ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-background rounded-2xl border border-border border-dashed text-muted-foreground animate-pulse">
                <Loader2 size={40} className="animate-spin mb-4 text-primary" />
                <p className="font-medium">AI is inspecting the product...</p>
                <p className="text-sm mt-2 max-w-sm text-center">This might take a few seconds depending on the image size and complexity.</p>
              </div>
            ) : result ? (
              <div className="space-y-6 animate-fade-in">
                {/* Header Risk */}
                <div className={`p-6 rounded-2xl border flex items-start gap-4 ${getRiskColor(result.riskLevel)}`}>
                  <div className="mt-1 bg-white/50 p-2 rounded-full">
                    {getRiskIcon(result.riskLevel)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-wide">
                      Risk Level: {result.riskLevel}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed opacity-90 font-medium">
                      {result.summary}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
                  <div className="p-6 space-y-6">
                    
                    {result.observations && result.observations.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Observations
                        </h3>
                        <ul className="list-disc list-inside space-y-2 pl-4 text-foreground">
                          {result.observations.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.possibleCauses && result.possibleCauses.length > 0 && (
                      <div className="pt-6 border-t border-border/50">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Possible Causes
                        </h3>
                        <ul className="list-disc list-inside space-y-2 pl-4 text-foreground">
                          {result.possibleCauses.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.recommendedActions && result.recommendedActions.length > 0 && (
                      <div className="pt-6 border-t border-border/50">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Recommended Actions
                        </h3>
                        <ul className="space-y-2">
                          {result.recommendedActions.map((item, idx) => (
                            <li key={idx} className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border">
                              <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.followUpQuestions && result.followUpQuestions.length > 0 && (
                      <div className="pt-6 border-t border-border/50">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          Follow-up Questions
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {result.followUpQuestions.map((item, idx) => (
                            <span key={idx} className="bg-primary/5 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-sm font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                  
                  {result.disclaimer && (
                    <div className="bg-muted/50 p-4 border-t border-border text-xs text-muted-foreground text-center italic">
                      {result.disclaimer}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-background rounded-2xl border border-border border-dashed text-muted-foreground">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Camera size={32} className="opacity-50" />
                </div>
                <p className="font-medium text-lg">No Analysis Yet</p>
                <p className="text-sm mt-1">Upload an image and click analyze to see results.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
