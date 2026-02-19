const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addHeroVideo() {
  try {
    console.log("🔄 Adicionando vídeo da hero no banco de dados...\n");

    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    
    if (!settings) {
      console.log("❌ SiteSettings não encontrado. Criando registro...");
      await prisma.siteSettings.create({
        data: {
          id: 1,
          heroVideoUrl: "/atualizado.mp4",
        },
      });
      console.log("✅ Registro criado com vídeo!");
      return;
    }

    console.log(`📹 Vídeo atual: ${settings.heroVideoUrl || "(vazio)"}`);

    // Atualiza adicionando o vídeo
    const updated = await prisma.siteSettings.update({
      where: { id: 1 },
      data: {
        heroVideoUrl: "/atualizado.mp4",
      },
    });

    console.log("\n✅ Vídeo adicionado com sucesso!");
    console.log(`📹 heroVideoUrl agora: ${updated.heroVideoUrl}`);
    console.log("\n💡 O site agora usará o vídeo como fundo da hero section.");

  } catch (error) {
    console.error("❌ Erro ao adicionar vídeo:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addHeroVideo();
