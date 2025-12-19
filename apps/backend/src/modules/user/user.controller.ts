import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { UserService } from "./user.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { UserAccountOwnershipGuard } from "../../common/guards/userAccountOwnership.guard";
import {
  IGetUserApiResponse,
  IGetUserSessionsApiResponse,
  IGetUserWithRelationsApiResponse,
  IGetUserStatsApiResponse,
  IDeleteSessionApiResponse,
  IGetUsersWithAccessApiResponse,
  ISearchUsersApiResponse,
} from "@monorepo/shared";
import { SearchUsersDto } from "./user.dto";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("search")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Search users (email or name)" })
  @ApiResponse({ status: 200, description: "Search results retrieved" })
  async searchUsers(
    @Query() query: SearchUsersDto
  ): Promise<ISearchUsersApiResponse> {
    const data = await this.userService.searchUsers(query);

    return {
      success: true,
      data,
    };
  }

  @Get(":id")
  @UseGuards(AuthGuard, UserAccountOwnershipGuard)
  @ApiOperation({ summary: "Get user information" })
  @ApiResponse({ status: 200, description: "User data retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUser(@Param("id") id: string): Promise<IGetUserApiResponse> {
    const data = await this.userService.findByIdOrThrow(id);

    return {
      success: true,
      data,
    };
  }

  @Get(":id/sessions")
  @UseGuards(AuthGuard, UserAccountOwnershipGuard)
  @ApiOperation({ summary: "Get user sessions" })
  @ApiResponse({ status: 200, description: "Sessions retrieved" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserSessions(
    @Param("id") id: string
  ): Promise<IGetUserSessionsApiResponse> {
    const data = await this.userService.findUserSessions(id);

    return {
      success: true,
      data,
    };
  }

  @Get(":id/with-relations")
  @UseGuards(AuthGuard, UserAccountOwnershipGuard)
  @ApiOperation({ summary: "Get user with all related data" })
  @ApiResponse({ status: 200, description: "User with relations retrieved" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserWithRelations(
    @Param("id") id: string
  ): Promise<IGetUserWithRelationsApiResponse> {
    const data = await this.userService.getUserWithRelations(id);

    return {
      success: true,
      data,
    };
  }

  @Get(":id/stats")
  @UseGuards(AuthGuard, UserAccountOwnershipGuard)
  @ApiOperation({ summary: "Get user statistics" })
  @ApiResponse({ status: 200, description: "User statistics retrieved" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserStats(
    @Param("id") id: string
  ): Promise<IGetUserStatsApiResponse> {
    const data = await this.userService.getUserStats(id);

    return {
      success: true,
      data,
    };
  }

  @Delete(":id/sessions/:sessionId")
  @UseGuards(AuthGuard, UserAccountOwnershipGuard)
  @HttpCode(200)
  @ApiOperation({ summary: "Delete a session" })
  @ApiResponse({ status: 200, description: "Session deleted" })
  @ApiResponse({ status: 404, description: "Session not found" })
  async deleteSession(
    @Param("id") id: string,
    @Param("sessionId") sessionId: string
  ): Promise<IDeleteSessionApiResponse> {
    await this.userService.deleteSessionForUser(id, sessionId);

    return {
      success: true,
      data: { deleted: true },
    };
  }

  @Get(":id/shared-with")
  @UseGuards(AuthGuard, UserAccountOwnershipGuard)
  @ApiOperation({
    summary: "Get all users who have access to owner's folders and files",
    description:
      "Returns paginated list of users with permissions to the owner's resources, including details about folders and files they can access",
  })
  @ApiResponse({
    status: 200,
    description: "Users with access retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Owner not found" })
  async getUsersWithAccess(
    @Param("id") ownerId: string,
    @Query() paginationQuery: any
  ): Promise<IGetUsersWithAccessApiResponse> {
    const { page, limit } = paginationQuery;
    const data = await this.userService.getUsersWithAccessToMyResources(
      ownerId,
      page,
      limit
    );

    return {
      success: true,
      data,
    };
  }
}
