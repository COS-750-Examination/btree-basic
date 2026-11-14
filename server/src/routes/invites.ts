import { randomInt } from 'node:crypto';
import {
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  INVITE_LOOKUPS_PER_HOUR,
  type InviteCode,
  type InvitePreview,
  type InviteResult,
  type InviteStatus,
} from '@btree/shared';
import { Router } from 'express';
import { HttpError, notFound, param } from '../lib/http';
import { isUniqueViolation, prisma } from '../lib/prisma';
import { perUserLimiter } from '../lib/rateLimit';
import { requireAuth, uid } from '../middleware/auth';
import { friendRequestLimiter } from './friends';

export const invitesRouter = Router();

const lookupLimiter = perUserLimiter({ windowMs: 60 * 60 * 1000, limit: INVITE_LOOKUPS_PER_HOUR });

const CODE_PATTERN = new RegExp(`^[${INVITE_CODE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`);

const newCode = () =>
  Array.from(
    { length: INVITE_CODE_LENGTH },
    () => INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)],
  ).join('');

async function assignCode(userId: string): Promise<string> {
  for (;;) {
    const code = newCode();
    try {
      await prisma.user.update({ where: { id: userId }, data: { inviteCode: code } });
      return code;
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
}

async function ownerOf(rawCode: string) {
  const code = rawCode.toUpperCase();
  if (!CODE_PATTERN.test(code)) throw notFound('Invite link not found');
  const owner = await prisma.user.findUnique({
    where: { inviteCode: code },
    select: { id: true, displayName: true },
  });
  if (!owner) throw notFound('Invite link not found');
  return owner;
}

async function linkBetween(me: string, other: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me, addresseeId: other },
        { requesterId: other, addresseeId: me },
      ],
    },
  });
}

invitesRouter.get('/invites/mine', requireAuth, async (req, res) => {
  const { inviteCode } = await prisma.user.findUniqueOrThrow({
    where: { id: uid(req) },
    select: { inviteCode: true },
  });
  const body: InviteCode = { code: inviteCode ?? (await assignCode(uid(req))) };
  res.json(body);
});

invitesRouter.post('/invites/mine/reset', requireAuth, async (req, res) => {
  const body: InviteCode = { code: await assignCode(uid(req)) };
  res.json(body);
});

invitesRouter.get('/invites/:code', requireAuth, lookupLimiter, async (req, res) => {
  const me = uid(req);
  const owner = await ownerOf(param(req, 'code'));
  let status: InviteStatus = 'none';
  if (owner.id === me) status = 'self';
  else {
    const link = await linkBetween(me, owner.id);
    if (link?.status === 'accepted') status = 'friends';
    else if (link) status = link.requesterId === me ? 'sent' : 'received';
  }
  const body: InvitePreview = {
    displayName: owner.displayName,
    status,
    friendId: status === 'friends' ? owner.id : null,
  };
  res.json(body);
});

invitesRouter.post('/invites/:code', requireAuth, friendRequestLimiter, async (req, res) => {
  const me = uid(req);
  const owner = await ownerOf(param(req, 'code'));
  if (owner.id === me) throw new HttpError(400, "That's your own invite link");

  const link = await linkBetween(me, owner.id);
  const friends: InviteResult = { status: 'friends', friendId: owner.id };
  if (link?.status === 'accepted') {
    res.json(friends);
    return;
  }
  if (link && link.requesterId === owner.id) {
    await prisma.friendship.update({
      where: { id: link.id },
      data: { status: 'accepted', acceptedAt: new Date() },
    });
    res.json(friends);
    return;
  }
  if (!link) await prisma.friendship.create({ data: { requesterId: me, addresseeId: owner.id } });
  const sent: InviteResult = { status: 'sent', friendId: null };
  res.status(201).json(sent);
});
