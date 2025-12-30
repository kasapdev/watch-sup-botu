# 🛡️ Discord Staff Management & Shift System

Bu bot, ekiplerini Discord üzerinden yöneten topluluklar (oyun sunucuları, ajanslar, teknik ekipler) için tasarlanmış, tam kapsamlı bir **Vardiya ve Personel Yönetim Sistemi**dir. Personelin mesai saatlerini kayıt altına almasını, yöneticilerin bu talepleri onaylamasını ve güncel çalışma durumunun anlık olarak duyurulmasını sağlar.

---

## ✨ Öne Çıkan Özellikler

* **⚡ Hızlı Mesai Talebi:** Kullanıcılar `/mesai_sec` veya özel hazırlanmış butonlu Embed mesajı üzerinden saniyeler içinde vardiya seçebilir.
* **✅ Onay & Red Mekanizması:** Talepler belirlenen bir yönetim kanalına butonlarla düşer. Yöneticiler tek tıkla onaylayabilir veya reddedebilir.
* **🔔 Akıllı Bildirimler:** Mesai talebi sonuçlandığında, bot kullanıcıya otomatik olarak DM (Özel Mesaj) yoluyla bilgi verir.
* **📊 Canlı Durum Panosu:** `/mesai_durum_gonder` komutu ile kurulan liste, her 10 dakikada bir kendini güncelleyerek "Şu an kimler mesaide?" sorusuna yanıt verir.
* **📂 Gelişmiş Raporlama:** `/mesairapor` komutu ile geçmişe dönük tüm onaylanmış vardiyaların dökümünü alabilirsiniz.
* **🔍 Personel Denetimi:** `/rol-bilgi` komutu ile belirli bir role sahip tüm üyelerin ID'lerini listeleyebilir, veri tabanı çalışmalarınızı hızlandırabilirsiniz.
* **⏰ Otomatik Sıfırlama:** `node-cron` entegrasyonu sayesinde her gece 00:00'da onaylı listeler otomatik temizlenir ve sistem yeni güne hazırlanır.

---

## 🛠️ Komutlar ve Yetkiler

| Komut | Yetki Seviyesi | Açıklama |
| --- | --- | --- |
| `/mesai_sec` | @everyone | Bireysel mesai talebi oluşturur. |
| `/mesai_embed_gonder` | Yönetici | Kullanıcıların seçim yapacağı butonlu mesajı gönderir. |
| `/log_kur` | Yönetici | Onay/Red butonlarının gideceği kanalı ayarlar. |
| `/mesai_durum_gonder` | Yönetici | Canlı güncellenen listeyi başlatır. |
| `/mesairapor` | Yönetici | Geçmiş onaylı kayıtları listeler. |
| `/rol-bilgi` | Yönetici | Belirli bir role sahip üyelerin ID listesini verir. |
| `/onayla` / `/reddet` | Yönetici | Talepleri manuel olarak yönetmenizi sağlar. |

---

## 🚀 Kurulum Rehberi

1. **Bağımlılıklar:** Projeyi indirin ve gerekli kütüphaneleri yükleyin:
```bash
npm install

```


2. **Yapılandırma:** Bir `.env` dosyası oluşturun ve aşağıdaki alanları doldurun:
```env
DISCORD_TOKEN=BOT_TOKEN_BURAYA
CLIENT_ID=BOT_ID_BURAYA
GUILD_ID=SUNUCU_ID_BURAYA
YETKILI_ROL_ID=ONAY_YETKILI_ROL_ID_BURAYA

```


3. **Komut Kaydı:** Slash komutlarını sunucunuza tanımlayın:
```bash
node register_commands.js

```


4. **Botu Başlatın:**
```bash
node index.js

```



---

## 📂 Teknik Yapı

* **Dil:** JavaScript (Node.js)
* **Kütüphane:** Discord.js v14
* **Veri Yönetimi:** JSON (Yerel veri depolama)
* **Zamanlama:** Node-Cron & Moment.js (TR)

---

## 📜 Lisans & Yapımcı

Bu proje **MIT** lisansı ile lisanslanmıştır.

**Geliştirici:** `kasapac`

---

### ⚠️ Önemli Notlar

* **Güvenlik:** `.env`, `config.json` ve `bot_settings.json` dosyalarını GitHub'a yüklerken `.gitignore` dosyasında tutmanız önerilir.
* **Intentler:** Botun tüm özellikleri (özellikle `/rol-bilgi`) için Discord Developer Portal üzerinden **Server Members Intent** ve **Message Content Intent** yetkilerini açtığınızdan emin olun.

---

