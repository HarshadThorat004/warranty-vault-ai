"use client";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import { FileImage, Loader2, Upload } from "lucide-react";

type Props = {
  onChange: (url: string) => void;
  label: string;
  description?: string;
  size?: "md" | "lg";
};

export default function UploadButtonComponent({
  onChange,
  label,
  description = "Image up to 8MB",
  size = "md",
}: Props) {
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      if (res?.[0]?.ufsUrl) {
        onChange(res[0].ufsUrl);
      }
    },
    onUploadError: (error) => {
      setIsUploading(false);
      toast.error(error.message || "Upload failed");
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be 8MB or smaller");
      return;
    }

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
        accept="image/*"
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
          {description}
        </p>
      </div>
    </label>
  );
}
