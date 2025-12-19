import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { PrismaService } from "../../prisma.service";
import { UserController } from "./user.controller";
import { AuthGuard } from "../../common/guards/auth.guard";
import { UserAccountOwnershipGuard } from "../../common/guards/userAccountOwnership.guard";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [JwtModule.register({})],
  controllers: [UserController],
  providers: [PrismaService, UserService, AuthGuard, UserAccountOwnershipGuard],
  exports: [UserService],
})
export class UserModule {}
