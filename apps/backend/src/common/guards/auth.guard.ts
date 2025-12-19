import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma.service";
import { IJwtPayload } from "@monorepo/shared";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract token from Authorization header or cookies
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException("No authentication token provided");
    }

    try {
      // Verify and decode JWT
      const payload = this.jwtService.verify<IJwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      // Check not existing sessions JWT payload
      if (payload.sessionId) {
        const session = await this.prisma.session.findUnique({
          where: { id: payload.sessionId },
        });

        // If deleted - not valid
        if (!session) {
          throw new UnauthorizedException(
            "Session has been terminated. Please login again."
          );
        }

        await this.prisma.session.update({
          where: { id: payload.sessionId },
          data: { lastActivity: new Date() },
        });
      }

      // Attach user ID and session ID to request
      request.userId = payload.sub;
      request.sessionId = payload.sessionId;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private extractTokenFromRequest(request: any): string | undefined {
    // Try Authorization header first
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    // Fall back to cookies
    if (request.cookies && request.cookies.accessToken) {
      return request.cookies.accessToken;
    }

    return undefined;
  }
}
