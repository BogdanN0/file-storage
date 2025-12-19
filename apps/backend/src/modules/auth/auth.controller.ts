import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto, RefreshTokenDto, LogoutDto } from "./auth.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import {
  IRegisterApiResponse,
  ILoginApiResponse,
  IRefreshTokenApiResponse,
  IMeApiResponse,
  ILogoutApiResponse,
} from "@monorepo/shared";
import { getClientIp } from "../../common/utils/ip.utils";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
  ) {
    // Access Token - 15m
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  }

  @Post("register")
  @HttpCode(201)
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({
    status: 400,
    description: "Email already exists or invalid data",
  })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ): Promise<IRegisterApiResponse> {
    const userAgent = req.headers["user-agent"];
    const ipAddress = getClientIp(req);

    const result = await this.authService.register(dto, {
      userAgent,
      ipAddress,
    });

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      success: true,
      data: {
        user: result.user,

        accessToken: "",
        refreshToken: "",
        expiresIn: result.expiresIn,
      },
    };
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 400, description: "Invalid credentials" })
  async login(
    @Body() dto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ): Promise<ILoginApiResponse> {
    const userAgent = req.headers["user-agent"];
    const ipAddress = getClientIp(req);

    const tokens = await this.authService.login(dto, { userAgent, ipAddress });

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      success: true,
      data: {
        accessToken: "",
        refreshToken: "",
        expiresIn: tokens.expiresIn,
      },
    };
  }

  @Post("refresh")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ): Promise<IRefreshTokenApiResponse> {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token");
    }

    const tokens = await this.authService.refresh({ refreshToken });

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      success: true,
      data: {
        accessToken: "",
        refreshToken: "",
        expiresIn: tokens.expiresIn,
      },
    };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Get current user info" })
  @ApiResponse({ status: 200, description: "User info retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getMe(@Req() request: any): Promise<IMeApiResponse> {
    const user = await this.authService.getMe(request.userId);

    return { success: true, data: { user } };
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout (revoke refresh token)" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  @ApiResponse({ status: 400, description: "Invalid refresh token" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(
    @Req() request: any,
    @Res({ passthrough: true }) res: Response
  ): Promise<ILogoutApiResponse> {
    const refreshToken = request.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(request.userId, { refreshToken });
    }

    this.clearAuthCookies(res);

    return { success: true, data: { revoked: true } };
  }
}
