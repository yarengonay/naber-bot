# 📊 PROJECT_STATUS.md — Naber Bot

> Bu dosya, projenin her adımda güncel durumunu özetler. Başka bir AI'a geçiş yapman gerekirse bu dosyayı ona oku, kaldığımız yerden devam edebilirsin.

**Son güncelleme:** Adım 4 — Bakiye gönderimi sonrasındaki Horizon indexleme gecikmesinden kaynaklanan bakiye gösterim hatası düzeltildi

---

## 🐛 Bulunan ve Düzeltilen Hatalar

1. **Çift karşılama mesajı:** React'in geliştirme modunda (`StrictMode`) `useEffect`'in iki kez tetiklenmesinden kaynaklanıyordu. `didInit` ref ile guard eklendi, artık sadece bir kez çalışıyor.
2. **"Bağlanıyorum..." mesajında sonsuza kadar takılma:** `connectWallet()` fonksiyonu Freighter popup'ı açılmazsa/yanıt vermezse hiç çözülmeyen bir promise'e takılıyordu. İki düzeltme yapıldı:
   - `setAllowed()` çağrısı `requestAccess()`'tan önce eklendi (Freighter popup'ını daha güvenilir tetikliyor)
   - 30 saniyelik zaman aşımı eklendi (`Promise.race`), süre dolunca kullanıcıya "Freighter ikonuna tıklayıp açık mı kontrol et" mesajı gösteriliyor
3. **Bakiye gönderim sonrası eski bakiye gösterilmesi:** Gönderimden sonra Horizon ağının işlemi indexlemesi birkaç saniye sürebildiği için, otomatik veya manuel bakiye yenilemeleri eski bakiyeyi çekerek arayüzdeki iyimser bakiyeyi eziyordu. Başarılı gönderim sonrasında hesaplanan iyimser bakiye `localStorage`'da 30 saniye süreyle saklanarak, Horizon güncellenene kadar arayüzde gösterilmesi sağlandı.

---

## 1. Projenin Amacı ve Teknolojileri

**Amaç:** "Naber Bot" — Stellar testnet üzerinde çalışan, kullanıcıyla sohbet eden bir cüzdan asistanı. Kullanıcı Freighter cüzdanını bağlar, bot konuşma diliyle bakiyesini söyler, XLM göndermesine yardım eder ve işlem sonucunu (başarı/hata) chatbot tarzında bildirir.

**Bu proje, "Stellar Frontend Challenge" (Beyaz Kuşak seviyesi) gereksinimlerini karşılamak için yapılıyor.**

**Teknolojiler:**
- **Frontend:** React 19 (Vite ile)
- **Stellar entegrasyonu:** `@stellar/freighter-api` (cüzdan bağlantısı/imza), `@stellar/stellar-sdk` (Horizon sorguları, işlem oluşturma)
- **Ağ:** Stellar Testnet (Horizon: `https://horizon-testnet.stellar.org`, Friendbot ile otomatik fonlama)
- **Stil:** Sade CSS (framework yok), CSS custom properties ile token sistemi
- **Fontlar:** Space Grotesk (başlık/bot), Inter (gövde), JetBrains Mono (adres/bakiye/hash)

