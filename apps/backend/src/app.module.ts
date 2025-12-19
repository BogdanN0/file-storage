import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { LibraryModule } from "./modules/library/library.module";
import { PermissionModule } from "./modules/permission/permission.module";

@Module({
  imports: [AuthModule, UserModule, LibraryModule, PermissionModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
