import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating placehold.co URLs to picsum.photos...');

  // Game.image_url — picsum.photos/seed/<hash>/800/600
  const r1 = await prisma.$executeRawUnsafe(
    `UPDATE "Game" SET image_url = 'https://picsum.photos/seed/' || SUBSTRING(MD5(image_url), 1, 8) || '/800/600' WHERE image_url LIKE '%placehold.co%'`
  );
  console.log(`  Game.image_url: ${r1} rows updated`);

  // User.profile JSON — replace placehold.co URLs inside JSON
  const r2 = await prisma.$executeRawUnsafe(
    `UPDATE "User" SET profile = REPLACE(profile::text, 'placehold.co', 'picsum.photos')::jsonb WHERE profile::text LIKE '%placehold.co%'`
  );
  console.log(`  User.profile (JSON): ${r2} rows updated`);

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());