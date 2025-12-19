import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import {
  FolderPermission,
  FilePermission,
  PermissionRole,
} from "@prisma/client";
import {
  GrantFolderPermissionDto,
  UpdateFolderPermissionDto,
  BatchGrantFolderPermissionsDto,
  BatchGrantMultipleFoldersDto,
  GrantFilePermissionDto,
  UpdateFilePermissionDto,
  BatchGrantFilePermissionsDto,
  BatchGrantMultipleFilesDto,
  CheckPermissionDto,
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
} from "@monorepo/shared";

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  //Grant permission to a user for a folder
  async grantFolderPermission(
    data: GrantFolderPermissionDto
  ): Promise<IFolderPermission> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: data.folderId },
    });
    if (!folder) {
      throw new NotFoundException(`Folder with id ${data.folderId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${data.userId} not found`);
    }

    // Check if permission already exists
    const existingPermission = await this.prisma.folderPermission.findUnique({
      where: {
        folderId_userId: {
          folderId: data.folderId,
          userId: data.userId,
        },
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        `Permission already exists for user ${data.userId} on folder ${data.folderId}`
      );
    }

    return this.prisma.folderPermission.create({
      data: {
        folderId: data.folderId,
        userId: data.userId,
        role: data.role,
      },
    });
  }

  // Update folder permission role
  async updateFolderPermission(
    permissionId: string,
    data: UpdateFolderPermissionDto
  ): Promise<IFolderPermission> {
    const permission = await this.prisma.folderPermission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permission with id ${permissionId} not found`
      );
    }

    return this.prisma.folderPermission.update({
      where: { id: permissionId },
      data: { role: data.role },
    });
  }

  // Revoke folder permission
  async revokeFolderPermission(
    permissionId: string
  ): Promise<{ revoked: boolean }> {
    const permission = await this.prisma.folderPermission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permission with id ${permissionId} not found`
      );
    }

    await this.prisma.folderPermission.delete({
      where: { id: permissionId },
    });

    return { revoked: true };
  }

  // Get all permissions for a folder
  async getFolderPermissions(folderId: string): Promise<IFolderPermission[]> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with id ${folderId} not found`);
    }

    return this.prisma.folderPermission.findMany({
      where: { folderId },
      orderBy: { grantedAt: "desc" },
    });
  }

  // Get folder permissions with user information
  async getFolderPermissionsWithUsers(
    folderId: string
  ): Promise<IFolderPermissionWithUser[]> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with id ${folderId} not found`);
    }

    const permissions = await this.prisma.folderPermission.findMany({
      where: { folderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { grantedAt: "desc" },
    });

    return permissions;
  }
  // Batch grant permissions to multiple users for one folder
  async batchGrantFolderPermissions(
    data: BatchGrantFolderPermissionsDto
  ): Promise<IBatchGrantResult> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: data.folderId },
    });
    if (!folder) {
      throw new NotFoundException(`Folder with id ${data.folderId} not found`);
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: data.userIds } },
    });

    if (users.length !== data.userIds.length) {
      throw new BadRequestException("One or more users not found");
    }

    // Get existing permissions
    const existingPermissions = await this.prisma.folderPermission.findMany({
      where: {
        folderId: data.folderId,
        userId: { in: data.userIds },
      },
    });

    const existingUserIds = new Set(existingPermissions.map((p) => p.userId));
    const newUserIds = data.userIds.filter((id) => !existingUserIds.has(id));

    // Create new permissions
    const permissions: FolderPermission[] = [];
    let granted = 0;
    let failed = 0;

    for (const userId of newUserIds) {
      try {
        const permission = await this.prisma.folderPermission.create({
          data: {
            folderId: data.folderId,
            userId,
            role: data.role,
          },
        });
        permissions.push(permission);
        granted++;
      } catch (error) {
        failed++;
      }
    }

    return {
      granted,
      failed: failed + existingUserIds.size,
      permissions,
    };
  }

  //Batch grant permissions to multiple users for multiple folders
  async batchGrantMultipleFolders(
    data: BatchGrantMultipleFoldersDto
  ): Promise<IBulkPermissionResult> {
    const folders = await this.prisma.folder.findMany({
      where: { id: { in: data.folderIds } },
    });

    if (folders.length !== data.folderIds.length) {
      throw new BadRequestException("One or more folders not found");
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: data.userIds } },
    });

    if (users.length !== data.userIds.length) {
      throw new BadRequestException("One or more users not found");
    }

    let success = 0;
    let failed = 0;
    const errors: Array<{
      userId?: string;
      resourceId?: string;
      error: string;
    }> = [];

    // Grant permissions for each combination
    for (const folderId of data.folderIds) {
      for (const userId of data.userIds) {
        try {
          // Check if permission already exists
          const existing = await this.prisma.folderPermission.findUnique({
            where: {
              folderId_userId: { folderId, userId },
            },
          });

          if (!existing) {
            await this.prisma.folderPermission.create({
              data: {
                folderId,
                userId,
                role: data.role,
              },
            });
            success++;
          } else {
            failed++;
            errors.push({
              userId,
              resourceId: folderId,
              error: "Permission already exists",
            });
          }
        } catch (error) {
          failed++;
          errors.push({
            userId,
            resourceId: folderId,
            error: error.message || "Unknown error",
          });
        }
      }
    }

    return { success, failed, errors };
  }

  // Grant permission to a user for a file
  async grantFilePermission(
    data: GrantFilePermissionDto
  ): Promise<IFilePermission> {
    const file = await this.prisma.file.findUnique({
      where: { id: data.fileId },
    });
    if (!file) {
      throw new NotFoundException(`File with id ${data.fileId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${data.userId} not found`);
    }

    const existingPermission = await this.prisma.filePermission.findUnique({
      where: {
        fileId_userId: {
          fileId: data.fileId,
          userId: data.userId,
        },
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        `Permission already exists for user ${data.userId} on file ${data.fileId}`
      );
    }

    return this.prisma.filePermission.create({
      data: {
        fileId: data.fileId,
        userId: data.userId,
        role: data.role,
      },
    });
  }

  // Update file permission role
  async updateFilePermission(
    permissionId: string,
    data: UpdateFilePermissionDto
  ): Promise<IFilePermission> {
    const permission = await this.prisma.filePermission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permission with id ${permissionId} not found`
      );
    }

    return this.prisma.filePermission.update({
      where: { id: permissionId },
      data: { role: data.role },
    });
  }

  // Revoke file permission
  async revokeFilePermission(
    permissionId: string
  ): Promise<{ revoked: boolean }> {
    const permission = await this.prisma.filePermission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permission with id ${permissionId} not found`
      );
    }

    await this.prisma.filePermission.delete({
      where: { id: permissionId },
    });

    return { revoked: true };
  }

  // Get all permissions for a file
  async getFilePermissions(fileId: string): Promise<IFilePermission[]> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with id ${fileId} not found`);
    }

    return this.prisma.filePermission.findMany({
      where: { fileId },
      orderBy: { grantedAt: "desc" },
    });
  }

  // Get file permissions with user information
  async getFilePermissionsWithUsers(
    fileId: string
  ): Promise<IFilePermissionWithUser[]> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with id ${fileId} not found`);
    }

    const permissions = await this.prisma.filePermission.findMany({
      where: { fileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { grantedAt: "desc" },
    });

    return permissions;
  }

  // Batch grant permissions to multiple users for one file
  async batchGrantFilePermissions(
    data: BatchGrantFilePermissionsDto
  ): Promise<IBatchGrantResult> {
    const file = await this.prisma.file.findUnique({
      where: { id: data.fileId },
    });
    if (!file) {
      throw new NotFoundException(`File with id ${data.fileId} not found`);
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: data.userIds } },
    });

    if (users.length !== data.userIds.length) {
      throw new BadRequestException("One or more users not found");
    }

    const existingPermissions = await this.prisma.filePermission.findMany({
      where: {
        fileId: data.fileId,
        userId: { in: data.userIds },
      },
    });

    const existingUserIds = new Set(existingPermissions.map((p) => p.userId));
    const newUserIds = data.userIds.filter((id) => !existingUserIds.has(id));

    const permissions: FilePermission[] = [];
    let granted = 0;
    let failed = 0;

    for (const userId of newUserIds) {
      try {
        const permission = await this.prisma.filePermission.create({
          data: {
            fileId: data.fileId,
            userId,
            role: data.role,
          },
        });
        permissions.push(permission);
        granted++;
      } catch (error) {
        failed++;
      }
    }

    return {
      granted,
      failed: failed + existingUserIds.size,
      permissions,
    };
  }

  // Batch grant permissions to multiple users for multiple files
  async batchGrantMultipleFiles(
    data: BatchGrantMultipleFilesDto
  ): Promise<IBulkPermissionResult> {
    const files = await this.prisma.file.findMany({
      where: { id: { in: data.fileIds } },
    });

    if (files.length !== data.fileIds.length) {
      throw new BadRequestException("One or more files not found");
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: data.userIds } },
    });

    if (users.length !== data.userIds.length) {
      throw new BadRequestException("One or more users not found");
    }

    let success = 0;
    let failed = 0;
    const errors: Array<{
      userId?: string;
      resourceId?: string;
      error: string;
    }> = [];

    // Grant permissions for each combination
    for (const fileId of data.fileIds) {
      for (const userId of data.userIds) {
        try {
          // Check if permission already exists
          const existing = await this.prisma.filePermission.findUnique({
            where: {
              fileId_userId: { fileId, userId },
            },
          });

          if (!existing) {
            await this.prisma.filePermission.create({
              data: {
                fileId,
                userId,
                role: data.role,
              },
            });
            success++;
          } else {
            failed++;
            errors.push({
              userId,
              resourceId: fileId,
              error: "Permission already exists",
            });
          }
        } catch (error) {
          failed++;
          errors.push({
            userId,
            resourceId: fileId,
            error: error.message || "Unknown error",
          });
        }
      }
    }

    return { success, failed, errors };
  }

  // Check if user has permission for a folder
  async checkFolderPermission(
    userId: string,
    folderId: string,
    requiredRole?: PermissionRole
  ): Promise<IPermissionCheckResult> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with id ${folderId} not found`);
    }

    const isOwner = folder.ownerId === userId;
    if (isOwner) {
      return {
        hasAccess: true,
        userRole: "OWNER" as PermissionRole,
        isOwner: true,
      };
    }

    const permission = await this.prisma.folderPermission.findUnique({
      where: {
        folderId_userId: { folderId, userId },
      },
    });

    if (!permission) {
      return {
        hasAccess: false,
        userRole: null,
        isOwner: false,
      };
    }

    let hasAccess = true;
    if (requiredRole) {
      const roleHierarchy = { OWNER: 3, EDITOR: 2, VIEWER: 1 };
      hasAccess = roleHierarchy[permission.role] >= roleHierarchy[requiredRole];
    }

    return {
      hasAccess,
      userRole: permission.role,
      isOwner: false,
    };
  }

  // Check if user has permission for a file
  async checkFilePermission(
    userId: string,
    fileId: string,
    requiredRole?: PermissionRole
  ): Promise<IPermissionCheckResult> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with id ${fileId} not found`);
    }

    const isOwner = file.ownerId === userId;
    if (isOwner) {
      return {
        hasAccess: true,
        userRole: "OWNER" as PermissionRole,
        isOwner: true,
      };
    }

    const permission = await this.prisma.filePermission.findUnique({
      where: {
        fileId_userId: { fileId, userId },
      },
    });

    if (!permission) {
      return {
        hasAccess: false,
        userRole: null,
        isOwner: false,
      };
    }

    let hasAccess = true;
    if (requiredRole) {
      const roleHierarchy = { OWNER: 3, EDITOR: 2, VIEWER: 1 };
      hasAccess = roleHierarchy[permission.role] >= roleHierarchy[requiredRole];
    }

    return {
      hasAccess,
      userRole: permission.role,
      isOwner: false,
    };
  }

  // Get shared users for a folder
  async getFolderSharedUsers(folderId: string): Promise<ISharedUsersResponse> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with id ${folderId} not found`);
    }

    const users = folder.permissions.map((p) => ({
      userId: p.user.id,
      userName: p.user.name,
      userEmail: p.user.email,
      role: p.role,
      grantedAt: p.grantedAt,
    }));

    return {
      users,
      totalUsers: users.length,
    };
  }

  // Get shared users for a file
  async getFileSharedUsers(fileId: string): Promise<ISharedUsersResponse> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException(`File with id ${fileId} not found`);
    }

    const users = file.permissions.map((p) => ({
      userId: p.user.id,
      userName: p.user.name,
      userEmail: p.user.email,
      role: p.role,
      grantedAt: p.grantedAt,
    }));

    return {
      users,
      totalUsers: users.length,
    };
  }

  // Get all permissions for a user (summary)
  async getUserPermissionSummary(
    userId: string
  ): Promise<IUserPermissionSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const folderPermissions = await this.prisma.folderPermission.findMany({
      where: { userId },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const filePermissions = await this.prisma.filePermission.findMany({
      where: { userId },
      include: {
        file: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      userId,
      foldersWithAccess: folderPermissions.map((p) => ({
        folderId: p.folder.id,
        folderName: p.folder.name,
        role: p.role,
      })),
      filesWithAccess: filePermissions.map((p) => ({
        fileId: p.file.id,
        fileName: p.file.name,
        role: p.role,
      })),
    };
  }

  // Get permission by ID (for updates/deletes)
  async getFolderPermissionById(id: string): Promise<IFolderPermission | null> {
    return this.prisma.folderPermission.findUnique({
      where: { id },
    });
  }

  // Get file permission by ID
  async getFilePermissionById(id: string): Promise<IFilePermission | null> {
    return this.prisma.filePermission.findUnique({
      where: { id },
    });
  }
}
