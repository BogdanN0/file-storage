import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  StreamableFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { Response } from "express";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { LibraryService } from "./library.service";
import { AuthGuard } from "../../common/guards/auth.guard";
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
  IGetFolderApiResponse,
  IGetFolderContentApiResponse,
  ICreateFolderApiResponse,
  IUpdateFolderApiResponse,
  IDeleteFolderApiResponse,
  ICloneFolderApiResponse,
  IGetFileApiResponse,
  IUploadFileApiResponse,
  IUpdateFileApiResponse,
  IDeleteFileApiResponse,
  ICloneFileApiResponse,
  ISearchLibraryApiResponse,
  IGetUserLibraryApiResponse,
  IDownloadFileApiResponse,
  ICreateFileInput,
  IApiResponse,
  IFile,
  IFolder,
} from "@monorepo/shared";
import { diskStorage } from "multer";
import { extname } from "path";
import {
  FileAccessGuard,
  FileOwnershipGuard,
  FolderAccessGuard,
  FolderOwnershipGuard,
} from "../../common/guards/library.guards";

@ApiTags("library")
@ApiBearerAuth()
@Controller("library")
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Get()
  @ApiOperation({
    summary: "Get all user's folders and files with pagination",
  })
  @ApiResponse({
    status: 200,
    description: "User library retrieved successfully",
  })
  @UseGuards(AuthGuard)
  async getUserLibrary(
    @Query() query: UserLibraryQueryDto,
    @Req() request: any
  ): Promise<IGetUserLibraryApiResponse> {
    console.log({
      query,
    });

    const data = await this.libraryService.getUserLibrary(
      query,
      request.userId
    );

    return {
      success: true,
      data,
    };
  }

  @Get("search")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Search folders and files" })
  @ApiResponse({ status: 200, description: "Search results retrieved" })
  async searchLibrary(
    @Query() query: SearchLibraryDto,
    @Req() request: any
  ): Promise<ISearchLibraryApiResponse> {
    const data = await this.libraryService.searchLibrary(query, request.userId);

    return {
      success: true,
      data,
    };
  }

  @Post("folders")
  @HttpCode(201)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Create a new folder" })
  @ApiResponse({ status: 201, description: "Folder created successfully" })
  @ApiResponse({ status: 400, description: "Invalid data" })
  @ApiResponse({ status: 404, description: "Parent folder not found" })
  async createFolder(
    @Body() dto: CreateFolderDto,
    @Req() request: any
  ): Promise<ICreateFolderApiResponse> {
    const folder = await this.libraryService.createFolder(dto, request.userId);

    return {
      success: true,
      data: folder,
    };
  }

  @Get("folders/:id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Get folder by ID" })
  @ApiResponse({ status: 200, description: "Folder retrieved successfully" })
  @ApiResponse({ status: 404, description: "Folder not found" })
  @ApiResponse({ status: 403, description: "Access denied" })
  async getFolder(
    @Param("id") id: string,
    @Req() request: any
  ): Promise<IGetFolderApiResponse> {
    const folder = await this.libraryService.getFolderById(id, request.userId);

    return {
      success: true,
      data: folder,
    };
  }

  @Get("folders/:id/content")
  @UseGuards(AuthGuard, FolderAccessGuard)
  @ApiOperation({ summary: "Get folder content with breadcrumbs and path" })
  @ApiResponse({
    status: 200,
    description: "Folder content retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Folder not found" })
  async getFolderContent(
    @Param("id") id: string,
    @Query() query: FolderContentQueryDto,
    @Req() request: any
  ): Promise<IGetFolderContentApiResponse> {
    const data = await this.libraryService.getFolderContent(
      id,
      query,
      request.userId
    );

    return {
      success: true,
      data,
    };
  }

  @Patch("folders/:id")
  @UseGuards(AuthGuard, FolderAccessGuard)
  @ApiOperation({ summary: "Update folder" })
  @ApiResponse({ status: 200, description: "Folder updated successfully" })
  @ApiResponse({ status: 404, description: "Folder not found" })
  @ApiResponse({ status: 403, description: "Access denied" })
  async updateFolder(
    @Param("id") id: string,
    @Body() dto: UpdateFolderDto,
    @Req() request: any
  ): Promise<IUpdateFolderApiResponse> {
    const folder = await this.libraryService.updateFolder(
      id,
      dto,
      request.userId
    );

    return {
      success: true,
      data: folder,
    };
  }

  @Patch("folders/:id/move")
  @UseGuards(AuthGuard, FolderAccessGuard)
  @ApiOperation({ summary: "Move folder to another parent" })
  @ApiResponse({ status: 200, description: "Folder moved successfully" })
  @ApiResponse({ status: 404, description: "Folder not found" })
  @ApiResponse({ status: 400, description: "Circular dependency detected" })
  async moveFolder(
    @Param("id") id: string,
    @Body() dto: MoveFolderDto,
    @Req() request: any
  ): Promise<IUpdateFolderApiResponse> {
    const folder = await this.libraryService.moveFolder(
      id,
      dto,
      request.userId
    );

    return {
      success: true,
      data: folder,
    };
  }

  @Post("folders/:id/clone")
  @HttpCode(201)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Clone folder with all contents" })
  @ApiResponse({ status: 201, description: "Folder cloned successfully" })
  @ApiResponse({ status: 404, description: "Folder not found" })
  async cloneFolder(
    @Param("id") id: string,
    @Body() dto: CloneFolderDto,
    @Req() request: any
  ): Promise<ICloneFolderApiResponse> {
    const data = await this.libraryService.cloneFolder(id, dto, request.userId);

    return {
      success: true,
      data,
    };
  }

  @Delete("folders/:id")
  @HttpCode(200)
  @UseGuards(AuthGuard, FolderOwnershipGuard)
  @ApiOperation({ summary: "Delete folder" })
  @ApiResponse({ status: 200, description: "Folder deleted successfully" })
  @ApiResponse({ status: 404, description: "Folder not found" })
  @ApiResponse({ status: 403, description: "Access denied" })
  async deleteFolder(
    @Param("id") id: string,
    @Query("cascade") cascade: string,
    @Req() request: any
  ): Promise<IDeleteFolderApiResponse> {
    const cascadeDelete = cascade === "true";
    const data = await this.libraryService.deleteFolder(
      id,
      request.userId,
      cascadeDelete
    );

    return {
      success: true,
      data,
    };
  }

  @Post("files/upload")
  @HttpCode(201)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Upload a file" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid file or data" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR || "./uploads",
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    })
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: UploadFileMetadataDto,
    @Req() request: any
  ): Promise<IUploadFileApiResponse> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const fileData: ICreateFileInput = {
      name: metadata.name || file.originalname,
      originalName: file.originalname,
      description: metadata.description,
      folderId: metadata.folderId,
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
      extension: extname(file.originalname).substring(1),
      isPublic: metadata.isPublic ?? false,
      order: metadata.order ?? 0,
    };

    const uploadedFile = await this.libraryService.createFile(
      fileData,
      request.userId
    );

    return {
      success: true,
      data: {
        file: uploadedFile,
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  @Get("files/:id")
  @UseGuards(AuthGuard, FileAccessGuard)
  @ApiOperation({ summary: "Get file by ID" })
  @ApiResponse({ status: 200, description: "File retrieved successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  @ApiResponse({ status: 403, description: "Access denied" })
  async getFile(
    @Param("id") id: string,
    @Req() request: any
  ): Promise<IGetFileApiResponse> {
    const file = await this.libraryService.getFileById(id, request.userId);

    return {
      success: true,
      data: file,
    };
  }

  @Patch("files/:id")
  @UseGuards(AuthGuard, FileAccessGuard)
  @ApiOperation({ summary: "Update file metadata" })
  @ApiResponse({ status: 200, description: "File updated successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  @ApiResponse({ status: 403, description: "Access denied" })
  async updateFile(
    @Param("id") id: string,
    @Body() dto: UpdateFileDto,
    @Req() request: any
  ): Promise<IUpdateFileApiResponse> {
    const file = await this.libraryService.updateFile(id, dto, request.userId);

    return {
      success: true,
      data: file,
    };
  }

  @Patch("files/:id/move")
  @UseGuards(AuthGuard, FileAccessGuard)
  @ApiOperation({ summary: "Move file to another folder" })
  @ApiResponse({ status: 200, description: "File moved successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  async moveFile(
    @Param("id") id: string,
    @Body() dto: MoveFileDto,
    @Req() request: any
  ): Promise<IUpdateFileApiResponse> {
    const file = await this.libraryService.moveFile(id, dto, request.userId);

    return {
      success: true,
      data: file,
    };
  }

  @Post("files/:id/clone")
  @HttpCode(201)
  @UseGuards(AuthGuard, FileAccessGuard)
  @ApiOperation({ summary: "Clone file" })
  @ApiResponse({ status: 201, description: "File cloned successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  async cloneFile(
    @Param("id") id: string,
    @Body() dto: CloneFileDto,
    @Req() request: any
  ): Promise<ICloneFileApiResponse> {
    const data = await this.libraryService.cloneFile(id, dto, request.userId);

    return {
      success: true,
      data,
    };
  }

  @Delete("files/:id")
  @HttpCode(200)
  @UseGuards(AuthGuard, FileOwnershipGuard)
  @ApiOperation({ summary: "Delete file" })
  @ApiResponse({ status: 200, description: "File deleted successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  @ApiResponse({ status: 403, description: "Access denied" })
  async deleteFile(
    @Param("id") id: string,
    @Req() request: any
  ): Promise<IDeleteFileApiResponse> {
    const data = await this.libraryService.deleteFile(id, request.userId);

    return {
      success: true,
      data,
    };
  }

  @Get("files/:id/download")
  @ApiOperation({ summary: "Get file download URL" })
  @ApiResponse({
    status: 200,
    description: "Download URL generated successfully",
  })
  @ApiResponse({ status: 404, description: "File not found" })
  async getFileDownloadUrl(
    @Param("id") id: string,
    @Req() request: any
  ): Promise<IDownloadFileApiResponse> {
    const data = await this.libraryService.getFileDownloadInfo(
      id,
      request.userId
    );

    return {
      success: true,
      data,
    };
  }

  @Get("files/:id/download/direct")
  @ApiOperation({ summary: "Download file directly" })
  @ApiResponse({ status: 200, description: "File downloaded successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  async downloadFileDirect(
    @Param("id") id: string,
    @Req() request: any,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    const file = await this.libraryService.getFileById(id, request.userId);
    console.log({
      file,
    });

    // Check existing flies
    try {
      await stat(file.filePath);
    } catch (error) {
      throw new BadRequestException("File not found on disk");
    }

    const stream = createReadStream(file.filePath);
    console.log("here");

    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.originalName}"`,
      "Content-Length": file.size.toString(),
    });

    return new StreamableFile(stream);
  }

  @Get("public/:publicUrl/check")
  @ApiOperation({
    summary: "Check if resource is public and get its type (folder/file)",
  })
  @ApiResponse({
    status: 200,
    description: "Resource type determined",
  })
  @ApiResponse({ status: 404, description: "Public resource not found" })
  async checkPublicResource(
    @Param("publicUrl") publicUrl: string
  ): Promise<
    IApiResponse<{ type: "folder" | "file"; resource: IFolder | IFile }>
  > {
    const data = await this.libraryService.checkPublicResource(publicUrl);

    return {
      success: true,
      data,
    };
  }

  @Get("public/:publicUrl/folder")
  @ApiOperation({ summary: "Get public folder content (no auth required)" })
  @ApiResponse({
    status: 200,
    description: "Public folder content retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Public folder not found" })
  async getPublicFolderContent(
    @Param("publicUrl") publicUrl: string,
    @Query() query: FolderContentQueryDto
  ): Promise<IGetFolderContentApiResponse> {
    const data = await this.libraryService.getPublicFolderContent(
      publicUrl,
      query
    );

    return {
      success: true,
      data,
    };
  }

  @Get("public/:publicUrl/file")
  @ApiOperation({ summary: "Get public file info (no auth required)" })
  @ApiResponse({ status: 200, description: "Public file retrieved" })
  @ApiResponse({ status: 404, description: "Public file not found" })
  async getPublicFile(
    @Param("publicUrl") publicUrl: string
  ): Promise<IGetFileApiResponse> {
    const file = await this.libraryService.getPublicFile(publicUrl);

    return {
      success: true,
      data: file,
    };
  }

  @Get("public/:publicUrl/download")
  @ApiOperation({ summary: "Download public file (no auth required)" })
  @ApiResponse({
    status: 200,
    description: "File downloaded successfully",
  })
  @ApiResponse({ status: 404, description: "Public file not found" })
  async downloadPublicFile(
    @Param("publicUrl") publicUrl: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    const file = await this.libraryService.getPublicFile(publicUrl);

    // Check if file exists on disk
    try {
      await stat(file.filePath);
    } catch (error) {
      throw new BadRequestException("File not found on disk");
    }

    const stream = createReadStream(file.filePath);

    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.originalName}"`,
      "Content-Length": file.size.toString(),
    });

    return new StreamableFile(stream);
  }

  @Get("public/:publicUrl/download-info")
  @ApiOperation({
    summary: "Get public file download URL (no auth required)",
  })
  @ApiResponse({
    status: 200,
    description: "Download URL generated successfully",
  })
  @ApiResponse({ status: 404, description: "Public file not found" })
  async getPublicFileDownloadInfo(
    @Param("publicUrl") publicUrl: string
  ): Promise<IDownloadFileApiResponse> {
    const data = await this.libraryService.getPublicFileDownloadInfo(publicUrl);

    return {
      success: true,
      data,
    };
  }
}
