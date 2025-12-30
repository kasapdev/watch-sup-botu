const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    // ⚠️ ÖNEMLİ: Bu komutu sadece yöneticilerin kullanabilmesi için izin ayarı (MANAGE_ROLES veya ADMINISTRATOR gibi)
    data: new SlashCommandBuilder()
        .setName('reddet')
        .setDescription('Bir kullanıcının mesai talebini reddeder.')
        .addUserOption(option =>
            option.setName('talep_eden')
                .setDescription('Mesai talebi reddedilecek kullanıcıyı seçin.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Reddetme sebebini yazınız (Zorunlu).')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles), // Yönetici izni gerekliliği

    async execute(interaction) {
        // Gerekli bilgileri interaction'dan alıyoruz
        const targetUser = interaction.options.getUser('talep_eden');
        const reason = interaction.options.getString('sebep');
        const moderator = interaction.user;

        // --- İŞ MANTIK KISMI ---
        // 1. Burada: Veritabanında (DB) veya bir JSON dosyasında kullanıcının talebini "reddedildi" olarak işaretleyin.
        // -----------------------

        // Kullanıcıya özel mesaj gönderme (DM)
        try {
            await targetUser.send(`
Merhaba ${targetUser},

Mesai talebiniz **${moderator.tag}** tarafından **REDDEDİLMİŞTİR.**

**Reddetme Sebebi:** > ${reason}

Lütfen talebinizi gözden geçirip, tekrar deneyiniz.
            `);
        } catch (dmError) {
            console.error(`Kullanıcıya DM gönderilemedi: ${targetUser.tag}`, dmError);
        }

        // Yöneticinin reddetmeyi yaptığı kanala cevap gönderme
        await interaction.reply({
            content: `❌ **${targetUser.tag}** kullanıcısının talebi, **"${reason}"** sebebiyle reddedildi. Bilgilendirme DM üzerinden yapıldı.`,
            ephemeral: true, // Sadece komutu kullanan yöneticiye göster
        });
    },
};
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.