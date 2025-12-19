import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AUTH_ERRORS,
  LogoutDto,
  SessionMetadata,
} from "./auth.dto";
import {
  IRegisterResponse,
  IAuthTokens,
  IMeResponse,
  IJwtPayload,
  ILogoutResponse,
} from "@monorepo/shared";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  // Register a new user and return tokens
  async register(
    dto: RegisterDto,
    sessionMetadata?: SessionMetadata
  ): Promise<IRegisterResponse> {
    const user = await this.userService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    const tokens = await this.generateTokens(user.id, sessionMetadata);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  // Login user with email and password
  async login(
    dto: LoginDto,
    sessionMetadata?: SessionMetadata
  ): Promise<IAuthTokens> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await this.userService.verifyPassword(
      user,
      dto.password
    );
    if (!isPasswordValid) {
      throw new BadRequestException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    return this.generateTokens(user.id, sessionMetadata);
  }

  // Refresh access token using refresh token
  async refresh(dto: RefreshTokenDto): Promise<IAuthTokens> {
    try {
      const payload = this.jwtService.verify<IJwtPayload>(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const refreshTokenRecord =
        await this.userService.prisma.refreshToken.findUnique({
          where: { token: dto.refreshToken },
        });

      if (!refreshTokenRecord || refreshTokenRecord.isRevoked) {
        throw new UnauthorizedException(AUTH_ERRORS.REFRESH_TOKEN_REVOKED);
      }

      if (new Date() > refreshTokenRecord.expiresAt) {
        throw new UnauthorizedException(AUTH_ERRORS.REFRESH_TOKEN_EXPIRED);
      }

      // Update last lastActivity
      if (refreshTokenRecord.sessionId) {
        await this.userService.prisma.session.update({
          where: { id: refreshTokenRecord.sessionId },
          data: { lastActivity: new Date() },
        });

        // Generaet tokens with same  sessionId
        const accessToken = this.jwtService.sign(
          {
            sub: payload.sub,
            sessionId: refreshTokenRecord.sessionId,
          } as IJwtPayload,
          {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: "15m",
          }
        );

        const newRefreshTokenValue = this.jwtService.sign(
          {
            sub: payload.sub,
            sessionId: refreshTokenRecord.sessionId,
          } as IJwtPayload,
          {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: "7d",
          }
        );

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Delete old refresh token
        await this.userService.prisma.refreshToken.delete({
          where: { token: dto.refreshToken },
        });

        // New refresh token with new session
        await this.userService.prisma.refreshToken.create({
          data: {
            token: newRefreshTokenValue,
            userId: payload.sub,
            expiresAt,
            sessionId: refreshTokenRecord.sessionId,
          },
        });

        return {
          accessToken,
          refreshToken: newRefreshTokenValue,
          expiresIn: 900,
        };
      }

      return this.generateTokens(payload.sub);
    } catch (error) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }
  }

  // Get current user information
  async getMe(userId: string): Promise<IMeResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }

  // Generate access and refresh tokens for user
  private async generateTokens(
    userId: string,
    sessionMetadata?: SessionMetadata
  ): Promise<IAuthTokens> {
    let session;

    // Seach for existing session via userAgent instead of new
    if (sessionMetadata?.userAgent) {
      session = await this.userService.prisma.session.findFirst({
        where: {
          userId,
          userAgent: sessionMetadata.userAgent,
        },
      });
    }

    if (session) {
      session = await this.userService.prisma.session.update({
        where: { id: session.id },
        data: {
          lastActivity: new Date(),
          ipAddress: sessionMetadata?.ipAddress, // if new IP - update
        },
      });

      await this.userService.prisma.refreshToken.deleteMany({
        where: { sessionId: session.id },
      });
    } else {
      session = await this.userService.prisma.session.create({
        data: {
          userId,
          userAgent: sessionMetadata?.userAgent,
          ipAddress: sessionMetadata?.ipAddress,
        },
      });
    }

    // БАГ FIX 2: Add sessionId for validation
    const accessToken = this.jwtService.sign(
      { sub: userId, sessionId: session.id } as IJwtPayload,
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: "15m",
      }
    );

    const refreshTokenValue = this.jwtService.sign(
      { sub: userId, sessionId: session.id } as IJwtPayload,
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: "7d",
      }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // New RefreshToken with Session
    await this.userService.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt,
        sessionId: session.id,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async logout(userId: string, dto: LogoutDto): Promise<ILogoutResponse> {
    const tokenRecord = await this.userService.findRefreshToken(
      dto.refreshToken
    );

    if (!tokenRecord) {
      throw new BadRequestException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }

    if (tokenRecord.userId !== userId) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }

    // Delte Session, if token bind to session
    if (tokenRecord.sessionId) {
      await this.userService.prisma.session.delete({
        where: { id: tokenRecord.sessionId },
      });
    } else {
      // Revoke if not
      if (!tokenRecord.isRevoked) {
        await this.userService.revokeRefreshToken(dto.refreshToken);
      }
    }

    return { revoked: true };
  }
}
