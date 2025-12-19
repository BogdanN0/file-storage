import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PermissionRole } from "@prisma/client";

@Injectable()
export class FolderOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId; // from AuthGuard
    const folderId = request.params.id;

    if (!folderId) {
      throw new NotFoundException("Folder ID not provided");
    }

    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    console.log({ folder });

    if (folder.ownerId !== userId) {
      throw new ForbiddenException("You don't own this folder");
    }

    // Attach folder to request for controller use (optional)
    request.folder = folder;

    return true;
  }
}

@Injectable()
export class FolderAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId; // from AuthGuard
    const folderId = request.params.id;

    if (!folderId) {
      throw new NotFoundException("Folder ID not provided");
    }

    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        permissions: {
          where: { userId },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    // Check access: owner, public, or has permission
    const hasAccess =
      folder.ownerId === userId ||
      folder.isPublic ||
      folder.permissions.filter(({ role }) => role !== PermissionRole.VIEWER)
        .length > 0;

    if (!hasAccess) {
      throw new ForbiddenException("Access denied to this folder");
    }

    // Attach folder to request for controller use (optional)
    request.folder = folder;

    return true;
  }
}

@Injectable()
export class FileOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId; // from AuthGuard
    const fileId = request.params.id;

    if (!fileId) {
      throw new NotFoundException("File ID not provided");
    }

    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    if (file.ownerId !== userId) {
      throw new ForbiddenException("You don't own this file");
    }

    // Attach file to request for controller use (optional)
    request.file = file;

    return true;
  }
}

@Injectable()
export class FileAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId; // from AuthGuard
    const fileId = request.params.id;

    if (!fileId) {
      throw new NotFoundException("File ID not provided");
    }

    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        permissions: {
          where: { userId },
        },
      },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    // Check access: owner, public, or has permission
    const hasAccess =
      file.ownerId === userId ||
      file.isPublic ||
      file.permissions.filter(({ role }) => role !== PermissionRole.VIEWER)
        .length > 0;

    if (!hasAccess) {
      throw new ForbiddenException("Access denied to this file");
    }

    // Attach file to request for controller use (optional)
    request.file = file;

    return true;
  }
}
