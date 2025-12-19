import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { PermissionService } from "./permission.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import {
  GrantFolderPermissionDto,
  UpdateFolderPermissionDto,
  BatchGrantFolderPermissionsDto,
  BatchGrantMultipleFoldersDto,
  GrantFilePermissionDto,
  UpdateFilePermissionDto,
  BatchGrantFilePermissionsDto,
  BatchGrantMultipleFilesDto,
} from "./permission.dto";
import {
  IFolderPermission,
  IFolderPermissionWithUser,
  IFilePermission,
  IFilePermissionWithUser,
  IPermissionCheckResult,
  ISharedUsersResponse,
  IBatchGrantResult,
  IUserPermissionSummary,
  IBulkPermissionResult,
  PermissionRole,
} from "@monorepo/shared";
import {
  FileOwnershipGuard,
  FolderOwnershipGuard,
} from "../../common/guards/library.guards";

// Needs guard for permissons

@ApiTags("permissions")
@ApiBearerAuth()
@Controller("permissions")
@UseGuards(AuthGuard)
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Post("folders")
  @ApiOperation({ summary: "Grant permission to a user for a folder" })
  @ApiResponse({
    status: 201,
    description: "Permission granted successfully",
  })
  @ApiResponse({ status: 404, description: "Folder or user not found" })
  @ApiResponse({ status: 409, description: "Permission already exists" })
  async grantFolderPermission(
    @Body() data: GrantFolderPermissionDto
  ): Promise<IFolderPermission> {
    return this.permissionService.grantFolderPermission(data);
  }

  @Post("folders/batch")
  @ApiOperation({
    summary: "Batch grant permissions to multiple users for one folder",
  })
  @ApiResponse({
    status: 201,
    description: "Permissions granted successfully",
  })
  @ApiResponse({ status: 404, description: "Folder not found" })
  @ApiResponse({ status: 400, description: "Invalid user IDs" })
  async batchGrantFolderPermissions(
    @Body() data: BatchGrantFolderPermissionsDto
  ): Promise<IBatchGrantResult> {
    return this.permissionService.batchGrantFolderPermissions(data);
  }

  @Post("folders/batch-multiple")
  @ApiOperation({
    summary: "Batch grant permissions to multiple users for multiple folders",
  })
  @ApiResponse({
    status: 201,
    description: "Permissions granted successfully",
  })
  @ApiResponse({ status: 404, description: "Folders or users not found" })
  @ApiResponse({ status: 400, description: "Invalid folder or user IDs" })
  async batchGrantMultipleFolders(
    @Body() data: BatchGrantMultipleFoldersDto
  ): Promise<IBulkPermissionResult> {
    return this.permissionService.batchGrantMultipleFolders(data);
  }

  @Put("folders/:permissionId")
  @ApiOperation({ summary: "Update folder permission role" })
  @ApiParam({ name: "permissionId", description: "Permission ID" })
  @ApiResponse({
    status: 200,
    description: "Permission updated successfully",
  })
  @ApiResponse({ status: 404, description: "Permission not found" })
  async updateFolderPermission(
    @Param("permissionId") permissionId: string,
    @Body() data: UpdateFolderPermissionDto
  ): Promise<IFolderPermission> {
    return this.permissionService.updateFolderPermission(permissionId, data);
  }

  @Delete("folders/:permissionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke folder permission" })
  @ApiParam({ name: "permissionId", description: "Permission ID" })
  @ApiResponse({ status: 204, description: "Permission revoked successfully" })
  @ApiResponse({ status: 404, description: "Permission not found" })
  async revokeFolderPermission(
    @Param("permissionId") permissionId: string
  ): Promise<void> {
    await this.permissionService.revokeFolderPermission(permissionId);
  }

  @Get("folders/:folderId")
  @UseGuards(FolderOwnershipGuard)
  @ApiOperation({ summary: "Get all permissions for a folder" })
  @ApiParam({ name: "folderId", description: "Folder ID" })
  @ApiResponse({
    status: 200,
    description: "Permissions retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Folder not found" })
  async getFolderPermissions(
    @Param("folderId") folderId: string
  ): Promise<IFolderPermission[]> {
    return this.permissionService.getFolderPermissions(folderId);
  }

  @Get("folders/:folderId/with-users")
  @UseGuards(FolderOwnershipGuard)
  @ApiOperation({ summary: "Get folder permissions with user information" })
  @ApiParam({ name: "folderId", description: "Folder ID" })
  @ApiResponse({
    status: 200,
    description: "Permissions with users retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Folder not found" })
  async getFolderPermissionsWithUsers(
    @Param("folderId") folderId: string
  ): Promise<IFolderPermissionWithUser[]> {
    return this.permissionService.getFolderPermissionsWithUsers(folderId);
  }

  @Get("folders/:folderId/shared-users")
  @UseGuards(FolderOwnershipGuard)
  @ApiOperation({ summary: "Get users who have access to a folder" })
  @ApiParam({ name: "folderId", description: "Folder ID" })
  @ApiResponse({
    status: 200,
    description: "Shared users retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Folder not found" })
  async getFolderSharedUsers(
    @Param("folderId") folderId: string
  ): Promise<ISharedUsersResponse> {
    return this.permissionService.getFolderSharedUsers(folderId);
  }

  @Post("files")
  @UseGuards(FileOwnershipGuard)
  @ApiOperation({ summary: "Grant permission to a user for a file" })
  @ApiResponse({
    status: 201,
    description: "Permission granted successfully",
  })
  @ApiResponse({ status: 404, description: "File or user not found" })
  @ApiResponse({ status: 409, description: "Permission already exists" })
  async grantFilePermission(
    @Body() data: GrantFilePermissionDto
  ): Promise<IFilePermission> {
    return this.permissionService.grantFilePermission(data);
  }

  @Post("files/batch")
  @ApiOperation({
    summary: "Batch grant permissions to multiple users for one file",
  })
  @ApiResponse({
    status: 201,
    description: "Permissions granted successfully",
  })
  @ApiResponse({ status: 404, description: "File not found" })
  @ApiResponse({ status: 400, description: "Invalid user IDs" })
  async batchGrantFilePermissions(
    @Body() data: BatchGrantFilePermissionsDto
  ): Promise<IBatchGrantResult> {
    return this.permissionService.batchGrantFilePermissions(data);
  }

  @Post("files/batch-multiple")
  @ApiOperation({
    summary: "Batch grant permissions to multiple users for multiple files",
  })
  @ApiResponse({
    status: 201,
    description: "Permissions granted successfully",
  })
  @ApiResponse({ status: 404, description: "Files or users not found" })
  @ApiResponse({ status: 400, description: "Invalid file or user IDs" })
  async batchGrantMultipleFiles(
    @Body() data: BatchGrantMultipleFilesDto
  ): Promise<IBulkPermissionResult> {
    return this.permissionService.batchGrantMultipleFiles(data);
  }

  @Put("files/:permissionId")
  @ApiOperation({ summary: "Update file permission role" })
  @ApiParam({ name: "permissionId", description: "Permission ID" })
  @ApiResponse({
    status: 200,
    description: "Permission updated successfully",
  })
  @ApiResponse({ status: 404, description: "Permission not found" })
  async updateFilePermission(
    @Param("permissionId") permissionId: string,
    @Body() data: UpdateFilePermissionDto
  ): Promise<IFilePermission> {
    return this.permissionService.updateFilePermission(permissionId, data);
  }

  @Delete("files/:permissionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke file permission" })
  @ApiParam({ name: "permissionId", description: "Permission ID" })
  @ApiResponse({ status: 204, description: "Permission revoked successfully" })
  @ApiResponse({ status: 404, description: "Permission not found" })
  async revokeFilePermission(
    @Param("permissionId") permissionId: string
  ): Promise<void> {
    console.log({ permissionId });

    await this.permissionService.revokeFilePermission(permissionId);
  }

  @Get("files/:fileId")
  @UseGuards(FileOwnershipGuard)
  @ApiOperation({ summary: "Get all permissions for a file" })
  @ApiParam({ name: "fileId", description: "File ID" })
  @ApiResponse({
    status: 200,
    description: "Permissions retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "File not found" })
  async getFilePermissions(
    @Param("fileId") fileId: string
  ): Promise<IFilePermission[]> {
    return this.permissionService.getFilePermissions(fileId);
  }

  @Get("files/:fileId/with-users")
  @UseGuards(FileOwnershipGuard)
  @ApiOperation({ summary: "Get file permissions with user information" })
  @ApiParam({ name: "fileId", description: "File ID" })
  @ApiResponse({
    status: 200,
    description: "Permissions with users retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "File not found" })
  async getFilePermissionsWithUsers(
    @Param("fileId") fileId: string
  ): Promise<IFilePermissionWithUser[]> {
    return this.permissionService.getFilePermissionsWithUsers(fileId);
  }

  @Get("files/:fileId/shared-users")
  @UseGuards(FileOwnershipGuard)
  @ApiOperation({ summary: "Get users who have access to a file" })
  @ApiParam({ name: "fileId", description: "File ID" })
  @ApiResponse({
    status: 200,
    description: "Shared users retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "File not found" })
  async getFileSharedUsers(
    @Param("fileId") fileId: string
  ): Promise<ISharedUsersResponse> {
    return this.permissionService.getFileSharedUsers(fileId);
  }

  @Get("check/folders/:folderId/users/:userId")
  @ApiOperation({ summary: "Check if user has permission for a folder" })
  @ApiParam({ name: "folderId", description: "Folder ID" })
  @ApiParam({ name: "userId", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "Permission check completed",
  })
  @ApiResponse({ status: 404, description: "Folder not found" })
  async checkFolderPermission(
    @Param("folderId") folderId: string,
    @Param("userId") userId: string
  ): Promise<IPermissionCheckResult> {
    return this.permissionService.checkFolderPermission(userId, folderId);
  }

  @Get("check/files/:fileId/users/:userId")
  @ApiOperation({ summary: "Check if user has permission for a file" })
  @ApiParam({ name: "fileId", description: "File ID" })
  @ApiParam({ name: "userId", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "Permission check completed",
  })
  @ApiResponse({ status: 404, description: "File not found" })
  async checkFilePermission(
    @Param("fileId") fileId: string,
    @Param("userId") userId: string
  ): Promise<IPermissionCheckResult> {
    return this.permissionService.checkFilePermission(userId, fileId);
  }

  @Get("users/:userId/summary")
  @ApiOperation({ summary: "Get all permissions for a user (summary)" })
  @ApiParam({ name: "userId", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User permission summary retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserPermissionSummary(
    @Param("userId") userId: string
  ): Promise<IUserPermissionSummary> {
    return this.permissionService.getUserPermissionSummary(userId);
  }
}
