const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'bot_settings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log_kur')
        .setDescription('Botun log mesajlarını göndereceği kanalı ayarlar.')
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Log kanalını seçin.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, dataFunctions) {
        const logChannel = interaction.options.getChannel('kanal');
        
        let settings = {};
        try {
            settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        } catch {}

        settings.logChannelId = logChannel.id;
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));

        await interaction.reply({ content: `✅ Log kanalı başarıyla ${logChannel} olarak ayarlandı!`, ephemeral: true });
    },
};
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.