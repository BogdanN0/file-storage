import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { User, Session, RefreshToken, PermissionRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import {
  CreateUserDto,
  UpdateUserDto,
  CreateSessionDto,
  CreateRefreshTokenDto,
  SearchUsersDto,
} from "./user.dto";
import {
  IUserPublic,
  IUserWithRelations,
  IUserStats,
  IUserWithAccess,
  ISearchUsersResponse,
  IUsersWithAccessResponse,
} from "@monorepo/shared";

@Injectable()
export class UserService {
  public prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  // Remove password from user object for safe public access
  private excludePassword(user: User): IUserPublic {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Remove password from array of users
  private excludePasswordFromArray(users: User[]): IUserPublic[] {
    return users.map((user) => this.excludePassword(user));
  }

  async create(data: CreateUserDto): Promise<IUserPublic> {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    return this.excludePassword(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByIdOrThrow(id: string): Promise<IUserPublic> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.excludePassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByEmailPublic(email: string): Promise<IUserPublic | null> {
    const user = await this.findByEmail(email);
    return user ? this.excludePassword(user) : null;
  }

  async searchUsers(query: SearchUsersDto): Promise<ISearchUsersResponse> {
    const searchTerm = query.query;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { email: { contains: searchTerm, mode: "insensitive" as const } },
        { name: { contains: searchTerm, mode: "insensitive" as const } },
      ],
    };

    const [users, totalUsers] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: this.excludePasswordFromArray(users),
      totalUsers,
      query: searchTerm,
      page,
      limit,
    };
  }

  async findAll(): Promise<IUserPublic[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return this.excludePasswordFromArray(users);
  }

  async update(id: string, data: UpdateUserDto): Promise<IUserPublic> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (data.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException("Email already in use");
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.excludePassword(updatedUser);
  }

  async updatePassword(id: string, newPassword: string): Promise<IUserPublic> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return this.excludePassword(updatedUser);
  }

  async delete(id: string): Promise<IUserPublic> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const deletedUser = await this.prisma.user.delete({
      where: { id },
    });

    return this.excludePassword(deletedUser);
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async createSession(data: CreateSessionDto): Promise<Session> {
    const user = await this.findById(data.userId);
    if (!user) {
      throw new NotFoundException(`User with id ${data.userId} not found`);
    }

    return this.prisma.session.create({
      data: {
        userId: data.userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });
  }

  async findSessionById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  async findUserSessions(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { lastActivity: "desc" },
    });
  }

  async updateSessionActivity(id: string): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: { lastActivity: new Date() },
    });
  }

  async deleteSession(id: string): Promise<Session> {
    return this.prisma.session.delete({
      where: { id },
    });
  }

  async deleteSessionForUser(userId: string, sessionId: string): Promise<void> {
    const res = await this.prisma.session.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (res.count === 0) {
      throw new NotFoundException("Session not found");
    }
  }

  async deleteUserSessions(userId: string): Promise<{ count: number }> {
    return this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteInactiveSessions(
    inactiveDays: number = 30
  ): Promise<{ count: number }> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - inactiveDays);

    return this.prisma.session.deleteMany({
      where: {
        lastActivity: { lt: threshold },
      },
    });
  }

  async createRefreshToken(data: CreateRefreshTokenDto): Promise<RefreshToken> {
    const user = await this.findById(data.userId);
    if (!user) {
      throw new NotFoundException(`User with id ${data.userId} not found`);
    }

    return this.prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async findUserRefreshTokens(userId: string): Promise<RefreshToken[]> {
    return this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async revokeRefreshToken(token: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async deleteRefreshToken(token: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.delete({
      where: { token },
    });
  }

  async deleteUserRefreshTokens(userId: string): Promise<{ count: number }> {
    return this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpiredRefreshTokens(): Promise<{ count: number }> {
    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }

  async getUserWithRelations(id: string): Promise<IUserWithRelations> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: { lastActivity: "desc" },
          take: 5,
        },
        refreshTokens: {
          where: {
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
        },
        ownedFolders: {
          where: { parentId: null },
          orderBy: { createdAt: "desc" },
        },
        ownedFiles: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as IUserWithRelations;
  }

  async getUserStats(id: string): Promise<IUserStats> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const [foldersCount, filesCount, sessionsCount] = await Promise.all([
      this.prisma.folder.count({ where: { ownerId: id } }),
      this.prisma.file.count({ where: { ownerId: id } }),
      this.prisma.session.count({ where: { userId: id } }),
    ]);

    return {
      foldersCount,
      filesCount,
      sessionsCount,
    };
  }

  async getUsersWithAccessToMyResources(
    ownerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<IUsersWithAccessResponse> {
    // Check user
    const owner = await this.findById(ownerId);
    if (!owner) {
      throw new NotFoundException(`User with id ${ownerId} not found`);
    }

    // Get all permissions
    const folderPermissions = await this.prisma.folderPermission.findMany({
      where: {
        folder: {
          ownerId: ownerId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        grantedAt: "desc",
      },
    });

    // Get all permissions
    const filePermissions = await this.prisma.filePermission.findMany({
      where: {
        file: {
          ownerId: ownerId,
        },
        role: {
          not: PermissionRole.OWNER,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
            originalName: true,
            description: true,
            mimeType: true,
          },
        },
      },
      orderBy: {
        grantedAt: "desc",
      },
    });

    // Group by user
    const usersMap = new Map<string, IUserWithAccess>();

    for (const permission of folderPermissions) {
      const userId = permission.user.id;

      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          userId: permission.user.id,
          userName: permission.user.name,
          userEmail: permission.user.email,
          userCreatedAt: permission.user.createdAt,
          folders: [],
          files: [],
          totalFolders: 0,
          totalFiles: 0,
        });
      }

      const userAccess = usersMap.get(userId)!;
      userAccess.folders.push({
        folderId: permission.folder.id,
        folderName: permission.folder.name,
        folderDescription: permission.folder.description,
        role: permission.role,
        grantedAt: permission.grantedAt,
        permissionId: permission.id,
      });
      userAccess.totalFolders++;
    }

    for (const permission of filePermissions) {
      const userId = permission.user.id;

      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          userId: permission.user.id,
          userName: permission.user.name,
          userEmail: permission.user.email,
          userCreatedAt: permission.user.createdAt,
          folders: [],
          files: [],
          totalFolders: 0,
          totalFiles: 0,
        });
      }

      const userAccess = usersMap.get(userId)!;
      userAccess.files.push({
        fileId: permission.file.id,
        fileName: permission.file.name,
        fileOriginalName: permission.file.originalName,
        fileDescription: permission.file.description,
        fileMimeType: permission.file.mimeType,
        role: permission.role,
        grantedAt: permission.grantedAt,
        permissionId: permission.id,
      });
      userAccess.totalFiles++;
    }

    const allUsers = Array.from(usersMap.values());

    const total = allUsers.length;
    const totalPages = Math.ceil(total / limit);

    const skip = (page - 1) * limit;
    const paginatedUsers = allUsers.slice(skip, skip + limit);

    return {
      users: paginatedUsers,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
