import { Module } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { PrismaService } from "../../prisma.service";
import { PermissionController } from "./permission.controller";
import { AuthGuard } from "../../common/guards/auth.guard";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [JwtModule.register({})],
  controllers: [PermissionController],
  providers: [PrismaService, PermissionService, AuthGuard],
  exports: [PermissionService],
})
export class PermissionModule {}
