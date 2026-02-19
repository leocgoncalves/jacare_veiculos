const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      console.log("❌ Nenhuma configuração encontrada no banco de dados.");
      return;
    }

    console.log("\n📊 Configurações atuais no banco de dados:\n");
    console.log(`   homeBackgroundUrl: ${settings.homeBackgroundUrl || "(vazio)"}`);
    console.log(`   heroVideoUrl: ${settings.heroVideoUrl || "(vazio)"}`);
    console.log(`   heroVideoPosterUrl: ${settings.heroVideoPosterUrl || "(vazio)"}`);
    console.log(`   updatedAt: ${settings.updatedAt || "(vazio)"}`);
    console.log("\n");
  } catch (error) {
    console.error("❌ Erro ao verificar configurações:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
