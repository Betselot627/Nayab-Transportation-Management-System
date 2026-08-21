const { PrismaClient } = require("@prisma/client");

async function testUrl(url, label) {
  console.log(`\nTesting ${label}...`);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });
  try {
    await prisma.$connect();
    console.log(`✅ ${label} connected successfully!`);
    const res = await prisma.$queryRaw`SELECT 1 as val`;
    console.log("Query Result:", res);
    return true;
  } catch (err) {
    console.error(`❌ ${label} failed:`, err.message || err);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const directUrl = "postgresql://neondb_owner:npg_Gy1ZTgkH2PIU@ep-small-star-ayj1yvl6.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";
  const poolerUrl = "postgresql://neondb_owner:npg_Gy1ZTgkH2PIU@ep-small-star-ayj1yvl6-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";
  
  await testUrl(directUrl, "Direct Connection");
  await testUrl(poolerUrl, "Pooler Connection (No channel binding)");
}

main();
