import { BadRequestException } from "@nestjs/common";
import * as path from "path";

export const ALLOWED_FILE_EXTENSIONS = [
  // Images
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  // Documents
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  // Archives
  ".zip",
  ".rar",
  ".7z",
  // Videos
  ".mp4",
  ".avi",
  ".mov",
  ".mkv",
  // Audio
  ".mp3",
  ".wav",
  ".flac",
];

export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  // Videos
  "video/mp4",
  "video/x-msvideo",
  "video/quicktime",
  "video/x-matroska",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
];

// Validate file extension
export function validateFileExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.includes(ext);
}

// Validate MIME type
export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

// Validate file for upload
export function validateFile(file: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException("No file provided");
  }

  if (!validateFileExtension(file.originalname)) {
    throw new BadRequestException(
      `File extension not allowed. Allowed: ${ALLOWED_FILE_EXTENSIONS.join(
        ", "
      )}`
    );
  }

  if (!validateMimeType(file.mimetype)) {
    throw new BadRequestException(
      `File type not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Check file size (50MB max)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new BadRequestException(
      `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
    );
  }
}

// Generate public URL for file
export function generatePublicUrl(fileId: string, baseUrl?: string): string {
  const base = baseUrl || process.env.BASE_URL || "http://localhost:3000";
  return `${base}/api/public/files/${fileId}`;
}

// Generate public URL for folder
export function generateFolderPublicUrl(
  folderId: string,
  baseUrl?: string
): string {
  const base = baseUrl || process.env.BASE_URL || "http://localhost:3000";
  return `${base}/api/public/folders/${folderId}`;
}

// Format file size for display
export function formatFileSize(bytes: number | bigint): string {
  const size = typeof bytes === "bigint" ? Number(bytes) : bytes;

  if (size === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(size) / Math.log(k));

  return Math.round((size / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Get file icon based on extension
export function getFileIcon(extension: string): string {
  const ext = extension.toLowerCase().replace(".", "");

  const iconMap: Record<string, string> = {
    // Images
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    svg: "image",
    // Documents
    pdf: "pdf",
    doc: "word",
    docx: "word",
    xls: "excel",
    xlsx: "excel",
    ppt: "powerpoint",
    pptx: "powerpoint",
    txt: "text",
    csv: "csv",
    // Archives
    zip: "archive",
    rar: "archive",
    "7z": "archive",
    // Videos
    mp4: "video",
    avi: "video",
    mov: "video",
    mkv: "video",
    // Audio
    mp3: "audio",
    wav: "audio",
    flac: "audio",
  };

  return iconMap[ext] || "file";
}

// Sanitize folder/file name
export function sanitizeName(name: string): string {
  // Remove dangerous characters
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\.\./g, "")
    .trim();
}

// Generate unique filename
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitizedName = sanitizeName(nameWithoutExt);

  return `${timestamp}-${random}-${sanitizedName}${ext}`;
}

// Check if path is safe (no path traversal)
export function isSafePath(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  return !normalized.includes("..");
}

// Get MIME type category
export function getMimeTypeCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  )
    return "document";
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return "archive";
  return "other";
}
