const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady, // Olayın adı: client ready (bot hazır)
    once: true, // Sadece bir kez çalıştır
    execute(client) {
        console.log(`Giriş yapıldı: ${client.user.tag}!`);
        
        // Botun oynuyor durumunu ayarlama
        client.user.setActivity('@kasapac | Watch System', { type: ActivityType.Watching });

        // Zamanlayıcıyı başlatma (startScheduler fonksiyonunun index.js'te tanımlı olduğunu varsayar)
        // Eğer startScheduler'ı buradan çağırmak istiyorsanız, index.js'ten buraya import etmeniz gerekir.
        // Basitlik için, bu kod index.js'teki çağırma kısmını yansıtır.
        // client.startScheduler(); // Index.js'e bu fonksiyonu client'a ekleme kodu yazılmalı.
        //kasapac tarafından kodlanmıştır mit lisansı ile korunmaktadır.
    },
};