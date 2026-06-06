import type { Role } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  role: Role;
};

export type RequestUser = {
  userId: string;
  role: Role;
};

