import { PrismaClient, GiftExchangeStatus } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample participants
  const participants = await Promise.all([
    prisma.participant.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
      },
    }),
    prisma.participant.create({
      data: {
        name: 'Bob Smith',
        email: 'bob@example.com',
      },
    }),
    prisma.participant.create({
      data: {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
      },
    }),
    prisma.participant.create({
      data: {
        name: 'Diana Prince',
        email: 'diana@example.com',
      },
    }),
    prisma.participant.create({
      data: {
        name: 'Eve Wilson',
        email: 'eve@example.com',
      },
    }),
  ]);

  console.log(`✅ Created ${participants.length} participants`);

  // Create a sample gift exchange
  const giftExchange = await prisma.giftExchange.create({
    data: {
      name: 'Christmas 2024',
      year: 2024,
      status: GiftExchangeStatus.DRAFT,
    },
  });

  console.log(`✅ Created gift exchange: ${giftExchange.name}`);

  // Add participants to the gift exchange
  const giftExchangeParticipants = await Promise.all(
    participants.map((participant) =>
      prisma.giftExchangeParticipant.create({
        data: {
          giftExchangeId: giftExchange.id,
          participantId: participant.id,
        },
      })
    )
  );

  console.log(`✅ Added ${giftExchangeParticipants.length} participants to gift exchange`);

  // Create some exclusion rules (e.g., spouses can't draw each other)
  const exclusionRules = await Promise.all([
    prisma.exclusionRule.create({
      data: {
        giftExchangeId: giftExchange.id,
        excluderId: participants[0].id, // Alice
        excludedId: participants[1].id,   // Bob
        reason: 'Married couple',
      },
    }),
    prisma.exclusionRule.create({
      data: {
        giftExchangeId: giftExchange.id,
        excluderId: participants[1].id, // Bob
        excludedId: participants[0].id,   // Alice
        reason: 'Married couple',
      },
    }),
  ]);

  console.log(`✅ Created ${exclusionRules.length} exclusion rules`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
