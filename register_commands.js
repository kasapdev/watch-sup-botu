const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// commands klasöründeki tüm komutların verilerini toplar
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[UYARI] ${file} dosyasında gerekli "data" veya "execute" özelliği eksik.`);
    }
}

// .env dosyasından gerekli bilgileri alın
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error("HATA: .env dosyasında DISCORD_TOKEN, CLIENT_ID veya GUILD_ID eksik.");
    process.exit(1);
}

// Komutları Discord API'ye yayınlayın
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Sunucu bazında ${commands.length} adet uygulama komutu yenileniyor...`);

        // Komutları sadece belirtilen sunucuya (guild) yayınlayın
        const data = await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log(`Başarıyla ${data.length} adet uygulama komutu yüklendi.`);
    } catch (error) {
        console.error(error);
    }
})();
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.