import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  MinLength,
  Min,
  IsEnum,
  IsIn,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ICreateFolderInput,
  IUpdateFolderInput,
  IMoveFolderInput,
  ICloneFolderInput,
  IUploadFileMetadata,
  ICreateFileInput,
  IUpdateFileInput,
  IMoveFileInput,
  ICloneFileInput,
  IFolderQueryParams,
  IFileQueryParams,
  FolderSortField,
  FileSortField,
} from "@monorepo/shared";
import { SortOrder } from "@monorepo/shared";

export class CreateFolderDto implements ICreateFolderInput {
  @ApiProperty({ example: "My Documents", description: "Folder name" })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    example: "Work documents and files",
    description: "Folder description",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Parent folder ID (null for root)",
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Is folder public",
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: "Display order",
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : value))
  @IsNumber()
  @Min(0)
  order?: number;
}

export class UpdateFolderDto implements IUpdateFolderInput {
  @ApiPropertyOptional({ example: "Updated Folder Name" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: "Updated description" })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Parent folder ID",
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : value))
  @IsNumber()
  @Min(0)
  order?: number;
}

export class MoveFolderDto implements IMoveFolderInput {
  @ApiProperty({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Target parent folder ID (null for root)",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentId: string | null;
}

export class CloneFolderDto implements ICloneFolderInput {
  @ApiPropertyOptional({
    example: "My Documents (Copy)",
    description: "Custom name for cloned folder",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  newName?: string;

  @ApiPropertyOptional({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Where to clone (same parent if not specified)",
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({
    example: true,
    description: "Clone files inside folder",
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  includeFiles?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: "Clone subfolders recursively",
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  includeSubfolders?: boolean;
}

export class FolderQueryDto implements IFolderQueryParams {
  @ApiPropertyOptional({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Filter by parent folder ID",
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({
    example: false,
    description: "Filter by public status",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: "name",
    enum: ["name", "createdAt", "updatedAt", "order"],
    description: "Sort by field",
  })
  @IsOptional()
  @IsIn(["name", "createdAt", "updatedAt", "order"])
  sortBy?: FolderSortField;

  @ApiPropertyOptional({
    example: "asc",
    enum: ["asc", "desc"],
    description: "Sort order",
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: SortOrder;

  @ApiPropertyOptional({ example: "document", description: "Search query" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "document",
    description: "Search query (alias)",
  })
  @IsOptional()
  @IsString()
  query?: string;
}

export class UploadFileMetadataDto implements IUploadFileMetadata {
  @ApiPropertyOptional({
    example: "report.pdf",
    description: "Custom file name",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: "Q4 financial report",
    description: "File description",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Folder ID to upload to",
  })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Is file public",
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;

    return value;
  })
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: "Display order",
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : value))
  @IsNumber()
  @Min(0)
  order?: number;
}

export class UpdateFileDto implements IUpdateFileInput {
  @ApiPropertyOptional({ example: "updated-file.pdf" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: "Updated file description" })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Folder ID",
  })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : value))
  @IsNumber()
  @Min(0)
  order?: number;
}

export class MoveFileDto implements IMoveFileInput {
  @ApiProperty({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Target folder ID (null for root)",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  folderId: string | null;
}

export class CloneFileDto implements ICloneFileInput {
  @ApiPropertyOptional({
    example: "document (Copy).pdf",
    description: "Custom name for cloned file",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  newName?: string;

  @ApiPropertyOptional({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Where to clone (same folder if not specified)",
  })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;
}

export class FileQueryDto implements IFileQueryParams {
  @ApiPropertyOptional({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Filter by folder ID",
  })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @ApiPropertyOptional({
    example: false,
    description: "Filter by public status",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: "application/pdf",
    description: "Filter by MIME type",
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: "pdf", description: "Filter by extension" })
  @IsOptional()
  @IsString()
  extension?: string;

  @ApiPropertyOptional({
    example: "name",
    enum: ["name", "originalName", "createdAt", "updatedAt", "size", "order"],
    description: "Sort by field",
  })
  @IsOptional()
  @IsIn(["name", "originalName", "createdAt", "updatedAt", "size", "order"])
  sortBy?: FileSortField;

  @ApiPropertyOptional({
    example: "asc",
    enum: ["asc", "desc"],
    description: "Sort order",
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: SortOrder;

  @ApiPropertyOptional({ example: "report", description: "Search query" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "report",
    description: "Search query (alias)",
  })
  @IsOptional()
  @IsString()
  query?: string;
}

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, description: "Page number", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: "Items per page",
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class UserLibraryQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Folders page number" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  foldersPage?: number;

  @ApiPropertyOptional({ example: 20, description: "Folders per page" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  foldersLimit?: number;

  @ApiPropertyOptional({ example: 1, description: "Files page number" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  filesPage?: number;

  @ApiPropertyOptional({ example: 20, description: "Files per page" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  filesLimit?: number;
}

export class SearchLibraryDto {
  @ApiProperty({ example: "document", description: "Search query" })
  @IsString()
  @MinLength(1)
  query: string;

  @ApiPropertyOptional({
    example: "all",
    enum: ["folder", "file", "all"],
    description: "Resource type to search",
    default: "all",
  })
  @IsOptional()
  @IsIn(["folder", "file", "all"])
  type?: "folder" | "file" | "all";

  @ApiPropertyOptional({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Search only in specific folder",
  })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Filter by public status",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 1, description: "Page number" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: "Items per page" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class FolderContentQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    example: "name",
    enum: ["name", "createdAt", "order"],
    description: "Sort by field",
  })
  @IsOptional()
  @IsIn(["name", "createdAt", "order"])
  sortBy?: "name" | "createdAt" | "order";

  @ApiPropertyOptional({
    example: "asc",
    enum: ["asc", "desc"],
    description: "Sort order",
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: SortOrder;
}
