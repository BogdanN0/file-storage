import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { Folder, File, PermissionRole } from "@prisma/client";
import * as fs from "fs/promises";
import * as path from "path";
import {
  CreateFolderDto,
  UpdateFolderDto,
  MoveFolderDto,
  CloneFolderDto,
  FolderQueryDto,
  UploadFileMetadataDto,
  UpdateFileDto,
  MoveFileDto,
  CloneFileDto,
  FileQueryDto,
  UserLibraryQueryDto,
  SearchLibraryDto,
  FolderContentQueryDto,
  PaginationDto,
} from "./library.dto";
import {
  IFolder,
  IFile,
  IFolderContentResponse,
  ICloneFolderResponse,
  ICloneFileResponse,
  ISearchLibraryResponse,
  IFileDownloadResponse,
  IGetUserLibraryResponse,
  IPaginatedResponse,
  ILibraryStats,
  IFolderBreadcrumb,
  ICreateFileInput,
  IFolderWithUserRole,
  IFileWithUserRole,
} from "@monorepo/shared";
import { nanoid } from "nanoid";

@Injectable()
export class LibraryService {
  private readonly UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

  constructor(private prisma: PrismaService) {}

  async createFolder(dto: CreateFolderDto, ownerId: string): Promise<IFolder> {
    // Check existing parent folder if not specified
    if (dto.parentId) {
      const parentFolder = await this.prisma.folder.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentFolder) {
        throw new NotFoundException("Parent folder not found");
      }

      // Check rights parent folder
      if (parentFolder.ownerId !== ownerId) {
        throw new ForbiddenException(
          "You don't have permission to create folder in this location"
        );
      }
    }

    const folder = await this.prisma.folder.create({
      data: {
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId,
        isPublic: dto.isPublic ?? false,
        publicUrl: dto.isPublic ? "public/" + nanoid() : null,
        order: dto.order ?? 0,
        ownerId,
      },
    });

