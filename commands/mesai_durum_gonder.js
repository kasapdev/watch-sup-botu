const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'bot_settings.json');

// Ayarları okuma
function getSettings() {
    try {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// Ayarları kaydetme
function saveSettings(settings) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mesai_durum_gonder')
        .setDescription('10 dakikada bir güncellenecek mesai durumu mesajını gönderir ve kaydeder.')
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Mesajın gönderileceği kanalı seçin.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, dataFunctions) {
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel('kanal');
        
        // İlk yükleme mesajı (placeholder)
        const placeholderEmbed = new EmbedBuilder()
            .setColor('#f8c300')
            .setTitle('📆 BUGÜNKÜ ONAYLANMIŞ MESAİ LİSTESİ')
            .setDescription('Mesai listesi yükleniyor... Lütfen bekleyin.');

        // Mesajı kanala gönder
        const statusMessage = await channel.send({ embeds: [placeholderEmbed] });

        // Ayarlara kanal ID'si ve mesaj ID'sini kaydet
        let settings = getSettings();
        settings.statusChannelId = channel.id;
        settings.statusMessageId = statusMessage.id;
        saveSettings(settings);

        // İlk güncellemeyi hemen yap (Aşağıdaki updateStatusMessage fonksiyonu ile)
        // Bu kısım için index.js'ten çağrılan fonksiyonu simüle edebiliriz.
        // Fakat en temizi, index.js'in bu mesajı ilk döngüsünde güncelemesidir.
        
        await interaction.editReply(`✅ Mesai durum mesajı ${channel} kanalına gönderildi ve 10 dakikada bir güncellenmek üzere ayarlandı!`);
    },
};
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.