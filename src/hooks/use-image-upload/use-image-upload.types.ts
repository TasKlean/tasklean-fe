import type { ImageType, UploadPurpose } from "@/lib/uploads/uploads.types";

export type ImageUploadOptions = {
  purpose: UploadPurpose;
  // What the image will belong to. The backend checks the caller against it
  // before signing anything, so a wrong one is a 403 rather than a bad upload.
  targetUid: string;
};

// What will actually be sent, which is never the file that was picked: every
// one is re-encoded, and only then can it be measured.
export type StagedImage = {
  blob: Blob;
  type: ImageType;
  // An object URL, alive until the picture is replaced or the hook unmounts.
  preview: string;
};

export type ImageUploadState = {
  staged: StagedImage | null;
  busy: boolean;
  failure: string | null;
};

export type ImageUpload = {
  preview: string | null;
  staged: boolean;
  busy: boolean;
  failure: string | null;
  stage: (file: Blob) => Promise<void>;
  clear: () => void;
  upload: () => Promise<string | null>;
};
