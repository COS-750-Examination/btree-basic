/**
 * Seeds the decoration catalogue and a demo class matching the mockups.
 * Safe to re-run: everything is upserted. Demo password for every account: btree-demo-123
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { DECORATIONS } from '@btree/shared';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const PEOPLE = [
  {
    email: 'demo@btree.local',
    displayName: 'Demo Student',
    modules: 5,
    decorations: ['apples', 'blossoms', 'songbird', 'bunting'],
  },
  {
    email: 'anele@btree.local',
    displayName: 'Anele M.',
    modules: 7,
    decorations: ['fairy-lights', 'lanterns', 'butterflies', 'bird-box', 'tree-swing'],
  },
  { email: 'jordan@btree.local', displayName: 'Jordan B.', modules: 6, decorations: ['apples'] },
  { email: 'kea@btree.local', displayName: 'Kea T.', modules: 4, decorations: [] },
  { email: 'sam@btree.local', displayName: 'Sam O.', modules: 2, decorations: [] },
];

async function main() {
  for (const { id, name, cost } of DECORATIONS) {
    const row = { id, name, cost };
    await prisma.decoration.upsert({ where: { id }, create: row, update: row });
  }

  const passwordHash = await bcrypt.hash('btree-demo-123', 12);
  const users = [];
  for (const p of PEOPLE) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      create: { email: p.email, displayName: p.displayName, passwordHash },
      update: {},
    });
    users.push(user);
    for (let moduleId = 1; moduleId <= p.modules; moduleId += 1) {
      await prisma.moduleProgress.upsert({
        where: { userId_moduleId: { userId: user.id, moduleId } },
        create: { userId: user.id, moduleId, completedAt: new Date() },
        update: {},
      });
    }
    for (const decorationId of p.decorations) {
      await prisma.userDecoration.upsert({
        where: { userId_decorationId: { userId: user.id, decorationId } },
        create: { userId: user.id, decorationId },
        update: {},
      });
    }
    if ((await prisma.leafTransaction.count({ where: { userId: user.id } })) === 0) {
      await prisma.leafTransaction.createMany({
        data: Array.from({ length: p.modules }, () => ({
          userId: user.id,
          amount: 30,
          reason: 'lesson' as const,
        })),
      });
    }
  }

  const [demo, ...friends] = users;
  for (const friend of friends) {
    await prisma.friendship.upsert({
      where: { requesterId_addresseeId: { requesterId: demo!.id, addresseeId: friend.id } },
      create: {
        requesterId: demo!.id,
        addresseeId: friend.id,
        status: 'accepted',
        acceptedAt: new Date(),
      },
      update: {},
    });
  }

  console.log(`Seeded ${DECORATIONS.length} decorations and ${PEOPLE.length} users.`);
  console.log('Sign in as demo@btree.local / btree-demo-123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
