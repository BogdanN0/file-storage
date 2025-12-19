import { IApiResponse } from "../common/common.types";

// Login dto
export interface ILoginInput {
  email: string;
  password: string;
}

// Registration dto
export interface IRegisterInput {
  name: string;
  email: string;
  password: string;
}

// Refresh token dto
export interface IRefreshTokenInput {
  refreshToken: string;
}

// JWT token pair dto
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

// JWT payload dto
export interface IJwtPayload {
  sub: string; // user id
  sessionId?: string;
  iat?: number; // issued at
  exp?: number; // expiration time
}

// User data returned in auth responses (without password)
export interface IAuthUser {
  id: string;
  email: string;
  name: string;
  createdAt?: Date | string;
}

// Login response
export interface ILoginResponse extends IAuthTokens {}

// Registration response (includes user data + tokens)
export interface IRegisterResponse {
  user: IAuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Refresh token response (new tokens)
export interface IRefreshTokenResponse extends IAuthTokens {}

// Current user info response (from /me endpoint)
export interface IMeResponse {
  id: string;
  email: string;
  name: string;
  createdAt: Date | string;
}

// Login API response
export interface ILoginApiResponse extends IApiResponse<ILoginResponse> {}

// Register API response
export interface IRegisterApiResponse extends IApiResponse<IRegisterResponse> {}

// Refresh API response
export interface IRefreshTokenApiResponse
  extends IApiResponse<IRefreshTokenResponse> {}

// Me API response
export interface IMeApiResponse extends IApiResponse<{ user: IMeResponse }> {}

// Authentication error
export interface IAuthError {
  statusCode: number;
  message: string;
  error: string;
}

// Common auth error messages
export type AuthErrorMessage =
  | "Invalid email or password"
  | "Email already exists"
  | "Invalid refresh token"
  | "Refresh token is invalid or revoked"
  | "Refresh token has expired"
  | "Unauthorized"
  | "User not found";

// Token expiration times (in seconds)
export interface ITokenExpiration {
  accessToken: number; // 900 (15 minutes)
  refreshToken: number; // 604800 (7 days)
}

// JWT secrets configuration
export interface IJwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiration: string; // '15m'
  refreshExpiration: string; // '7d'
}

// Logout dto
export interface ILogoutInput {
  refreshToken: string;
}

// Logout response
export interface ILogoutResponse {
  revoked: boolean;
}

export interface ILogoutApiResponse extends IApiResponse<ILogoutResponse> {}

// Session metadata (device information)
export interface ISessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}
