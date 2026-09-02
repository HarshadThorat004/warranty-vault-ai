"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

import UploadButtonComponent from "@/components/upload-button";
import { useUploadThing } from "@/lib/uploadthing";

type Props = {
  label: string;
  description?: string;
  size?: "md" | "lg";
  onUploaded: (url: string, fileType?: string, file?: File) => void;
};

export default function DocumentCapture({
  label,
  description,
  size = "lg",
  onUploaded,
}: Props) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingFile = useRef<File | null>(null);

  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onClientUploadComplete: (res) => {
      const file = pendingFile.current;
      pendingFile.current = null;
      setCapturing(false);
      if (res?.[0]?.ufsUrl) {
        onUploaded(res[0].ufsUrl, res[0].type || undefined, file ?? undefined);
      }
    },
    onUploadError: (error) => {
      pendingFile.current = null;
      setCapturing(false);
      toast.error(error.message || "Upload failed");
    },
  });

  useEffect(() => {
    if (!cameraOpen) return;

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        toast.error("Camera access was blocked. Use upload instead.");
        setCameraOpen(false);
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      setCameraReady(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOpen]);

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || !cameraReady || capturing || isUploading) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) {
      toast.error("Could not capture photo");
      return;
    }

    const file = new File([blob], `scan-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photo is too large — try again closer to the document");
      return;
    }

    setCapturing(true);
    pendingFile.current = file;
    setCameraOpen(false);
    await startUpload([file]);
  }

  return (
    <div className="space-y-3">
      <UploadButtonComponent
        size={size}
        label={label}
        description={description}
        onChange={onUploaded}
      />

      <button
        type="button"
        onClick={() => setCameraOpen(true)}
        disabled={isUploading || capturing}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Camera size={16} />
        {capturing || isUploading ? "Uploading photo…" : "Take photo"}
      </button>

      {cameraOpen && (
        <div
          className="fixed inset-0 z-[110] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Scan with camera"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium text-white">Scan document</p>
            <button
              type="button"
              onClick={() => setCameraOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white"
              aria-label="Close camera"
            >
              <X size={18} />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center p-4">
            <video
              ref={videoRef}
              playsInline
              muted
              className="max-h-full max-w-full rounded-xl object-contain"
            />
          </div>
          <div className="border-t border-white/10 px-4 py-4">
            <button
              type="button"
              onClick={() => void captureFrame()}
              disabled={!cameraReady}
              className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black disabled:opacity-50"
            >
              {cameraReady ? "Capture" : "Starting camera…"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
