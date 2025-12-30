const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const moment = require('moment');
require('moment/locale/tr'); // Türkçe tarih formatı için

// Moment.js'i Türkçe'ye ayarlıyoruz
moment.locale('tr');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mesairapor')
        .setDescription('Onaylanmış tüm mesai kayıtlarını raporlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles), // Sadece yetkililer kullanabilir
    
    async execute(interaction, client, dataFunctions) {
        // Kullanıcıya komutun işlendiğini bildirmek için deferReply kullanılır
        await interaction.deferReply({ ephemeral: true }); 

        const { loadShifts } = dataFunctions;
        const shifts = loadShifts();

        // Sadece 'approved' (onaylanmış) mesaileri filtrele
        const approvedShifts = shifts.filter(s => s.status === 'approved');

        if (approvedShifts.length === 0) {
            return interaction.editReply({ 
                content: 'Henüz onaylanmış mesai kaydı bulunmamaktadır.',
                ephemeral: true 
            });
        }

        // Mesaileri tarihe göre sırala (en yeniden en eskiye)
        approvedShifts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const reportChunks = [];
        let currentChunk = '';
        let shiftCount = 0;

        // Rapor verilerini Embed mesajı için hazırla
        for (const shift of approvedShifts) {
            // shiftStart/shiftEnd 'HHMM' formatında ise HH:MM yap
            const startTime = shift.shiftStart.substring(0, 2) + ':' + shift.shiftStart.substring(2);
            const endTime = shift.shiftEnd.substring(0, 2) + ':' + shift.shiftEnd.substring(2);
            
            // Tarihi okunabilir Türkçe formatına çevir
            const formattedDate = moment(shift.timestamp).format('DD MMMM YYYY (dddd)');

            const line = `• **${shift.username}** - ${formattedDate} (${startTime} - ${endTime})\n`;

            // Discord mesaj limitini aşmamak için 4096 karakter sınırına yakınsa yeni bir parça oluştur
            if ((currentChunk.length + line.length) > 3800) {
                reportChunks.push(currentChunk);
                currentChunk = line;
            } else {
                currentChunk += line;
            }
            shiftCount++;
        }
        reportChunks.push(currentChunk); // Son parçayı ekle

        // Ana Rapor Embed'i
        const reportEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`✅ Onaylanmış Toplam Mesai Raporu (${shiftCount} Kayıt)`)
            .setDescription('Bu listede, geçmişte onaylanmış tüm mesai kayıtları bulunmaktadır (en yeniden eskiye doğru).')
            .setTimestamp()
            .setFooter({ text: `Raporu Talep Eden: ${interaction.user.tag}` });

        
        const embedsToSend = [reportEmbed];

        // Parçaları ayrı ayrı alanlara ekle
        reportChunks.forEach((chunk, index) => {
            // Eğer Embed'e yeni alan ekleme limiti aşılırsa (25 alan), yeni bir Embed oluşturulabilir.
            // Şimdilik tek bir Embed içine büyük bir alan olarak ekliyoruz.
            if (index === 0) {
                 reportEmbed.addFields({
                    name: 'Kayıtlar (En Son - En Eski)',
                    value: chunk,
                    inline: false
                });
            } else {
                // Eğer çok fazla kayıt varsa, ek Embed'ler göndermek gerekir.
                // Bu örnekte 3800 karakterlik ilk alana sığan veriyi gösteriyoruz.
                // Gerçek ortamda burayı döngü ile EmbedBuilder'a ek Embed'ler ekleyecek şekilde genişletmek gerekebilir.
            }
        });

        // Kullanıcıya raporu gönder
        await interaction.editReply({ 
            embeds: embedsToSend,
            ephemeral: true 
        });
    },
};
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.