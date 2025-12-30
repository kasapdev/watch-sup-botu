const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

const AVAILABLE_SHIFTS = [
    { label: "20:00 - 21:00", value: "2000-2100" },
    // ... diğer saatler
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mesai_sec')
        .setDescription('Mesai saatini seçmek için kullanılır.'),
    async execute(interaction) {
        // SELECT MENU oluşturma ve kullanıcıya gönderme mantığı buraya gelir.
        const select = new StringSelectMenuBuilder()
            .setCustomId('select_shift') // Bu ID interactionCreate içinde işlenecek!
            .setPlaceholder('Mesai saatini seçin...')
            .addOptions(AVAILABLE_SHIFTS.map(s => 
                new StringSelectMenuOptionBuilder().setLabel(s.label).setValue(s.value)
            ));

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: 'Hangi mesai saatini talep ediyorsunuz?',
            components: [row],
            ephemeral: true,
        });
    },
};
//kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.