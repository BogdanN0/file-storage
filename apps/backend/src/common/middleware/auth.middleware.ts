import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "@nestjs/jwt";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Guard used instead

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      req.userId = payload.sub;
      next();
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return null;

    return parts[1];
  }
}
