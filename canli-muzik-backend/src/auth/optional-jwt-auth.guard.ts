import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Attaches `req.user` when a valid Bearer token is present; otherwise leaves user undefined.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  handleRequest<TUser>(
    err: unknown,
    user: TUser,
    _info: unknown,
    _ctx: ExecutionContext,
  ): TUser {
    if (err || !user) return undefined as TUser;
    return user;
  }
}
