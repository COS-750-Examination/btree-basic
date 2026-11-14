import type { AccountPatchBody, PublicUser } from '@btree/shared';
import { hashPassword, toPublicUser, verifyPassword } from './auth';
import { HttpError } from './http';
import { prisma } from './prisma';

export const WRONG_PASSWORD_MESSAGE = 'Current password is incorrect';

export async function updateAccount(userId: string, patch: AccountPatchBody): Promise<PublicUser> {
  let passwordHash: string | undefined;
  if (patch.newPassword !== undefined) {
    const { passwordHash: current } = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!(await verifyPassword(patch.currentPassword ?? '', current))) {
      throw new HttpError(400, WRONG_PASSWORD_MESSAGE);
    }
    passwordHash = await hashPassword(patch.newPassword);
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { displayName: patch.displayName, theme: patch.theme, passwordHash },
  });
  return toPublicUser(updated);
}
