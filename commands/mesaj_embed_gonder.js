const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mesai_embed_gonder')
        .setDescription('Mesai seçimi için kalıcı embed mesajını gönderir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Sadece yöneticiler kullanabilir
        
    async execute(interaction) {
        // Embed mesajını oluştur
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📅 Mesai Saati Seçim Sistemi')
            .setDescription('Aşağıdaki butona basarak müsait olduğunuz mesai saatini seçiniz.\n\n**Mevcut Saat Dilimleri:**\n20:00-21:00, 21:00-22:00, 22:00-23:00, 23:00-00:00, 00:00-01:00')
            .setFooter({ text: 'Seçiminizi yaptıktan sonra onay yetkilisini bekleyiniz.' });

        // Butonu oluştur
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_shift_select') // interactionCreate'de bu ID'yi yakalayacağız
                .setLabel('Mesai Seçimi Yap')
                .setStyle(ButtonStyle.Primary),
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Mesai seçim embed mesajı başarıyla gönderildi!', ephemeral: true });
    },
};
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.