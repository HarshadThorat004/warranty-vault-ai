"use client";

import { UploadButton } from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

type Props = {
  onChange: (url: string) => void;
};

export default function UploadInvoice({
  onChange,
}: Props) {
  return (
    <UploadButton<OurFileRouter, "imageUploader">
      endpoint="imageUploader"
      onClientUploadComplete={(res) => {
        if (res && res[0]) {
          onChange(res[0].ufsUrl);
        }
      }}
      onUploadError={(error) => {
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}