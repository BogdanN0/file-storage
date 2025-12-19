import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";
import {
  ILoginInput,
  IRegisterInput,
  IRefreshTokenInput,
  AuthErrorMessage,
  ILogoutInput,
  ISessionMetadata,
} from "@monorepo/shared";

export class LoginDto implements ILoginInput {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  password: string;
}

export class RegisterDto implements IRegisterInput {
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

export class RefreshTokenDto implements IRefreshTokenInput {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  @IsString()
  refreshToken: string;
}

export const AUTH_ERRORS: Record<string, AuthErrorMessage> = {
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  REFRESH_TOKEN_REVOKED: "Refresh token is invalid or revoked",
  REFRESH_TOKEN_EXPIRED: "Refresh token has expired",
  UNAUTHORIZED: "Unauthorized",
  USER_NOT_FOUND: "User not found",
} as const;

export class LogoutDto implements ILogoutInput {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  @IsString()
  refreshToken: string;
}

// Re-export ISessionMetadata for convenience
export type SessionMetadata = ISessionMetadata;