    return folder as IFolder;
  }

  async getFolderById(id: string, userId: string): Promise<IFolder> {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    // await this.checkFolderAccess(folder, userId);

    return folder as IFolder;
  }

  async updateFolder(
    id: string,
    dto: UpdateFolderDto,
    userId: string
  ): Promise<IFolder> {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    // if (folder.ownerId !== userId) {
    //   throw new ForbiddenException("You don't own this folder");
    // }

    // Check cycle depencence parentId
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException("Folder cannot be its own parent");
      }

      if (dto.parentId) {
        await this.checkCircularDependency(id, dto.parentId);
      }
    }

    const updated = await this.prisma.folder.update({
      where: { id },
      data: dto,
    });

    return updated as IFolder;
  }

  async deleteFolder(
    id: string,
    userId: string,
    cascade: boolean = true
  ): Promise<{ deleted: boolean }> {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        children: true,
        files: true,
      },
    });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    if (folder.ownerId !== userId) {
      throw new ForbiddenException("You don't own this folder");
    }

    if (!cascade && (folder.children.length > 0 || folder.files.length > 0)) {
      throw new BadRequestException(
        "Folder is not empty. Use cascade=true to delete with contents"
      );
    }

    // Delete files
    if (cascade && folder.files.length > 0) {
      for (const file of folder.files) {
        await this.deleteFileFromDisk(file.filePath);
      }
    }

    await this.prisma.folder.delete({
      where: { id },
    });

    return { deleted: true };
  }

  async moveFolder(
    id: string,
    dto: MoveFolderDto,
    userId: string
  ): Promise<IFolder> {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    if (folder.ownerId !== userId) {
      throw new ForbiddenException("You don't own this folder");
    }

    // Check dependence
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException("Folder cannot be its own parent");
      }
      await this.checkCircularDependency(id, dto.parentId);

      const targetParent = await this.prisma.folder.findUnique({
        where: { id: dto.parentId },
      });

      if (!targetParent || targetParent.ownerId !== userId) {
        throw new ForbiddenException("Invalid target folder");
      }
    }

    const updated = await this.prisma.folder.update({
      where: { id },
      data: { parentId: dto.parentId },
    });

    return updated as IFolder;
  }

  async cloneFolder(
    id: string,
    dto: CloneFolderDto,
    userId: string
  ): Promise<ICloneFolderResponse> {
    const sourceFolder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        children: true,
        files: true,
      },
    });

    if (!sourceFolder) {
      throw new NotFoundException("Folder not found");
    }

    // await this.checkFolderAccess(sourceFolder, userId);

    const newName = dto.newName || `${sourceFolder.name} (Copy)`;
    const targetParentId =
      dto.parentId !== undefined ? dto.parentId : sourceFolder.parentId;

    if (targetParentId) {
      const targetParent = await this.prisma.folder.findUnique({
        where: { id: targetParentId },
      });

      if (!targetParent || targetParent.ownerId !== userId) {
        throw new ForbiddenException("Invalid target folder");
      }
    }

    let clonedFilesCount = 0;
    let clonedSubfoldersCount = 0;

    const clonedFolder = await this.prisma.folder.create({
      data: {
        name: newName,
        description: sourceFolder.description,
        order: sourceFolder.order,
        isPublic: sourceFolder.isPublic,
        parentId: targetParentId,
        ownerId: userId,
      },
    });

    // Copy file
    if (dto.includeFiles !== false && sourceFolder.files.length > 0) {
      for (const file of sourceFolder.files) {
        try {
          await this.cloneFileInternal(file.id, clonedFolder.id, userId);
          clonedFilesCount++;
        } catch (error) {
          console.error(`Failed to clone file ${file.id}:`, error);
        }
      }
    }

    // Recursion copy
    if (dto.includeSubfolders !== false && sourceFolder.children.length > 0) {
      for (const child of sourceFolder.children) {
        try {
          const childCloneResult = await this.cloneFolder(
            child.id,
            {
              parentId: clonedFolder.id,
              includeFiles: dto.includeFiles,
              includeSubfolders: true,
            },
            userId
          );
          clonedSubfoldersCount++;
          clonedFilesCount += childCloneResult.clonedFilesCount;
          clonedSubfoldersCount += childCloneResult.clonedSubfoldersCount;
        } catch (error) {
          console.error(`Failed to clone subfolder ${child.id}:`, error);
        }
      }
    }

    return {
      clonedFolder: clonedFolder as IFolder,
      clonedFilesCount,
      clonedSubfoldersCount,
    };
  }

  async getFolderContent(
    id: string,
    query: FolderContentQueryDto,
    userId: string
  ): Promise<IFolderContentResponse> {
    // Get folder with permissions
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        permissions: {
          where: { userId: userId },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    // await this.checkFolderAccess(folder, userId);

    // Get breadcrumbs
    const breadcrumbs = await this.getFolderBreadcrumbs(id);

    // Get path
    const pathString = "/" + breadcrumbs.map((b) => b.name).join("/");

    // Get folder wtih permissions
    const subfolders = await this.prisma.folder.findMany({
      where: { parentId: id },
      include: {
        permissions: {
          where: { userId: userId },
        },
      },
      orderBy: query.sortBy
        ? { [query.sortBy]: query.sortOrder || "asc" }
        : { order: "asc" },
    });

    // Get file wiht permissions
    const files = await this.prisma.file.findMany({
      where: { folderId: id },
      include: {
        permissions: {
          where: { userId: userId },
        },
      },
      orderBy: query.sortBy
        ? { [query.sortBy]: query.sortOrder || "asc" }
        : { order: "asc" },
    });

    // Transform folder to include user role information
    const isOwner = folder.ownerId === userId;
    const userPermission = folder.permissions?.[0];
    const userRole = isOwner ? null : userPermission?.role || null;

    const folderWithRole = {
      ...folder,
      userRole,
      isOwner,
      canEdit: isOwner || userRole === PermissionRole.EDITOR,
      canDelete: isOwner,
      canShare: isOwner,
    };

    // Transform subfolders to include user role information
    const subfoldersWithRole: IFolderWithUserRole[] = subfolders.map(
      (subfolder) => {
        const isOwner = subfolder.ownerId === userId;
        const userPermission = subfolder.permissions?.[0];
        const userRole = isOwner ? null : userPermission?.role || null;

        return {
          ...subfolder,
          userRole,
          isOwner,
          canEdit: isOwner || userRole === PermissionRole.EDITOR,
          canDelete: isOwner,
          canShare: isOwner,
        } as IFolderWithUserRole;
      }
    );

    // Transform files to include user role information
    const filesWithRole: IFileWithUserRole[] = files.map((file) => {
      const isOwner = file.ownerId === userId;
      const userPermission = file.permissions?.[0];
      const userRole = isOwner ? null : userPermission?.role || null;

      return {
        ...this.serializeFile(file),
        userRole,
        isOwner,
        canEdit: isOwner || userRole === PermissionRole.EDITOR,
        canDelete: isOwner,
        canShare: isOwner,
        canDownload: true, // All users with access can download
      } as IFileWithUserRole;
    });

    return {
      folder: folderWithRole as IFolderWithUserRole,
      breadcrumbs,
      path: pathString,
      subfolders: subfoldersWithRole,
      files: filesWithRole,
      pagination: {
        totalSubfolders: subfolders.length,
        totalFiles: files.length,
      },
    };
  }

  async createFile(dto: ICreateFileInput, ownerId: string): Promise<IFile> {
    // If folder is selected
    if (dto.folderId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: dto.folderId },
      });

      if (!folder) {
        throw new NotFoundException("Folder not found");
      }

      if (folder.ownerId !== ownerId) {
        throw new ForbiddenException(
          "You don't have permission to upload to this folder"
        );
      }
    }

    const file = await this.prisma.file.create({
      data: {
        name: dto.name,
        originalName: dto.originalName,
        description: dto.description,
        folderId: dto.folderId,
        filePath: dto.filePath,
        mimeType: dto.mimeType,
        size: BigInt(dto.size),
        extension: dto.extension,
        isPublic: dto.isPublic ?? false,
        publicUrl: dto.isPublic ? "public/" + nanoid() : null,
        order: dto.order ?? 0,
        ownerId,
      },
    });

    return this.serializeFile(file);
  }

  async getFileById(id: string, userId: string): Promise<IFile> {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    // Cehck rights
    await this.checkFileAccess(file, userId);

    return this.serializeFile(file);
  }

  async updateFile(
    id: string,
    dto: UpdateFileDto,
    userId: string
  ): Promise<IFile> {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });
    console.log({ dto, file });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    if (file.ownerId !== userId) {
      throw new ForbiddenException("You don't own this file");
    }

    // Check new folder if specifed
    if (dto.folderId !== undefined && dto.folderId !== null) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: dto.folderId },
      });

      if (!folder || folder.ownerId !== userId) {
        throw new ForbiddenException("Invalid target folder");
      }
    }

    const updated = await this.prisma.file.update({
      where: { id },
      data: { ...dto, publicUrl: dto.isPublic ? "public/" + nanoid() : null },
    });

    return this.serializeFile(updated);
  }

  async deleteFile(id: string, userId: string): Promise<{ deleted: boolean }> {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    if (file.ownerId !== userId) {
      throw new ForbiddenException("You don't own this file");
    }

    // Delete file
    await this.deleteFileFromDisk(file.filePath);

    await this.prisma.file.delete({
      where: { id },
    });

    return { deleted: true };
  }

  async moveFile(id: string, dto: MoveFileDto, userId: string): Promise<IFile> {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    if (file.ownerId !== userId) {
      throw new ForbiddenException("You don't own this file");
    }

    // Check target order
    if (dto.folderId) {
      const targetFolder = await this.prisma.folder.findUnique({
        where: { id: dto.folderId },
      });

      if (!targetFolder || targetFolder.ownerId !== userId) {
        throw new ForbiddenException("Invalid target folder");
      }
    }

    const updated = await this.prisma.file.update({
      where: { id },
      data: { folderId: dto.folderId },
    });

    return this.serializeFile(updated);
  }

  async cloneFile(
    id: string,
    dto: CloneFileDto,
    userId: string
  ): Promise<ICloneFileResponse> {
    const clonedFile = await this.cloneFileInternal(
      id,
      dto.folderId,
      userId,
      dto.newName
    );

    return {
      clonedFile,
    };
  }

  private async cloneFileInternal(
    sourceFileId: string,
    targetFolderId: string | null | undefined,
    userId: string,
    customName?: string
  ): Promise<IFile> {
    const sourceFile = await this.prisma.file.findUnique({
      where: { id: sourceFileId },
    });

    if (!sourceFile) {
      throw new NotFoundException("File not found");
    }

    await this.checkFileAccess(sourceFile, userId);

    const newName = customName || `${sourceFile.name} (Copy)`;
    const targetFolder =
      targetFolderId !== undefined ? targetFolderId : sourceFile.folderId;

    // Check target folder
    if (targetFolder) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: targetFolder },
      });

      if (!folder || folder.ownerId !== userId) {
        throw new ForbiddenException("Invalid target folder");
      }
    }

    // Copy file
    const newFilePath = await this.copyFileOnDisk(sourceFile.filePath);

    const clonedFile = await this.prisma.file.create({
      data: {
        name: newName,
        originalName: sourceFile.originalName,
        description: sourceFile.description,
        folderId: targetFolder,
        filePath: newFilePath,
        mimeType: sourceFile.mimeType,
        size: sourceFile.size,
        extension: sourceFile.extension,
        isPublic: sourceFile.isPublic,
        order: sourceFile.order,
        ownerId: userId,
      },
    });

    return this.serializeFile(clonedFile);
  }

  async getFileDownloadInfo(
    id: string,
    userId: string
  ): Promise<IFileDownloadResponse> {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    await this.checkFileAccess(file, userId);

    return {
      url: `/api/files/${id}/download/direct`,
      fileName: file.name,
      mimeType: file.mimeType,
      size: Number(file.size),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    };
  }

  async searchLibrary(
    query: SearchLibraryDto,
    userId: string
  ): Promise<ISearchLibraryResponse> {
    const searchTerm = query.query;
    const type = query.type || "all";
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let folders: Folder[] = [];
    let files: File[] = [];
    let totalFolders = 0;
    let totalFiles = 0;

    const baseWhereClause = {
      ownerId: userId,
      ...(query.folderId && { folderId: query.folderId }),
      ...(query.isPublic !== undefined && { isPublic: query.isPublic }),
    };

    if (type === "folder" || type === "all") {
      const folderWhere = {
        ...baseWhereClause,
        name: { contains: searchTerm, mode: "insensitive" as const },
      };

      folders = await this.prisma.folder.findMany({
        where: folderWhere,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      });

      totalFolders = await this.prisma.folder.count({ where: folderWhere });
    }

    if (type === "file" || type === "all") {
      const fileWhere = {
        ...baseWhereClause,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" as const } },
          {
            originalName: {
              contains: searchTerm,
              mode: "insensitive" as const,
            },
          },
        ],
      };

      files = await this.prisma.file.findMany({
        where: fileWhere,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      });

      totalFiles = await this.prisma.file.count({ where: fileWhere });
    }

    return {
      folders: folders as IFolder[],
      files: files.map((f) => this.serializeFile(f)),
      totalFolders,
      totalFiles,
      query: searchTerm,
    };
  }

  async getUserLibrary(
    query: UserLibraryQueryDto,
    userId: string
  ): Promise<IGetUserLibraryResponse> {
    const foldersPage = query.foldersPage || 1;
    const foldersLimit = query.foldersLimit || 20;
    const filesPage = query.filesPage || 1;
    const filesLimit = query.filesLimit || 20;

    const [folders, foldersTotal, files, filesTotal, stats] = await Promise.all(
      [
        this.prisma.folder.findMany({
          where: {
            OR: [
              { ownerId: userId },
              {
                permissions: {
                  some: {
                    userId: userId,
                  },
                },
              },
            ],
          },
          include: {
            permissions: {
              where: { userId: userId },
            },
          },
          take: foldersLimit,
          skip: (foldersPage - 1) * foldersLimit,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.folder.count({
          where: {
            OR: [
              { ownerId: userId },
              {
                permissions: {
                  some: {
                    userId: userId,
                  },
                },
              },
            ],
          },
        }),
        this.prisma.file.findMany({
          where: {
            OR: [
              { ownerId: userId },
              {
                permissions: {
                  some: {
                    userId: userId,
                  },
                },
              },
            ],
          },
          include: {
            permissions: {
              where: { userId: userId },
            },
          },
          take: filesLimit,
          skip: (filesPage - 1) * filesLimit,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.file.count({
          where: {
            OR: [
              { ownerId: userId },
              {
                permissions: {
                  some: {
                    userId: userId,
                  },
                },
              },
            ],
          },
        }),
        this.getLibraryStats(userId),
      ]
    );

    // Transform folders to include user role information
    const foldersWithRole: IFolderWithUserRole[] = folders.map((folder) => {
      const isOwner = folder.ownerId === userId;
      const userPermission = folder.permissions?.[0];
      const userRole = isOwner ? null : userPermission?.role || null;

      return {
        ...folder,
        userRole,
        isOwner,
        canEdit: isOwner || userRole === PermissionRole.EDITOR,
        canDelete: isOwner,
        canShare: isOwner,
      } as IFolderWithUserRole;
    });

    // Transform files to include user role information
    const filesWithRole: IFileWithUserRole[] = files.map((file) => {
      const isOwner = file.ownerId === userId;
      const userPermission = file.permissions?.[0];
      const userRole = isOwner ? null : userPermission?.role || null;

      return {
        ...this.serializeFile(file),
        userRole,
        isOwner,
        canEdit: isOwner || userRole === PermissionRole.EDITOR,
        canDelete: isOwner,
        canShare: isOwner,
        canDownload: true, // All users with access can download
      } as IFileWithUserRole;
    });

    return {
      folders: {
        data: foldersWithRole,
        meta: {
          page: foldersPage,
          limit: foldersLimit,
          total: foldersTotal,
          totalPages: Math.ceil(foldersTotal / foldersLimit),
        },
      },
      files: {
        data: filesWithRole,
        meta: {
          page: filesPage,
          limit: filesLimit,
          total: filesTotal,
          totalPages: Math.ceil(filesTotal / filesLimit),
        },
      },
      stats,
    };
  }

  async getLibraryStats(userId: string): Promise<ILibraryStats> {
    const [
      totalFolders,
      totalFiles,
      publicFolders,
      publicFiles,
      totalSizeResult,
    ] = await Promise.all([
      this.prisma.folder.count({ where: { ownerId: userId } }),
      this.prisma.file.count({ where: { ownerId: userId } }),
      this.prisma.folder.count({
        where: { ownerId: userId, isPublic: true },
      }),
      this.prisma.file.count({ where: { ownerId: userId, isPublic: true } }),
      this.prisma.file.aggregate({
        where: { ownerId: userId },
        _sum: { size: true },
      }),
    ]);

    return {
      totalFolders,
      totalFiles,
      totalSize: Number(totalSizeResult._sum.size || 0),
      publicFolders,
      publicFiles,
    };
  }

  // Get public folder content by publicUrl
  async getPublicFolderContent(
    publicUrl: string,
    query: FolderContentQueryDto
  ): Promise<IFolderContentResponse> {
    // Find folder by publicUrl
    const folder = await this.prisma.folder.findFirst({
      where: {
        publicUrl: `public/${publicUrl}`,
        isPublic: true,
      },
    });

    if (!folder) {
      throw new NotFoundException("Public folder not found");
    }

    // Get breadcrumbs
    const breadcrumbs = await this.getFolderBreadcrumbs(folder.id);

    // Get path
    const path = "/" + breadcrumbs.map((b) => b.name).join("/");

    // Build sort configuration
    const sortBy = query.sortBy || "order";
    const sortOrder = query.sortOrder || "asc";

    // Get subfolders
    const subfolders = await this.prisma.folder.findMany({
      where: {
        parentId: folder.id,
        isPublic: true,
      },
      orderBy: { [sortBy]: sortOrder },
      take: query.limit,
      skip: query.page ? (query.page - 1) * (query.limit || 20) : 0,
    });

    // Get files
    const files = await this.prisma.file.findMany({
      where: {
        folderId: folder.id,
        isPublic: true,
      },
      orderBy: { [sortBy === "name" ? "name" : sortBy]: sortOrder },
      take: query.limit,
      skip: query.page ? (query.page - 1) * (query.limit || 20) : 0,
    });

    const folderWithRole: IFolderWithUserRole = {
      ...folder,
      userRole: null,
      isOwner: false,
      canEdit: false,
      canDelete: false,
      canShare: false,
    } as IFolderWithUserRole;

    const subfoldersWithRole: IFolderWithUserRole[] = subfolders.map(
      (subfolder) =>
        ({
          ...subfolder,
          userRole: null,
          isOwner: false,
          canEdit: false,
          canDelete: false,
          canShare: false,
        } as IFolderWithUserRole)
    );

    const filesWithRole: IFileWithUserRole[] = files.map(
      (file) =>
        ({
          ...this.serializeFile(file),
          userRole: null,
          isOwner: false,
          canEdit: false,
          canDelete: false,
          canShare: false,
          canDownload: true,
        } as IFileWithUserRole)
    );

    return {
      folder: folderWithRole,
      breadcrumbs,
      path,
      subfolders: subfoldersWithRole,
      files: filesWithRole,
      pagination: {
        totalSubfolders: subfolders.length,
        totalFiles: files.length,
      },
    };
  }

  // Get public file by publicUrl
  async getPublicFile(publicUrl: string): Promise<IFile> {
    const file = await this.prisma.file.findFirst({
      where: {
        publicUrl: `public/${publicUrl}`,
        isPublic: true,
      },
    });

    if (!file) {
      throw new NotFoundException("Public file not found");
    }

    return this.serializeFile(file);
  }

  // Get public file download info
  async getPublicFileDownloadInfo(
    publicUrl: string
  ): Promise<IFileDownloadResponse> {
    const file = await this.getPublicFile(publicUrl);

    // Generate download URL (in real app, you might want to generate signed URLs)
    const downloadUrl = `/api/library/public/${publicUrl}/download`;

    return {
      url: downloadUrl,
      fileName: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
    };
  }

  //Check if a resource (folder or file) is public by publicUrl
  async checkPublicResource(
    publicUrl: string
  ): Promise<{ type: "folder" | "file"; resource: IFolder | IFile }> {
    // Try to find folder first
    const folder = await this.prisma.folder.findFirst({
      where: {
        publicUrl: `public/${publicUrl}`,
        isPublic: true,
      },
    });

    if (folder) {
      return { type: "folder", resource: folder as IFolder };
    }

    // Try to find file
    const file = await this.prisma.file.findFirst({
      where: {
        publicUrl: `public/${publicUrl}`,
        isPublic: true,
      },
    });

    if (file) {
      return { type: "file", resource: this.serializeFile(file) };
    }

    throw new NotFoundException("Public resource not found");
  }

  private async getFolderBreadcrumbs(
    folderId: string
  ): Promise<IFolderBreadcrumb[]> {
    const breadcrumbs: IFolderBreadcrumb[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: currentId },
      });

      if (!folder) break;

      breadcrumbs.unshift({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
      });

      currentId = folder.parentId;
    }

    return breadcrumbs;
  }

  private async checkCircularDependency(
    folderId: string,
    targetParentId: string
  ): Promise<void> {
    let currentId: string | null = targetParentId;

    while (currentId) {
      if (currentId === folderId) {
        throw new BadRequestException(
          "Cannot move folder: circular dependency detected"
        );
      }

      const folder = await this.prisma.folder.findUnique({
        where: { id: currentId },
      });

      if (!folder) break;
      currentId = folder.parentId;
    }
  }

  private async checkFolderAccess(
    folder: Folder,
    userId: string
  ): Promise<void> {
    if (folder.ownerId !== userId && !folder.isPublic) {
      throw new ForbiddenException("Access denied to this folder");
    }
  }

  private async checkFileAccess(file: File, userId: string): Promise<void> {
    if (file.ownerId !== userId && !file.isPublic) {
      throw new ForbiddenException("Access denied to this file");
    }
  }

  private async deleteFileFromDisk(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file from disk: ${filePath}`, error);
      // No throw so can delte from db
    }
  }

  private async copyFileOnDisk(sourceFilePath: string): Promise<string> {
    const ext = path.extname(sourceFilePath);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const newFileName = `${timestamp}-${random}${ext}`;
    const newFilePath = path.join(this.UPLOAD_DIR, newFileName);

    await fs.copyFile(sourceFilePath, newFilePath);

    return newFilePath;
  }

  private serializeFile(file: File): IFile {
    return {
      ...file,
      size: file.size.toString(), // BigInt to string for JSON serialization
    } as IFile;
  }
}
