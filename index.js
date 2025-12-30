const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const moment = require('moment');
require('moment/locale/tr'); // Türkçe tarih desteği
require('dotenv').config(); // KRİTİK: .env dosyasını yükler

// Moment.js'i Türkçe'ye ayarlıyoruz
moment.locale('tr');

// Bot ayarları ve mesai verisi için dosya yolları
const CONFIG_FILE = path.join(__dirname, 'config.json');
const SETTINGS_FILE = path.join(__dirname, 'bot_settings.json');
const COMMANDS_PATH = path.join(__dirname, 'commands');
const EVENTS_PATH = path.join(__dirname, 'events');

// Discord.js Client oluşturma
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

// Komut koleksiyonunu ve data fonksiyonlarını başlatma
client.commands = new Collection();
const dataFunctions = {
    // Mesai verilerini okuma (shifts)
    loadShifts: () => {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data).shifts || [];
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('config.json bulunamadı, yeni dosya oluşturuluyor...');
                return [];
            }
            console.error('Mesai verisi yüklenirken hata:', error);
            return [];
        }
    },
    
    // Mesai verilerini kaydetme (shifts)
    saveShifts: (shifts) => {
        try {
            const data = JSON.stringify({ shifts }, null, 2);
            fs.writeFileSync(CONFIG_FILE, data);
        } catch (error) {
            console.error('Mesai verisi kaydedilirken hata:', error);
        }
    },

    // Sabit mesai saatleri
    AVAILABLE_SHIFTS: [
        { label: '09:00 - 18:00', value: '0900-1800' },
        { label: '10:00 - 19:00', value: '1000-1900' },
        { label: '11:00 - 20:00', value: '1100-2000' },
        { label: '12:00 - 21:00', value: '1200-2100' },
        { label: '13:00 - 22:00', value: '1300-2200' },
        { label: '14:00 - 23:00', value: '1400-2300' },
    ],
};

// Ayarları okuma
function getSettings() {
    try {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// --- Status Mesajını Güncelleyen Fonksiyon ---
client.updateStatusMessage = async (client, dataFunctions) => {
    const settings = getSettings();
    const { loadShifts } = dataFunctions;

    if (!settings.statusChannelId || !settings.statusMessageId) {
        return; 
    }

    const shifts = loadShifts();
    const approvedShifts = shifts.filter(s => s.status === 'approved');

    let shiftList = approvedShifts.map(s => {
        const startTime = s.shiftStart.substring(0, 2) + ':' + s.shiftStart.substring(2);
        const endTime = s.shiftEnd.substring(0, 2) + ':' + s.shiftEnd.substring(2);
        return `• <@${s.userId}>: ${startTime} - ${endTime}`;
    }).join('\n');

    if (shiftList.length === 0) {
        shiftList = 'Bugün onaylanmış mesai kaydı bulunmamaktadır. 😴';
    }

    // EmbedBuilder'ı doğrudan kullanıyoruz
    const embed = new EmbedBuilder()
        .setColor('#00ff7f')
        .setTitle('✅ Bugün Onaylanmış Mesai Saatleri')
        .setDescription(shiftList)
        .setFooter({ text: `Son Güncelleme: ${moment().format('HH:mm:ss')}` });

    try {
        const channel = await client.channels.fetch(settings.statusChannelId);
        const message = await channel.messages.fetch(settings.statusMessageId);
        await message.edit({ embeds: [embed] });
    } catch (error) {
        console.error('Durum mesajı güncellenirken hata oluştu (Kanal/Mesaj ID hatalı olabilir):', error.message);
    }
};


// --- Komutları Yükleme ---
const commandFiles = fs.readdirSync(COMMANDS_PATH).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(COMMANDS_PATH, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[UYARI] ${filePath} dosyasında "data" veya "execute" eksik.`);
    }
}


// --- Olayları Yükleme ---
const eventFiles = fs.readdirSync(EVENTS_PATH).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const filePath = path.join(EVENTS_PATH, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client, dataFunctions));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client, dataFunctions));
    }
}


// --- Scheduler (CRON) İşlemleri ---
client.on('ready', () => {
    console.log(`Giriş yapıldı: ${client.user.tag}!`);

    // 1. Durum Mesajını Başlangıçta Güncelle
    client.updateStatusMessage(client, dataFunctions);

    // 2. Durum Mesajını Her 10 dakikada bir güncelle
    cron.schedule('*/10 * * * *', () => {
        console.log('Scheduler çalıştı: Durum mesajı güncelleniyor.');
        client.updateStatusMessage(client, dataFunctions);
    });
    
    // 3. Her gece 00:00'da tüm onaylanmış mesaileri sıfırla (Yeni gün)
    cron.schedule('0 0 * * *', () => {
        console.log('Scheduler çalıştı: Mesai kayıtları sıfırlanıyor.');
        
        const shifts = dataFunctions.loadShifts();
        // Sadece 'approved' mesaileri kaldır
        const remainingShifts = shifts.filter(s => s.status !== 'approved');
        
        dataFunctions.saveShifts(remainingShifts);
        client.updateStatusMessage(client, dataFunctions);
    });
});

// --- Bot Girişi (TOKEN) ---
const BOT_TOKEN = process.env.DISCORD_TOKEN; // KRİTİK: .env dosyasından çekiliyor

if (!BOT_TOKEN) {
    console.error("HATA: DISCORD_TOKEN .env dosyasında bulunamadı.");
} else {
    client.login(BOT_TOKEN).catch(err => {
        console.error("Bot giriş yaparken hata oluştu:", err);
    });
}
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.