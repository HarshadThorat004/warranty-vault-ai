import { createUploadthing } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    console.log("UPLOAD COMPLETE");

    console.log(file.url);

    return {
      url: file.url,
    };
  }),
};

export type OurFileRouter =
  typeof ourFileRouter;