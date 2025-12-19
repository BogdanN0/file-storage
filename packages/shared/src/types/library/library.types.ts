import {
  IApiResponse,
  IPaginatedResponse,
  ISortParams,
  ISearchParams,
  PermissionRole,
} from "../common/common.types";
import { IUserPublic } from "../user/user.types";
import {
  IFolderPermission,
  IFilePermission,
} from "../permission/permission.types";

// Base folder model
export interface IFolder {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isPublic: boolean;
  publicUrl: string | null;
  ownerId: string;
  parentId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Folder with owner information
export interface IFolderWithOwner extends IFolder {
  owner: IUserPublic;
}

// Folder with subfolders
export interface IFolderWithChildren extends IFolder {
  children: IFolder[];
}

// Folder with files
export interface IFolderWithFiles extends IFolder {
  files: IFile[];
}

// Folder with full relations
export interface IFolderWithRelations extends IFolder {
  owner: IUserPublic;
  parent: IFolder | null;
  children: IFolder[];
  files: IFile[];
  permissions: IFolderPermission[];
}

// Folder tree item
export interface IFolderTree extends IFolder {
  children: IFolderTree[];
  filesCount?: number;
}

// Base file model
export interface IFile {
  id: string;
  name: string;
  originalName: string;
  description: string | null;
  ownerId: string;
  folderId: string | null;
  filePath: string;
  mimeType: string;
  size: bigint | number | string;
  extension: string;
  isPublic: boolean;
  publicUrl: string | null;
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// File with owner info
export interface IFileWithOwner extends IFile {
  owner: IUserPublic;
}

// File with folder info
export interface IFileWithFolder extends IFile {
  folder: IFolder | null;
}

// File with full relations (owner, folder, permissions)
export interface IFileWithRelations extends IFile {
  owner: IUserPublic;
  folder: IFolder | null;
  permissions: IFilePermission[];
}

// Public file information (public access)
export interface IFilePublic {
  id: string;
  name: string;
  originalName: string;
  description: string | null;
  mimeType: string;
  size: bigint | number | string;
  extension: string;
  publicUrl: string;
  createdAt: Date | string;
}

// Create folder body
export interface ICreateFolderInput {
  name: string;
  description?: string;
  parentId?: string;
  isPublic?: boolean;
  order?: number;
}

// Update folder body
export interface IUpdateFolderInput {
  name?: string;
  description?: string | null;
  parentId?: string | null;
  isPublic?: boolean;
  order?: number;
}

// Move folder data
export interface IMoveFolderInput {
  parentId: string | null; // null means move to root
}

// Metadata for file upload
export interface IUploadFileMetadata {
  name?: string;
  description?: string;
  folderId?: string;
  isPublic?: boolean;
  order?: number;
}

// Create file body
export interface ICreateFileInput {
  name: string;
  originalName: string;
  description?: string;
  folderId?: string;
  filePath: string;
  mimeType: string;
  size: number | bigint;
  extension: string;
  isPublic?: boolean;
  order?: number;
}

// Update file body
export interface IUpdateFileInput {
  name?: string;
  description?: string | null;
  folderId?: string | null;
  isPublic?: boolean;
  order?: number;
}

// Move file data
export interface IMoveFileInput {
  folderId: string | null; // null means move to root
}

// Clone folder Dto
export interface ICloneFolderInput {
  newName?: string;
  parentId?: string | null;
  includeFiles?: boolean;
  includeSubfolders?: boolean;
}

// Clone file Dto
export interface ICloneFileInput {
  newName?: string;
  folderId?: string | null;
}

// Folder query parameters
export interface IFolderQueryParams
  extends ISortParams<FolderSortField>,
    ISearchParams {
  parentId?: string | null;
  isPublic?: boolean;
}

// File query parameters
export interface IFileQueryParams
  extends ISortParams<FileSortField>,
    ISearchParams {
  folderId?: string | null;
  isPublic?: boolean;
  mimeType?: string;
  extension?: string;
}

// Folder sort
export type FolderSortField = "name" | "createdAt" | "updatedAt" | "order";

// File sort
export type FileSortField =
  | "name"
  | "originalName"
  | "createdAt"
  | "updatedAt"
  | "size"
  | "order";

// Folder response
export interface IFolderResponse extends IFolder {}

// File response
export interface IFileResponse extends IFile {}

// Folder with relations response
export interface IFolderWithRelationsResponse extends IFolderWithRelations {}

// File with relations response
export interface IFileWithRelationsResponse extends IFileWithRelations {}

// Folder tree response
export interface IFolderTreeResponse {
  tree: IFolderTree[];
}

// File upload response
export interface IFileUploadResponse {
  file: IFile;
  uploadedAt: Date | string;
}

//Folder content response (with breadcrumbs and pagination)
export interface IFolderContentResponse {
  folder: IFolderWithUserRole;
  breadcrumbs: IFolderBreadcrumb[];
  path: string;
  subfolders: IFolderWithUserRole[];
  files: IFileWithUserRole[];
  pagination?: {
    totalSubfolders: number;
    totalFiles: number;
  };
}

// Folder clone response
export interface ICloneFolderResponse {
  clonedFolder: IFolder;
  clonedFilesCount: number;
  clonedSubfoldersCount: number;
}

// File clone response
export interface ICloneFileResponse {
  clonedFile: IFile;
}

// Search results response (folders + files combined)
export interface ISearchLibraryResponse {
  folders: IFolder[];
  files: IFile[];
  totalFolders: number;
  totalFiles: number;
  query: string;
}

// Get folder API response
export interface IGetFolderApiResponse extends IApiResponse<IFolder> {}

//Get folder with relations API response
export interface IGetFolderWithRelationsApiResponse
  extends IApiResponse<IFolderWithRelations> {}

// Get folders list API response
export interface IGetFoldersApiResponse extends IApiResponse<IFolder[]> {}

//Get folders paginated API response
export interface IGetFoldersPaginatedApiResponse
  extends IApiResponse<IPaginatedResponse<IFolder>> {}

// Create folder API response
export interface ICreateFolderApiResponse extends IApiResponse<IFolder> {}

// Update folder API response
export interface IUpdateFolderApiResponse extends IApiResponse<IFolder> {}

// Delete folder API response
export interface IDeleteFolderApiResponse
  extends IApiResponse<{ deleted: boolean }> {}

//Get folder tree API response
export interface IGetFolderTreeApiResponse
  extends IApiResponse<IFolderTree[]> {}

// Get file API response
export interface IGetFileApiResponse extends IApiResponse<IFile> {}

// Get file with relations API response
export interface IGetFileWithRelationsApiResponse
  extends IApiResponse<IFileWithRelations> {}

// Get files list API response
export interface IGetFilesApiResponse extends IApiResponse<IFile[]> {}

// Get files paginated API response
export interface IGetFilesPaginatedApiResponse
  extends IApiResponse<IPaginatedResponse<IFile>> {}

// Upload file API response
export interface IUploadFileApiResponse
  extends IApiResponse<IFileUploadResponse> {}

// Update file API response
export interface IUpdateFileApiResponse extends IApiResponse<IFile> {}

// Delete file API response
export interface IDeleteFileApiResponse
  extends IApiResponse<{ deleted: boolean }> {}

// Get public file API response
export interface IGetPublicFileApiResponse extends IApiResponse<IFilePublic> {}

// Get folder content API response (with breadcrumbs and pagination)
export interface IGetFolderContentApiResponse
  extends IApiResponse<IFolderContentResponse> {}

// Clone folder API response
export interface ICloneFolderApiResponse
  extends IApiResponse<ICloneFolderResponse> {}

// Clone file API response
export interface ICloneFileApiResponse
  extends IApiResponse<ICloneFileResponse> {}

// Search library API response (folders + files)
export interface ISearchLibraryApiResponse
  extends IApiResponse<ISearchLibraryResponse> {}

// Download file API response
export interface IDownloadFileApiResponse
  extends IApiResponse<IFileDownloadResponse> {}

// Get user library API response (all folders + files with pagination)
export interface IGetUserLibraryApiResponse
  extends IApiResponse<IGetUserLibraryResponse> {}

// Folder statistics
export interface IFolderStats {
  id: string;
  name: string;
  filesCount: number;
  subfoldersCount: number;
  totalSize: number; // in bytes
}

// User library statistics
export interface ILibraryStats {
  totalFolders: number;
  totalFiles: number;
  totalSize: number; // in bytes
  publicFolders: number;
  publicFiles: number;
}

// File type statistics
export interface IFileTypeStats {
  extension: string;
  mimeType: string;
  count: number;
  totalSize: number;
}

// Folder breadcrumb (for navigation)
export interface IFolderBreadcrumb {
  id: string;
  name: string;
  parentId: string | null;
}

// File download info
export interface IFileDownloadInfo {
  fileId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
}

// File download response (for API)
export interface IFileDownloadResponse {
  url: string;
  expiresAt?: Date | string;
  fileName: string;
  mimeType: string;
  size: number;
}

// Get all user resources response
export interface IGetUserLibraryResponse {
  folders: IPaginatedResponse<IFolderWithUserRole>;
  files: IPaginatedResponse<IFileWithUserRole>;
  stats: ILibraryStats;
}

// Get folder with accessible actions
export interface IFolderWithUserRole extends IFolder {
  userRole: PermissionRole | null;
  isOwner: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

// Get file with accessible actions
export interface IFileWithUserRole extends IFile {
  userRole: PermissionRole | null;
  isOwner: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canDownload: boolean;
}

// Public folder content response (without permissions info)
export interface IPublicFolderContentResponse {
  folder: IFolder;
  breadcrumbs: IFolderBreadcrumb[];
  path: string;
  subfolders: IFolder[];
  files: IFile[];
}

// Public resource check response
export interface IPublicResourceCheckResponse {
  type: "folder" | "file";
  resource: IFolder | IFile;
}

// Get public folder content API response
export interface IGetPublicFolderContentApiResponse
  extends IApiResponse<IFolderContentResponse> {}

// Check public resource API response
export interface ICheckPublicResourceApiResponse
  extends IApiResponse<IPublicResourceCheckResponse> {}