**Tasarım yönü:** Koyu tema, tek vurgu rengi (#6C5CE7 mor/indigo), modern startup hissi (Linear/Vercel tarzı). Chatbot arayüzü: mesaj balonları + alt kısımda duruma göre değişen aksiyon paneli (buton/form).

---

## 2. Klasör ve Dosya Yapısı

```
naber-bot/
├── index.html                  # Ana HTML, başlık: "Naber Bot — Stellar Testnet Asistanı"
├── package.json
├── src/
│   ├── main.jsx                 # React giriş noktası
│   ├── App.jsx                  # Ana bileşen - tüm state ve akış mantığı burada
│   ├── App.css                  # Layout, chat balonları, butonlar, animasyonlar
│   ├── index.css                # Global tokenlar (renk/font), reset
│   ├── components/
│   │   ├── StatusBar.jsx        # Üst çubuk: bağlantı durumu, bakiye, bağlantı kesme
│   │   ├── ChatBubble.jsx       # Tek mesaj balonu (bot/kullanıcı/sistem)
│   │   ├── TypingIndicator.jsx # "Bot yazıyor..." animasyonu
│   │   └── ActionPanel.jsx     # Alt panel: bağlan butonu / ödeme formu / onay butonları
│   ├── lib/
│   │   ├── stellar.js           # Freighter + Stellar SDK fonksiyonları (bağlan, bakiye, ödeme gönder)
│   │   └── messages.js          # Bot'un tüm konuşma metinleri tek yerden yönetiliyor
│   └── hooks/                   # (henüz boş, gerekirse custom hook'lar buraya)
├── public/                      # (favicon kaldırıldı, default data URI kullanılıyor)
└── PROJECT_STATUS.md            # Bu dosya
```

---

## 3. Mevcut Aşama (Tamamlananlar)

✅ **Proje iskeleti kuruldu** — Vite + React, gerekli paketler (`@stellar/freighter-api`, `@stellar/stellar-sdk`) yüklendi.

✅ **Stellar entegrasyon katmanı (`src/lib/stellar.js`)** yazıldı:
- `checkFreighterInstalled()` — eklenti kurulu mu kontrolü
- `connectWallet()` — bağlantı izni isteme + ağ kontrolü
- `checkExistingPermission()` — önceden verilmiş izni kontrol edip otomatik bağlanma
- `fetchBalance()` — Horizon'dan XLM bakiyesi çekme (hesap yoksa "0" döner)
- `fundWithFriendbot()` — testnette hesabı otomatik fonlama
- `sendPayment()` — işlem oluşturma, Freighter ile imzalama, ağa gönderme
- `fetchRecentTransactions()` — son işlemler (ileride kullanılabilir, henüz UI'da gösterilmiyor)

✅ **Bot konuşma katmanı (`src/lib/messages.js`)** yazıldı — tüm bot mesajları (karşılama, bağlanma, bakiye, ödeme akışı, hata durumları) tek dosyada, tutarlı ses tonuyla.

✅ **UI bileşenleri** yazıldı:
- `StatusBar` — bağlantı durumu rozeti, kısaltılmış adres, bakiye, "Bağlantıyı kes" butonu
- `ChatBubble` — bot/kullanıcı mesaj balonları, `**kalın**` metin desteği
- `TypingIndicator` — zıplayan nokta animasyonu
- `ActionPanel` — duruma göre değişen alt panel (connect/idle/payment-form/payment-confirm/busy)

✅ **App.jsx akışı** kuruldu:
1. Açılışta hoş geldin mesajı → Freighter kurulu mu kontrolü → önceki izin varsa otomatik bağlan
2. Bağlan butonu → `connectWallet()` → bağlandı mesajı → otomatik bakiye sorgusu (bakiye 0 ise Friendbot ile fonlama denemesi)
3. "Bakiyemi göster" / "XLM gönder" aksiyonları (idle durumunda)
4. Ödeme formu → adres/tutar validasyonu (regex + sayı kontrolü + yetersiz bakiye kontrolü) → onay adımı → Freighter ile imzalama → ağa gönderme → sonuç mesajı (başarı/red/hata)
5. Bağlantı kesme akışı

✅ **Build testi başarılı** (`npm run build` hatasız tamamlandı).

✅ **Ekstra Özellikler Eklendi:**
- Son 5 işlem geçmişini Horizon'dan çekip zengin ve tıklanabilir linklerle chat ekranında gösterme (`fetchRecentTransactions`) tamamlandı.
- Adres defteri (Address Book) kaydetme, silme ve ödeme formunda dropdown ile seçebilme özelliği (`localStorage` tabanlı) tamamlandı.
- Bot kişilik seçimi (Dost Canlısı, Ciddi/Teknik, Havalı) üst bara select kutusu olarak eklendi ve tüm bot mesaj şablonları buna göre zenginleştirildi.
- Zengin mesajlarda `[etiket](url)` formatındaki markdown linklerinin tıklanabilir yapılması sağlandı.

✅ **README.md teslimat gereksinimlerine göre yazıldı ve tamamlandı.**

🔲 **Kullanıcı Tarafında Yapılması Gerekenler:**
- `npm run dev` ile yerel sunucuyu açıp tarayıcıda Freighter ile test etmek.
- README.md dosyasında belirtilen adımlardaki ekran görüntülerini çekip `./docs/` klasörüne kaydetmek.
- Projeyi GitHub deposuna push edip başvuru formuna linki göndermek.

---

## 4. Sıradaki Adımlar

1. Uygulamayı `npm run dev` ile yerel ortamda açıp test edin.
2. İşlem sonrasında ekran görüntülerini alıp `README.md` dosyasındaki yer tutuculara yerleştirin.
3. Projeyi GitHub'a yükleyip Stellar Frontend Challenge formunu doldurun.

---

## Önemli Notlar / Kararlar

- Ödeme akışı **chat + form karışımı**: bot doğal dilde soruyor ama kullanıcı serbest metin yazmak zorunda kalmıyor, buton/form ile cevaplıyor (güvenilirlik için).
- Adres validasyonu: Stellar public key formatı `^G[A-Z0-9]{55}$` regex ile kontrol ediliyor.
- Hesap testnette hiç yoksa (`404` hatası) otomatik olarak Friendbot'tan fon isteniyor.
- Tasarım dili: koyu tema + tek mor/indigo vurgu rengi, kullanıcı "yurt dışı startup hissi, sen seç" dedi, bu yönde karar verildi.
