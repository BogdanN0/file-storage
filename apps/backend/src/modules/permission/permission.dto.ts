import {
  IsUUID,
  IsEnum,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IGrantFolderPermissionInput,
  IUpdateFolderPermissionInput,
  IGrantFilePermissionInput,
  IUpdateFilePermissionInput,
  IBatchGrantPermissionsInput,
  ICheckPermissionInput,
  PermissionRole,
} from "@monorepo/shared";

export class GrantFolderPermissionDto implements IGrantFolderPermissionInput {
  @ApiProperty({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Folder ID",
  })
  @IsUUID()
  folderId: string;

  @ApiProperty({
    example: "a190f1ee-6c54-4b01-90e6-d701748f0852",
    description: "User ID to grant permission",
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    enum: ["OWNER", "EDITOR", "VIEWER"],
    example: "EDITOR",
    description: "Permission role",
  })
  @IsEnum(["OWNER", "EDITOR", "VIEWER"])
  role: PermissionRole;
}

export class UpdateFolderPermissionDto implements IUpdateFolderPermissionInput {
  @ApiProperty({
    enum: ["OWNER", "EDITOR", "VIEWER"],
    example: "VIEWER",
    description: "New permission role",
  })
  @IsEnum(["OWNER", "EDITOR", "VIEWER"])
  role: PermissionRole;
}

export class BatchGrantFolderPermissionsDto {
  @ApiProperty({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Folder ID",
  })
  @IsUUID()
  folderId: string;

  @ApiProperty({
    type: [String],
    example: [
      "a190f1ee-6c54-4b01-90e6-d701748f0852",
      "b290f1ee-6c54-4b01-90e6-d701748f0853",
    ],
    description: "Array of user IDs",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  userIds: string[];

  @ApiProperty({
    enum: ["OWNER", "EDITOR", "VIEWER"],
    example: "VIEWER",
    description: "Permission role for all users",
  })
  @IsEnum(["OWNER", "EDITOR", "VIEWER"])
  role: PermissionRole;
}

export class BatchGrantMultipleFoldersDto {
  @ApiProperty({
    type: [String],
    example: [
      "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "e390f1ee-6c54-4b01-90e6-d701748f0854",
    ],
    description: "Array of folder IDs",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  folderIds: string[];

  @ApiProperty({
    type: [String],
    example: [
      "a190f1ee-6c54-4b01-90e6-d701748f0852",
      "b290f1ee-6c54-4b01-90e6-d701748f0853",
    ],
    description: "Array of user IDs",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  userIds: string[];

  @ApiProperty({
    enum: ["OWNER", "EDITOR", "VIEWER"],
    example: "VIEWER",
    description: "Permission role for all combinations",
  })
  @IsEnum(["OWNER", "EDITOR", "VIEWER"])
  role: PermissionRole;
}

export class GrantFilePermissionDto implements IGrantFilePermissionInput {
  @ApiProperty({
    example: "f490f1ee-6c54-4b01-90e6-d701748f0855",
    description: "File ID",
  })
  @IsUUID()
  fileId: string;

  @ApiProperty({
    example: "a190f1ee-6c54-4b01-90e6-d701748f0852",
    description: "User ID to grant permission",
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    enum: ["OWNER", "EDITOR", "VIEWER"],
    example: "EDITOR",
    description: "Permission role",
  })
  @IsEnum(["OWNER", "EDITOR", "VIEWER"])
  role: PermissionRole;
}

export class UpdateFilePermissionDto implements IUpdateFilePermissionInput {
  @ApiProperty({
    enum: ["OWNER", "EDITOR", "VIEWER"],
    example: "VIEWER",
    description: "New permission role",
  })
  @IsEnum(["OWNER", "EDITOR", "VIEWER"])
  role: PermissionRole;
}

export class BatchGrantFilePermissionsDto {
  @ApiProperty({
    example: "f490f1ee-6c54-4b01-90e6-d701748f0855",
    description: "File ID",
  })
  @IsUUID()
  fileId: string;

  @ApiProperty({
    type: [String],
    example: [
      "a190f1ee-6c54-4b01-90e6-d701748f0852",
      "b290f1ee-6c54-4b01-90e6-d701748f0853",
    ],
    description: "Array of user IDs",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  userIds: string[];

  @ApiProperty({
    enum: ["OWNER", "EDITOR", "VIEWER"],
    example: "VIEWER",
    description: "Permission role for all users",
  })
  @IsEnum(["OWNER", "EDITOR", "VIEWER"])
  role: PermissionRole;
}

export class BatchGrantMultipleFilesDto {
  @ApiProperty({
    type: [String],
    example: [
      "f490f1ee-6c54-4b01-90e6-d701748f0855",
      "g590f1ee-6c54-4b01-90e6-d701748f0856",
    ],
    description: "Array of file IDs",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  fileIds: string[];

  @ApiProperty({
    type: [String],
    example: [
      "a190f1ee-6c54-4b01-90e6-d701748f0852",
      "b290f1ee-6c54-4b01-90e6-d701748f0853",
    ],
    description: "Array of user IDs",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  userIds: string[];

  @ApiProperty({
    enum: ["OWNER", "EDITOR", "VIEWER"],
    example: "VIEWER",
    description: "Permission role for all combinations",
  })
  @IsEnum(["OWNER", "EDITOR", "VIEWER"])
  role: PermissionRole;
}

export class CheckPermissionDto implements ICheckPermissionInput {
  @ApiProperty({
    example: "a190f1ee-6c54-4b01-90e6-d701748f0852",
    description: "User ID to check permission for",
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "Resource ID (folder or file)",
  })
  @IsUUID()
  resourceId: string;

  @ApiPropertyOptional({
    enum: ["OWNER", "EDITOR", "VIEWER"],
    example: "EDITOR",
    description: "Minimum required role (optional)",
  })
  @IsOptional()
  @IsEnum(["OWNER", "EDITOR", "VIEWER"])
  requiredRole?: PermissionRole;
}
