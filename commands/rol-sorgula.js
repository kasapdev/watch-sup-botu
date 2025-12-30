const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    // Komut verileri: /rol-bilgi komutunu tanımlar
    data: new SlashCommandBuilder()
        .setName('rol-bilgi')
        .setDescription('Belirtilen role sahip tüm üyelerin ID\'lerini listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles) // Sadece Rolleri Yönet yetkisi olanlar kullanabilir
        .addRoleOption(option => 
            option.setName('rol')
                .setDescription('ID\'leri listelenecek rolü seçin.')
                .setRequired(true)), // Rol seçimi zorunlu
    
    // Komut çalıştırma mantığı
    async execute(interaction) {
        // Kullanıcının yanıtı görmesi için beklemeye al
        await interaction.deferReply({ ephemeral: true });

        const role = interaction.options.getRole('rol');
        const guild = interaction.guild;

        try {
            // Sunucudaki tüm üyeleri getir (büyük sunucularda doğru çalışması için)
            // Not: index.js dosyanızda GuildMembers Intent'inin açık olduğundan emin olun.
            // (Mevcut index.js dosyanızda açık görünüyor: GatewayIntentBits.GuildMembers)
            await guild.members.fetch(); 

            // Seçilen role sahip üyeleri al
            const membersWithRole = role.members;
            
            if (membersWithRole.size === 0) {
                return interaction.editReply({ 
                    content: `❌ **${role.name}** rolüne sahip kimse bulunamadı.`, 
                    ephemeral: true 
                });
            }

            // Üye ID'lerini al ve alt alta listele
            const memberIds = membersWithRole.map(member => member.user.id);
            const idList = memberIds.join('\n');
            const totalMembers = membersWithRole.size;

            let responseText = `✅ **${role.name}** rolüne sahip toplam **${totalMembers}** üye ID'si:\n\n`;
            
            // Discord mesaj limitini aşmamak için kontrol (2000 karakter)
            if (responseText.length + idList.length > 1900) {
                // Eğer liste çok uzunsa, ilk 20 ID'yi göster ve geri kalanını bildir
                const truncatedList = memberIds.slice(0, 20).join('\n');
                responseText += `\`\`\`\n${truncatedList}\n(ve diğer ${totalMembers - 20} üye)\n\`\`\`\n\n(Liste çok uzun olduğu için ilk 20 ID gösteriliyor.)`;
            } else {
                responseText += `\`\`\`\n${idList}\n\`\`\``;
            }

            // Yanıtı gönder (ephemeral: sadece komutu kullanan görür)
            await interaction.editReply({ 
                content: responseText, 
                ephemeral: true
            });

        } catch (error) {
            console.error('Rol Bilgi komutunda hata:', error);
            await interaction.editReply({ 
                content: '❌ Komut çalıştırılırken bir hata oluştu. Botun rol ve üye bilgilerini görme yetkilerini kontrol edin.', 
                ephemeral: true 
            });
        }
    },
};
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.