"use client";

import { useRef, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import { FileImage, FileText, Loader2, Upload } from "lucide-react";

type Props = {
  onChange: (url: string, fileType?: string, file?: File) => void;
  label: string;
  description?: string;
  size?: "md" | "lg";
  capture?: boolean;
};

export default function UploadButtonComponent({
  onChange,
  label,
  description = "Image or PDF up to 8MB",
  size = "md",
  capture = false,
}: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const pendingFile = useRef<File | null>(null);

  const { startUpload } = useUploadThing("documentUploader", {
    onClientUploadComplete: (res) => {
      const file = pendingFile.current;
      pendingFile.current = null;
      setIsUploading(false);
      if (res?.[0]?.ufsUrl) {
        onChange(res[0].ufsUrl, res[0].type || undefined, file ?? undefined);
      }
    },
    onUploadError: (error) => {
      pendingFile.current = null;
      setIsUploading(false);
      toast.error(error.message || "Upload failed");
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      toast.error("Please upload an image or PDF file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File must be 8MB or smaller");
      return;
    }

    pendingFile.current = file;
    setIsUploading(true);
    await startUpload([file]);
  }

  const isLarge = size === "lg";

  return (
    <label
      className={`group relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-black/40 text-center transition hover:border-cyan-400/50 hover:bg-cyan-500/5 ${
        isLarge ? "min-h-[160px] px-4 py-8" : "min-h-[120px] px-3 py-5"
      } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
    >
      <input
        type="file"
        accept={capture ? "image/*" : "image/*,application/pdf"}
        capture={capture ? "environment" : undefined}
        className="sr-only"
        disabled={isUploading}
        onChange={handleFileChange}
      />

      <div
        className={`flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-300 transition group-hover:border-cyan-400/30 ${
          isLarge ? "h-12 w-12" : "h-10 w-10"
        }`}
      >
        {isUploading ? (
          <Loader2 size={isLarge ? 22 : 18} className="animate-spin" />
        ) : (
          <Upload size={isLarge ? 22 : 18} />
        )}
      </div>

      <div>
        <p
          className={`font-semibold text-white ${
            isLarge ? "text-base" : "text-sm"
          }`}
        >
          {isUploading ? "Uploading…" : label}
        </p>
        <p className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
          <FileImage size={12} />
          <FileText size={12} />
          {description}
        </p>
      </div>
    </label>
  );
}
