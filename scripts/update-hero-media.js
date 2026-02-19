// Script para atualizar URLs de mídia da hero no banco de dados
// Execute com: node scripts/update-hero-media.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateHeroMedia() {
  try {
    console.log('🔄 Atualizando URLs de mídia da hero...\n');

    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    
    if (!settings) {
      console.log('❌ SiteSettings não encontrado. Criando registro padrão...');
      await prisma.siteSettings.create({
        data: {
          id: 1,
          homeBackgroundUrl: '/carro.webp',
          heroVideoUrl: '/jacare_veiculos.webm',
          heroVideoPosterUrl: '/carro.webp',
        },
      });
      console.log('✅ Registro criado com novos valores padrão.');
      return;
    }

    const updates = {};
    let hasChanges = false;

    // Atualizar homeBackgroundUrl para usar o novo arquivo estático
    // Força atualização para garantir que use o novo carro.webp
    updates.homeBackgroundUrl = '/carro.webp';
    hasChanges = true;
    console.log(`📸 homeBackgroundUrl: será atualizado de "${settings.homeBackgroundUrl || '(vazio)'}" para /carro.webp`);

    // Atualizar heroVideoUrl para usar o novo arquivo estático
    // Força atualização para garantir que use o novo jacare_veiculos.webm
    updates.heroVideoUrl = '/jacare_veiculos.webm';
    hasChanges = true;
    console.log(`🎥 heroVideoUrl: será atualizado de "${settings.heroVideoUrl || '(vazio)'}" para /jacare_veiculos.webm`);

    // Atualizar heroVideoPosterUrl se estiver vazio ou usando imagem antiga
    if (!settings.heroVideoPosterUrl || 
        settings.heroVideoPosterUrl.includes('unsplash') ||
        settings.heroVideoPosterUrl === '/carro.png') {
      updates.heroVideoPosterUrl = '/carro.webp';
      hasChanges = true;
      console.log('🖼️ heroVideoPosterUrl: será atualizado para /carro.webp');
    } else {
      console.log(`🖼️ heroVideoPosterUrl: mantém "${settings.heroVideoPosterUrl}"`);
    }

    if (hasChanges) {
      await prisma.siteSettings.update({
        where: { id: 1 },
        data: updates,
      });
      console.log('\n✅ URLs atualizadas no banco de dados!');
    } else {
      console.log('\n✅ Todas as URLs já estão atualizadas.');
    }

    console.log('\n📋 Valores finais:');
    const updated = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    console.log(`   homeBackgroundUrl: ${updated.homeBackgroundUrl || '/carro.webp (padrão)'}`);
    console.log(`   heroVideoUrl: ${updated.heroVideoUrl || '/jacare_veiculos.webm (padrão)'}`);
    console.log(`   heroVideoPosterUrl: ${updated.heroVideoPosterUrl || '/carro.webp (padrão)'}`);

  } catch (error) {
    console.error('❌ Erro ao atualizar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateHeroMedia();
