import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera, CameraOff } from "lucide-react";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

export default function BarcodeScanner({ isOpen, onClose, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null); // Store the controls object to stop scanning
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Throttle state
  const lastScannedBarcodeRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      if (videoRef.current) {
        setIsScanning(true);
        controlsRef.current = await readerRef.current.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: "environment", // Use back camera if available
            },
          },
          videoRef.current,
          (result, err) => {
            if (result) {
              const barcode = result.getText();
              handleDetected(barcode);
            }
            // Ignore normal errors like "No barcode found"
          }
        );
      }
    } catch (err: any) {
      setIsScanning(false);
      setError(err.message || "Failed to access camera");
      console.error("Scanner Error:", err);
    }
  };

  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
  };

  const handleDetected = (barcode: string) => {
    const now = Date.now();
    const isSameBarcode = lastScannedBarcodeRef.current === barcode;
    const isWithinThrottleTime = now - lastScannedTimeRef.current < 2000;

    if (isSameBarcode && isWithinThrottleTime) {
      return; // Ignore duplicate scans within 2 seconds
    }

    lastScannedBarcodeRef.current = barcode;
    lastScannedTimeRef.current = now;

    onDetected(barcode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Camera size={20} className="text-primary" />
              Barcode Scanner
            </h2>
            <p className="text-sm text-muted-foreground">Scan product barcode to add to cart.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-border flex items-center justify-center">
          {error ? (
            <div className="text-destructive p-4 text-center text-sm">
              <CameraOff size={32} className="mx-auto mb-2 opacity-50" />
              {error}
            </div>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          )}
          
          {/* Scanning overlay effect */}
          {isScanning && !error && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/80 shadow-[0_0_8px_2px_rgba(var(--primary),0.5)] transform -translate-y-1/2 animate-scan" />
              <div className="absolute inset-8 border-2 border-primary/30 rounded-lg" />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-3 font-bold hover:bg-muted transition-colors"
          >
            Close
          </button>
          {isScanning ? (
            <button
              type="button"
              onClick={stopScanner}
              className="flex-1 rounded-xl bg-destructive/10 px-4 py-3 font-bold text-destructive hover:bg-destructive/20 transition-colors"
            >
              Stop Scan
            </button>
          ) : (
            <button
              type="button"
              onClick={startScanner}
              className="flex-1 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Scan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
