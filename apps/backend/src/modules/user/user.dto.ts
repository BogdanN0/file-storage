import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsUUID,
  IsIP,
  IsDateString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import {
  ICreateUserInput,
  IUpdateUserInput,
  ICreateSessionInput,
  ICreateRefreshTokenInput,
  IUsersWithAccessPaginationQueryInput,
  IUserPublic,
  ISearchUsersInput,
  ISearchUsersResponse,
  ISearchUsersApiResponse,
} from "@monorepo/shared";
import { Type } from "class-transformer";

export class CreateUserDto implements ICreateUserInput {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "password123", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateUserDto implements IUpdateUserInput {
  @ApiPropertyOptional({ example: "John Doe" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: "user@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateSessionDto implements ICreateSessionInput {
  @ApiProperty({ example: "d290f1ee-6c54-4b01-90e6-d701748f0851" })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    example: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)…",
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ example: "192.168.1.15" })
  @IsOptional()
  @IsIP()
  ipAddress?: string;
}

export class CreateRefreshTokenDto implements ICreateRefreshTokenInput {
  @ApiProperty({ example: "d290f1ee-6c54-4b01-90e6-d701748f0851" })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Raw refresh token value",
  })
  @IsString()
  token: string;

  @ApiProperty({ example: "2025-02-12T10:20:30.000Z" })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({
    example: "1",
    description: "Session id",
  })
  @IsString()
  sessionId?: string;
}

export class PaginationQueryDto
  implements IUsersWithAccessPaginationQueryInput
{
  @ApiPropertyOptional({
    example: 1,
    description: "Номер страницы (начиная с 1)",
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: "Количество элементов на странице",
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class SearchUsersDto implements ISearchUsersInput {
  @ApiProperty({ example: "john", description: "Search query (email or name)" })
  @IsString()
  @MinLength(1)
  query: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Page number (starts from 1)",
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: "Items per page",
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
