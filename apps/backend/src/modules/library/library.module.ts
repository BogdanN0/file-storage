import { Module } from "@nestjs/common";
import { LibraryController } from "./library.controller";
import { LibraryService } from "./library.service";
import { PrismaService } from "../../prisma.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { JwtModule } from "@nestjs/jwt";
import { MulterModule } from "@nestjs/platform-express";

@Module({
  imports: [
    JwtModule.register({}),
    MulterModule.register({
      dest: process.env.UPLOAD_DIR || "./uploads",
    }),
  ],
  controllers: [LibraryController],
  providers: [LibraryService, PrismaService, AuthGuard],
  exports: [LibraryService],
})
export class LibraryModule {}
