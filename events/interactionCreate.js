const { 
    Events, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ActionRowBuilder, 
    EmbedBuilder, // EmbedBuilder import edildi
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'bot_settings.json');

// Bot ayarlarını okuyan yardımcı fonksiyon
function getSettings() {
    try {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client, dataFunctions) {
        // Veri yönetim fonksiyonlarını ve sabitleri çözme
        const { loadShifts, saveShifts, AVAILABLE_SHIFTS } = dataFunctions;
        const settings = getSettings();
        
        // Log kanalını cache'ten alma
        const logChannel = settings.logChannelId ? client.channels.cache.get(settings.logChannelId) : null;

        // --- 1. Slash Komutları İşleme ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client, dataFunctions);
            } catch (error) {
                console.error(`Komut çalıştırılırken hata oluştu [${interaction.commandName}]:`, error);
                await interaction.reply({ content: 'Bu komutu çalıştırırken bir hata oluştu!', ephemeral: true }).catch(() => {});
            }
        } 
        
        // --- 2. Buton Etkileşimleri ---
        else if (interaction.isButton()) {
            // A. Mesai Seçim Menüsünü Açan Buton (open_shift_select)
            if (interaction.customId === 'open_shift_select') {
                let shifts = loadShifts();
                if (shifts.some(s => s.userId === interaction.user.id && (s.status === 'pending' || s.status === 'approved'))) {
                     return interaction.reply({ 
                        content: 'Zaten beklemede veya onaylanmış bir mesai talebiniz bulunuyor. Lütfen yetkili onayını bekleyin.', 
                        ephemeral: true 
                    });
                }
                
                const select = new StringSelectMenuBuilder()
                    .setCustomId('select_shift')
                    .setPlaceholder('Mesai saatini seçin...')
                    .addOptions(AVAILABLE_SHIFTS.map(s => new StringSelectMenuOptionBuilder().setLabel(s.label).setValue(s.value)));

                const row = new ActionRowBuilder().addComponents(select);

                await interaction.reply({
                    content: 'Lütfen talep ettiğiniz mesai saatini seçin:',
                    components: [row],
                    ephemeral: true,
                });
            }
            
            // B. Log Kanalındaki Onay/Red Butonları
            const [action, userId, shiftValue] = interaction.customId.split('_');
            const targetUserId = userId; 

            // Yetki Kontrolü
            if (['approve', 'reject'].includes(action)) {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                     return interaction.reply({ content: 'Bu işlemi yapmaya yetkiniz yok.', ephemeral: true });
                }
            }

            if (action === 'approve') {
                // 1. Onayla Butonu Tıklandı
                await interaction.deferUpdate(); // Etkileşim süresi hatasını çözer.
                
                let shifts = loadShifts();
                const shiftIndex = shifts.findIndex(s => s.userId === targetUserId && s.status === 'pending');

                if (shiftIndex === -1) {
                    await interaction.message.edit({ content: 'Bu talep ya zaten işlenmiş ya da listede bulunmuyor.', components: [] });
                    return;
                }
                
                // Veritabanı güncelleme
                const approvedShift = shifts[shiftIndex];
                approvedShift.status = 'approved';
                saveShifts(shifts);
                
                const targetUser = await client.users.fetch(targetUserId).catch(() => null);
                const approverTag = interaction.user.tag;
                const shiftLabel = AVAILABLE_SHIFTS.find(s => s.value === shiftValue).label;

                // Kullanıcıya DM ile bildirim
                if (targetUser) {
                    await targetUser.send(`
Merhaba <@${targetUser.id}>,

Mesai talebiniz **${approverTag}** tarafından **ONAYLANMIŞTIR!**

**Onaylanan Saat:** ${shiftLabel}
**Not:** Talebiniz başarıyla onaylanmıştır.

İyi çalışmalar dileriz!
                    `).catch(() => {});
                }

                // KRİTİK DÜZELTME: Embed'i EmbedBuilder'a yükleyip rengi ve başlığı değiştirme
                const currentEmbed = interaction.message.embeds[0];
                const updatedEmbed = new EmbedBuilder(currentEmbed.toJSON())
                    .setColor('Green')
                    .setTitle('✅ Mesai Talebi Onaylandı');

                // Log mesajını güncelle
                await interaction.message.edit({ 
                    content: `✅ ${interaction.user.tag} tarafından onaylandı.`,
                    embeds: [updatedEmbed], 
                    components: [] 
                });
                
                // Durum mesajını hemen güncelle
                if(client.updateStatusMessage) {
                    client.updateStatusMessage(client, dataFunctions);
                }


            } else if (action === 'reject') {
                // 2. Reddet Butonu Tıklandı - DOĞRUDAN REDDETME İŞLEMİ
                
                await interaction.deferUpdate(); // Etkileşim süresi hatasını çözer.
                
                let shifts = loadShifts();
                // Reddedilecek talebi tam olarak bul
                const shiftIndex = shifts.findIndex(s => 
                    s.userId === targetUserId && 
                    s.status === 'pending' && 
                    `${s.shiftStart}-${s.shiftEnd}` === shiftValue
                );
                
                if (shiftIndex === -1) {
                    await interaction.message.edit({ content: 'Bu beklemedeki mesai talebi zaten işlenmiş veya listeden kaldırılmış.', components: [] });
                    return;
                }
                
                // Veri tabanından kaldır
                shifts.splice(shiftIndex, 1); 
                saveShifts(shifts);
                
                const targetUser = await client.users.fetch(targetUserId).catch(() => null);
                const shiftLabel = AVAILABLE_SHIFTS.find(s => s.value === shiftValue).label;


                // Kullanıcıya DM ile bildirim (Reddedildi)
                if (targetUser) {
                    await targetUser.send(`
❌ Mesai talebiniz **REDDEDİLDİ.** (Yetkili: ${interaction.user.tag})

**Reddedilen Saat:** ${shiftLabel}
**Not:** Yetkili tarafından sebep belirtilmeden reddedilmiştir. Lütfen yeni bir mesai saati seçmek için **Mesai Seçimi Yap** butonunu tekrar kullanın.
                    `).catch(() => {});
                }

                // KRİTİK DÜZELTME: Embed'i EmbedBuilder'a yükleyip rengi ve başlığı değiştirme
                const currentEmbed = interaction.message.embeds[0];
                const updatedEmbed = new EmbedBuilder(currentEmbed.toJSON())
                    .setColor('Red')
                    .setTitle('❌ Mesai Talebi Reddedildi');

                // Log mesajını güncelle
                await interaction.message.edit({ 
                    content: `❌ ${interaction.user.tag} tarafından sebep belirtilmeden reddedildi.`,
                    embeds: [updatedEmbed], 
                    components: [] 
                });

                // Durum mesajını hemen güncelle
                if(client.updateStatusMessage) {
                    client.updateStatusMessage(client, dataFunctions);
                }
            }
        }
        
        // --- 3. Select Menu Etkileşimleri (Mesai Saati Seçimi) ---
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'select_shift') {
                const selectedValue = interaction.values[0];
                const [start, end] = selectedValue.split('-');
                
                let shifts = loadShifts();
                const shiftLabel = AVAILABLE_SHIFTS.find(s => s.value === selectedValue).label;
                
                if (shifts.some(s => s.userId === interaction.user.id && (s.status === 'pending' || s.status === 'approved'))) {
                     return interaction.update({ content: 'Zaten beklemede veya onaylanmış bir mesai talebiniz bulunuyor.', components: [] });
                }
                
                const newShift = {
                    id: Date.now().toString(),
                    userId: interaction.user.id,
                    username: interaction.user.tag,
                    shiftStart: start,
                    shiftEnd: end,
                    status: 'pending',
                    timestamp: new Date().toISOString()
                };

                shifts.push(newShift);
                saveShifts(shifts);
                
                // Log Kanalına Talebi Gönder
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('Yellow')
                        .setTitle('⏳ Yeni Mesai Talep Edildi')
                        .addFields(
                            { name: 'Kullanıcı', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                            { name: 'Talep Edilen Saat', value: shiftLabel, inline: true },
                        );

                    const logRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`approve_${interaction.user.id}_${selectedValue}`)
                            .setLabel('Onayla')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`reject_${interaction.user.id}_${selectedValue}`)
                            .setLabel('Reddet')
                            .setStyle(ButtonStyle.Danger)
                    );

                    await logChannel.send({ embeds: [logEmbed], components: [logRow] });
                }

                await interaction.update({
                    content: `Mesai talebiniz (**${shiftLabel}**) yetkili onayına gönderildi.`,
                    components: [],
                });
            }
        }
        
        // --- 4. Modal Etkileşimleri (Artık Kullanılmıyor) ---
        else if (interaction.isModalSubmit()) {
            // Modal'lar kaldırıldığı için bu blok artık çalışmamalı.
            console.log("UYARI: Eskimiş bir modal submit etkileşimi alındı ve yoksayıldı.");
            return;
        }
    },
};
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.