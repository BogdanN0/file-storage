import { PermissionRole } from "../common/common.types";
import { IApiResponse } from "../common/common.types";
import { IFile, IFolder } from "../library/library.types";

// Base user model
export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Public user information (without password)
export interface IUserPublic {
  id: string;
  name: string;
  email: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// User session model
export interface ISession {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActivity: Date | string;
  createdAt: Date | string;
}

// Refresh token model
export interface IRefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  isRevoked: boolean;
  sessionId?: string;
}

// Create user dto
export interface ICreateUserInput {
  name: string;
  email: string;
  password: string;
}

// Update user dto
export interface IUpdateUserInput {
  name?: string;
  email?: string;
}

// Create session dto
export interface ICreateSessionInput {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}

// Create refresh token dto
export interface ICreateRefreshTokenInput {
  userId: string;
  token: string;
  expiresAt: string; // ISO string
  sessionId?: string;
}

// User with related data
export interface IUserWithRelations {
  id: string;
  name: string;
  email: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  sessions: ISession[];
  refreshTokens: IRefreshToken[];
  ownedFolders: IFolder[];
  ownedFiles: IFile[];
}

// User statistics
export interface IUserStats {
  foldersCount: number;
  filesCount: number;
  sessionsCount: number;
}

// User folder access
export interface IUserAccessFolder {
  folderId: string;
  folderName: string;
  folderDescription: string | null;
  role: PermissionRole;
  grantedAt: Date | string;
  permissionId: string;
}

// User file access
export interface IUserAccessFile {
  fileId: string;
  fileName: string;
  fileOriginalName: string;
  fileDescription: string | null;
  fileMimeType: string;
  role: PermissionRole;
  permissionId: string;
  grantedAt: Date | string;
}

// User with owner access
export interface IUserWithAccess {
  userId: string;
  userName: string;
  userEmail: string;
  userCreatedAt: Date | string;

  folders: IUserAccessFolder[];

  files: IUserAccessFile[];

  totalFolders: number;
  totalFiles: number;
}

// Pagination
export interface IUsersWithAccessResponse {
  users: IUserWithAccess[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User pagnation dto
export interface IUsersWithAccessPaginationQueryInput {
  page?: number;
  limit?: number;
}

// User search response
export interface ISearchUsersResponse {
  users: IUserPublic[];
  totalUsers: number;
  query: string;
  page: number;
  limit: number;
}

// User search dto
export interface ISearchUsersInput {
  query: string;
  page?: number;
  limit?: number;
}

// Get user API response
export interface IGetUserApiResponse extends IApiResponse<IUserPublic> {}

// Get user sessions API response
export interface IGetUserSessionsApiResponse extends IApiResponse<ISession[]> {}

// Get user with relations API response
export interface IGetUserWithRelationsApiResponse
  extends IApiResponse<IUserWithRelations> {}

// Get user stats API response
export interface IGetUserStatsApiResponse extends IApiResponse<IUserStats> {}

// Delete session API response
export interface IDeleteSessionApiResponse
  extends IApiResponse<{ deleted: boolean }> {}

// Get users with access API response
export interface IGetUsersWithAccessApiResponse
  extends IApiResponse<IUsersWithAccessResponse> {}

// Search users API response
export interface ISearchUsersApiResponse
  extends IApiResponse<ISearchUsersResponse> {}
