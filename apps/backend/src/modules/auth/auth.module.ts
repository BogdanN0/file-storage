import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModule } from "../user/user.module";
import { AuthGuard } from "../../common/guards/auth.guard";
import { PrismaService } from "../../prisma.service";

@Module({
  imports: [JwtModule.register({}), UserModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
