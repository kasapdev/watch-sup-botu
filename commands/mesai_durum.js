const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mesai_durum')
        .setDescription('Bugün için onaylanmış tüm mesaileri gösterir.'),
        
    async execute(interaction, client, dataFunctions) {
        // DeferReply kullanarak botun yanıt verdiğini belirt
        await interaction.deferReply();
        
        const { loadShifts } = dataFunctions;
        const shifts = loadShifts();
        
        // Sadece onaylanmış mesaileri filtrele
        const approvedShifts = shifts.filter(s => s.status === 'approved');
        
        if (approvedShifts.length === 0) {
            return interaction.editReply({ content: 'Bugün için onaylanmış mesai bulunmamaktadır.' });
        }
        
        const shiftMap = {};
        
        // Mesaileri saat dilimine göre grupla
        approvedShifts.forEach(shift => {
            const shiftTime = shift.shiftStart + '-' + shift.shiftEnd;
            if (!shiftMap[shiftTime]) {
                shiftMap[shiftTime] = [];
            }
            // Kullanıcıyı etiketleyerek listeye ekle
            shiftMap[shiftTime].push(`<@${shift.userId}>`);
        });

        const embed = new EmbedBuilder()
            .setColor('#f8c300')
            .setTitle('📆 BUGÜNKÜ ONAYLANMIŞ MESAİ LİSTESİ')
            .setDescription('Bu liste her gün 03:00\'da sıfırlanır.');

        let hasFields = false;
        
        for (const [time, users] of Object.entries(shiftMap)) {
            const timeLabel = time.replace(/(\d{2})(\d{2})-(\d{2})(\d{2})/, '$1:$2 - $3:$4');
            embed.addFields({
                name: `⏰ ${timeLabel} Mesaisi`,
                value: users.join(', '),
                inline: false,
            });
            hasFields = true;
        }

        if (hasFields) {
             await interaction.editReply({ embeds: [embed] });
        } else {
             await interaction.editReply({ content: 'Bugün için onaylanmış mesai bulunmamaktadır.' });
        }
    },
};
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.