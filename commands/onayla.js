const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    // ⚠️ ÖNEMLİ: Bu komutu sadece yöneticilerin kullanabilmesi için izin ayarı (MANAGE_ROLES veya ADMINISTRATOR gibi)
    data: new SlashCommandBuilder()
        .setName('onayla')
        .setDescription('Bir kullanıcının mesai talebini onaylar.')
        .addUserOption(option =>
            option.setName('talep_eden')
                .setDescription('Mesai talebi onaylanacak kullanıcıyı seçin.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mesai_saati')
                .setDescription('Onaylanan mesai saatini belirtin (örneğin: 09:00 - 18:00).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('aciklama')
                .setDescription('Kullanıcıya gönderilecek kısa bir not veya açıklama (İsteğe bağlı).')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles), // Yönetici izni gerekliliği

    async execute(interaction) {
        // Gerekli bilgileri interaction'dan alıyoruz
        const targetUser = interaction.options.getUser('talep_eden');
        const shiftTime = interaction.options.getString('mesai_saati');
        const note = interaction.options.getString('aciklama') ?? 'Talebiniz başarıyla onaylanmıştır.';
        const approver = interaction.user;

        // --- İŞ MANTIK KISMI ---
        // 1. Burada: Veritabanında (DB) veya bir JSON dosyasında kullanıcının talebini "onaylandı" olarak işaretleyin.
        // 2. Burada: Eğer botunuzda otomatik rol verme/kaldırma sistemi varsa, gerekli rolleri güncelleyin.
        // -----------------------

        // Kullanıcıya özel mesaj gönderme (DM)
        try {
            await targetUser.send(`
Merhaba ${targetUser},

Mesai talebiniz **${approver.tag}** tarafından **ONAYLANMIŞTIR!**

**Onaylanan Saat:** ${shiftTime}
**Not:** ${note}

İyi çalışmalar dileriz!
            `);
        } catch (dmError) {
            console.error(`Kullanıcıya DM gönderilemedi: ${targetUser.tag}`, dmError);
        }

        // Yöneticinin onaylamayı yaptığı kanala cevap gönderme
        await interaction.reply({
            content: `✅ **${targetUser.tag}** kullanıcısının \`${shiftTime}\` mesai talebi başarıyla onaylandı. Onay bilgisi DM üzerinden gönderildi.`,
            ephemeral: true, // Sadece komutu kullanan yöneticiye göster
        });
    },
};
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.