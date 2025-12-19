import { IApiResponse, PermissionRole } from "../common/common.types";
import { IUserPublic } from "../user/user.types";
import { IFolder, IFile } from "../library/library.types";

// Base folder permission model
export interface IFolderPermission {
  id: string;
  folderId: string;
  userId: string;
  role: PermissionRole;
  grantedAt: Date | string;
}

// Folder permission with user information
export interface IFolderPermissionWithUser extends IFolderPermission {
  user: IUserPublic;
}

// Folder permission with folder information
export interface IFolderPermissionWithFolder extends IFolderPermission {
  folder: IFolder;
}

// Folder permission with full relations
export interface IFolderPermissionWithRelations extends IFolderPermission {
  user: IUserPublic;
  folder: IFolder;
}

// Base file permission
export interface IFilePermission {
  id: string;
  fileId: string;
  userId: string;
  role: PermissionRole;
  grantedAt: Date | string;
}

// File permission with user information
export interface IFilePermissionWithUser extends IFilePermission {
  user: IUserPublic;
}

// File permission with file information
export interface IFilePermissionWithFile extends IFilePermission {
  file: IFile;
}

// File permission with full relations (user + file)
export interface IFilePermissionWithRelations extends IFilePermission {
  user: IUserPublic;
  file: IFile;
}

// Dto for granting folder permission
export interface IGrantFolderPermissionInput {
  folderId: string;
  userId: string;
  role: PermissionRole;
}

// Dto for updating folder permission
export interface IUpdateFolderPermissionInput {
  role: PermissionRole;
}

// Dto for granting file permission
export interface IGrantFilePermissionInput {
  fileId: string;
  userId: string;
  role: PermissionRole;
}

//Dto for updating file permission
export interface IUpdateFilePermissionInput {
  role: PermissionRole;
}

// Dto for batch granting permissions
export interface IBatchGrantPermissionsInput {
  userIds: string[];
  role: PermissionRole;
}

// Dto for checking permission
export interface ICheckPermissionInput {
  userId: string;
  resourceId: string;
  requiredRole?: PermissionRole;
}

// Folder permission response
export interface IFolderPermissionResponse extends IFolderPermission {}

// File permission response
export interface IFilePermissionResponse extends IFilePermission {}

// Permission check result
export interface IPermissionCheckResult {
  hasAccess: boolean;
  userRole: PermissionRole | null;
  isOwner: boolean;
}

// Shared users response (users who have access to a resource)
export interface ISharedUsersResponse {
  users: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    role: PermissionRole;
    grantedAt: Date | string;
  }>;
  totalUsers: number;
}

// Batch grant result
export interface IBatchGrantResult {
  granted: number;
  failed: number;
  permissions: IFolderPermission[] | IFilePermission[];
}

// Get folder permission API response
export interface IGetFolderPermissionApiResponse
  extends IApiResponse<IFolderPermission> {}

// Get folder permissions list API response
export interface IGetFolderPermissionsApiResponse
  extends IApiResponse<IFolderPermission[]> {}

// Get folder permissions with users API response
export interface IGetFolderPermissionsWithUsersApiResponse
  extends IApiResponse<IFolderPermissionWithUser[]> {}

// Grant folder permission API response
export interface IGrantFolderPermissionApiResponse
  extends IApiResponse<IFolderPermission> {}

// Update folder permission API response
export interface IUpdateFolderPermissionApiResponse
  extends IApiResponse<IFolderPermission> {}

// Revoke folder permission API response
export interface IRevokeFolderPermissionApiResponse
  extends IApiResponse<{ revoked: boolean }> {}

// Get file permission API response
export interface IGetFilePermissionApiResponse
  extends IApiResponse<IFilePermission> {}

// Get file permissions list API response
export interface IGetFilePermissionsApiResponse
  extends IApiResponse<IFilePermission[]> {}

// Get file permissions with users API response
export interface IGetFilePermissionsWithUsersApiResponse
  extends IApiResponse<IFilePermissionWithUser[]> {}

// Grant file permission API response
export interface IGrantFilePermissionApiResponse
  extends IApiResponse<IFilePermission> {}

// Update file permission API response
export interface IUpdateFilePermissionApiResponse
  extends IApiResponse<IFilePermission> {}

// Revoke file permission API response
export interface IRevokeFilePermissionApiResponse
  extends IApiResponse<{ revoked: boolean }> {}

// Check permission API response
export interface ICheckPermissionApiResponse
  extends IApiResponse<IPermissionCheckResult> {}

// Get shared users API response
export interface IGetSharedUsersApiResponse
  extends IApiResponse<ISharedUsersResponse> {}

// Batch grant permissions API response
export interface IBatchGrantPermissionsApiResponse
  extends IApiResponse<IBatchGrantResult> {}

// Permission summary for a user dto
export interface IUserPermissionSummary {
  userId: string;
  foldersWithAccess: Array<{
    folderId: string;
    folderName: string;
    role: PermissionRole;
  }>;
  filesWithAccess: Array<{
    fileId: string;
    fileName: string;
    role: PermissionRole;
  }>;
}

// Resource access info (for displaying who has access) dto
export interface IResourceAccessInfo {
  resourceId: string;
  resourceType: "folder" | "file";
  owner: {
    id: string;
    name: string;
    email: string;
  };
  sharedWith: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    role: PermissionRole;
    grantedAt: Date | string;
  }>;
  isPublic: boolean;
}

// Permission inheritance info (for nested folders) dto
export interface IPermissionInheritance {
  folderId: string;
  folderName: string;
  inheritedFrom: {
    folderId: string;
    folderName: string;
  } | null;
  effectiveRole: PermissionRole;
}

// Bulk permission operation result
export interface IBulkPermissionResult {
  success: number;
  failed: number;
  errors: Array<{
    userId?: string;
    resourceId?: string;
    error: string;
  }>;
}
