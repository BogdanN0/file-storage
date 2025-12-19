import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class UserAccountOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId;
    const paramId = request.params.id;

    if (userId !== paramId) {
      throw new ForbiddenException("Access denied");
    }

    return true;
  }
}
