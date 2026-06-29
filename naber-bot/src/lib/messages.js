// GuíaOrbita'nın konuşma tarzını tek bir yerden yönetiyoruz.
// Her fonksiyon bir durumu, bot'un sesiyle bir mesaj nesnesine çevirir.

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `msg-${Date.now()}-${idCounter}`;
}

function botMsg(text, variant = "default") {
  return { id: nextId(), sender: "bot", variant, text };
}

function userMsg(text) {
  return { id: nextId(), sender: "user", variant: "default", text };
}

function systemMsg(text, variant = "default") {
  return { id: nextId(), sender: "system", variant, text };
}

function shortAddress(address) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

const templates = {
  friendly: {
    welcome: "Merhaba, ben GuíaOrbita. Harika bir gün dilerim! Cüzdanını bağlayarak başlayalım mı? 😊",
    freighterNotFound: "Freighter eklentisi bulunamadı. Devam edebilmemiz için önce tarayıcına kurman gerekiyor. Yardıma ihtiyacın olursa buradayım!",
    connecting: "Hemen cüzdanına bağlanıyorum, çok az bekleteceğim. 🚀",
    connected: (addr) => `Merhaba! Cüzdanın bağlandı. Adres: ${shortAddress(addr)}`,
    wrongNetwork: (net) => `Şu an ${net} ağındasın ama benimle Testnet'te çalışman gerekiyor. Cüzdanından Testnet'e geçiş yapar mısın? 🙏`,
    checkingBalance: "Hemen bakiyeni kontrol ediyorum...",
    balanceZeroFunding: "Görünüşe göre hesabın testnette henüz yok. Senin için test XLM'i istiyorum, biraz bekle...",
    balanceFunded: "Hesabını test XLM'i ile fonladım. Bakiyene tekrar bakıyorum...",
    balanceResult: (bal) => `Şu an ${bal} XLM'in var.`,
    balanceSyncPending: "İşlem onaylandı. Bakiye birkaç saniye içinde ağda güncellenecek; üst çubuktaki tutar şimdilik tahminidir.",
    balanceError: "Bakiyeni alırken bir sorun oldu. Bağlantını kontrol edip tekrar dener misin?",
    askPaymentDetails: "Lütfen alıcı adresini ve göndermek istediğin tutarı girer misin? ✨",
    invalidAddress: "Bu adres bana doğru gelmedi. Stellar adresleri 'G' ile başlar ve 56 karakter uzunluğundadır. Tekrar kontrol eder misin?",
    invalidAmount: "Tutarı pozitif bir sayı olarak yazmalısın, örneğin 5 ya da 1.5. Yeniden dener misin?",
    insufficientBalance: (bal) => `Bu kadar gönderemezsin, çünkü şu an sadece ${bal} XLM'in var.`,
    confirmPayment: (amt, dest) => `Onaylıyor musun? ${amt} XLM şu adrese gönderilecek: ${shortAddress(dest)}`,
    sendingPayment: "İşlemi imzalaman için Freighter'ı açtım, onaylar mısın? ✍️",
    submittingPayment: "İşlem ağa gönderiliyor...",
    paymentSuccess: (amt, hash, led) => `İşlem başarılı! Gönderilen: ${amt} XLM. Ledger: ${led}. \n[StellarExpert'te Görüntüle](https://stellar.expert/explorer/testnet/tx/${hash})`,
    paymentRejected: "İşlemi Freighter'da onaylamadın, bu yüzden gönderim iptal oldu.",
    paymentFailed: (reason) => `İşlem başarısız oldu. Sebep: ${reason}`,
    disconnected: "Görüşürüz! Cüzdan bağlantını kestim.",
    genericError: (det) => `Bir şeyler ters gitti. ${det ? det : ""} Tekrar dener misin?`,
    personalityChanged: "Konuşma tarzımı 'Dost Canlısı' olarak güncelledim! Sana yardımcı olmak için sabırsızlanıyorum. 😊",
    txListHeader: "İşte hesabına ait son işlemler:",
    txListItem: (type, amt, target, time, hash) => `**[${type}]** ${amt} XLM ${type === 'Gönderim' ? '→' : '←'} ${shortAddress(target)} (${time}) \n[İşlem Detayı](https://stellar.expert/explorer/testnet/tx/${hash})`
  },
  technical: {
    welcome: "[SYSTEM] GuíaOrbita terminali aktif. Freighter cüzdan bağlantısı bekleniyor...",
    freighterNotFound: "[ERROR] Freighter API bağlantısı kurulamadı. Lütfen eklentiyi tarayıcınıza kurun.",
    connecting: "[SYSTEM] Bağlantı isteği işleniyor. Freighter API ile el sıkışılıyor...",
    connected: (addr) => `[SUCCESS] Cüzdan bağlandı. Adres: ${shortAddress(addr)}`,
    wrongNetwork: (net) => `[ERROR] Uyumsuz ağ tespiti: ${net}. Lütfen cüzdan ayarını TESTNET ağına getirin.`,
    checkingBalance: "[QUERY] Horizon API'den bakiye bilgisi çekiliyor...",
    balanceZeroFunding: "[WARN] Hesap testnette tanımsız (404). Friendbot API tetikleniyor...",
    balanceFunded: "[SUCCESS] Hesap Friendbot tarafından fonlandı. Yeniden sorgulanıyor...",
    balanceResult: (bal) => `[DATA] Güncel bakiye: ${bal} XLM.`,
    balanceSyncPending: "[INFO] İşlem başarılı. Defter kapatma (ledger close) bekleniyor; üst bar tahmini bakiye gösteriyor.",
    balanceError: "[FATAL] Horizon API sorgusu başarısız oldu. Bağlantıyı kontrol edin.",
    askPaymentDetails: "[INPUT] Lütfen alıcı adresini (Stellar PublicKey) ve transfer tutarını girin.",
    invalidAddress: "[VALIDATION_ERROR] Geçersiz Stellar adresi. Format: G ile başlayan 56 karakterlik PublicKey.",
    invalidAmount: "[VALIDATION_ERROR] Geçersiz tutar. Değer pozitif bir reel sayı olmalıdır.",
    insufficientBalance: (bal) => `[ERROR] Yetersiz bakiye. Mevcut bakiye: ${bal} XLM.`,
    confirmPayment: (amt, dest) => `[CONFIRM] İşlemi onaylayın: ${amt} XLM -> ${shortAddress(dest)}`,
    sendingPayment: "[FREIGHTER] İşlem imzası bekleniyor...",
    submittingPayment: "[TX_SUBMIT] İmzalanmış XDR, Horizon sunucusuna gönderiliyor...",
    paymentSuccess: (amt, hash, led) => `[TX_SUCCESS] Transfer onaylandı. Miktar: ${amt} XLM. Ledger: ${led}. \n[Detaylar için StellarExpert](https://stellar.expert/explorer/testnet/tx/${hash})`,
    paymentRejected: "[TX_ABORT] İşlem kullanıcı tarafından reddedildi.",
    paymentFailed: (reason) => `[TX_ERROR] İşlem başarısız. Hata kodu: ${reason}`,
    disconnected: "[SYSTEM] Cüzdan bağlantısı kesildi. Oturum sonlandırıldı.",
    genericError: (det) => `[SYSTEM_ERROR] Beklenmeyen hata oluştu. Detay: ${det ? det : 'Yok'}`,
    personalityChanged: "[SYSTEM] Dil modeli parametreleri 'Technical' moduna geçirildi. Sorgulara hazır. 💻",
    txListHeader: "[QUERY_SUCCESS] Son işlem kayıtları listeleniyor:",
    txListItem: (type, amt, target, time, hash) => `[${type.toUpperCase()}] ${amt} XLM - Target: ${shortAddress(target)} (${time}) \n[Detaylar](https://stellar.expert/explorer/testnet/tx/${hash})`
  },
  cool: {
    welcome: "Selam dostum! Ben GuíaOrbita. Gel cüzdanı bağlayalım da hemen uçuşa geçelim. 😎",
    freighterNotFound: "Freighter eklentisini bulamadım kanka. Devam etmek için onu kurman şart.",
    connecting: "Bağlanıyoruz bakalım... Beklemede kal, geliyorum. ⚡",
    connected: (addr) => `Tamamdır! Cüzdanı bağladık. Adres: ${shortAddress(addr)}`,
    wrongNetwork: (net) => `${net} ağındasın kanka ama bize Testnet lazım. Bi' el atıp cüzdandan Testnet'i seçiver.`,
    checkingBalance: "Bakiyeni sorguluyorum, hemen geliyorum...",
    balanceZeroFunding: "Senin cüzdan bomboş, testnette kaydın bile yok. Dur hemen Friendbot'tan birkaç bin XLM kapıp geleyim...",
    balanceFunded: "Fonlama işi tamam! Bakiyene tekrar bakıyorum...",
    balanceResult: (bal) => `Hesapta şu an tam ${bal} XLM var. Fena değil!`,
    balanceSyncPending: "İşlem bitti sayılır. Ağın güncellemesi birkaç saniyeyi bulur, yukarısı şimdilik tahmini yani.",
    balanceError: "Bakiyeyi çekemedim. İnterneti bi' kontrol et de tekrar dene kanka.",
    askPaymentDetails: "Hadi gönderelim! Alıcı adresi ve miktar alayım hemen.",
    invalidAddress: "Bu adres yanlış kanka. 'G' ile başlaması ve 56 karakter olması lazım, bi' kontrol et istersen.",
    invalidAmount: "Miktar dediğin düzgün bir sayı olur kanka, 5 ya da 1.5 gibi. Bi' göz at.",
    insufficientBalance: (bal) => `Cebinde o kadar para yok kanka, toplamda sadece ${bal} XLM'in var.`,
    confirmPayment: (amt, dest) => `Gönderiyorum ha? ${amt} XLM şu adrese gidiyor: ${shortAddress(dest)}`,
    sendingPayment: "İmza için Freighter'ı açtım, bi' el atıp onayla kanka.",
    submittingPayment: "İşlemi ağa fırlatıyorum, beklemede kal...",
    paymentSuccess: (amt, hash, led) => `Uçuş başarılı! ${amt} XLM gitti bile. Ledger: ${led}. \n[StellarExpert'ten bak](https://stellar.expert/explorer/testnet/tx/${hash})`,
    paymentRejected: "İşlemi iptal ettin kanka, para cepte kaldı.",
    paymentFailed: (reason) => `Hadi ya, işlem patladı. Sebep: ${reason}`,
    disconnected: "Kaçtım ben! Cüzdanla bağı kopardım.",
    genericError: (det) => `Bi' şeyler ters gitti kanka. ${det ? det : ''} Bi' daha denesene.`,
    personalityChanged: "Tamamdır şef, artık 'Havalı' moddayız. İşleri hızlıca halledelim! 😎",
    txListHeader: "Şöyle bi' geçmişe baktım da, son hareketlerin bunlar:",
    txListItem: (type, amt, target, time, hash) => `**[${type === 'Gönderim' ? 'Gönderilen' : 'Gelen'}]** ${amt} XLM -> ${shortAddress(target)} (${time}) \n[Ayrıntılar](https://stellar.expert/explorer/testnet/tx/${hash})`
  }
};

export const messages = {
  welcome: (p) => botMsg(templates[p || "friendly"].welcome),
  freighterNotFound: (p) => botMsg(templates[p || "friendly"].freighterNotFound, "error"),
  connecting: (p) => botMsg(templates[p || "friendly"].connecting, "thinking"),
  connected: (addr, p) => botMsg(templates[p || "friendly"].connected(addr), "success"),
  wrongNetwork: (net, p) => botMsg(templates[p || "friendly"].wrongNetwork(net), "error"),
  checkingBalance: (p) => botMsg(templates[p || "friendly"].checkingBalance, "thinking"),
  balanceZeroFunding: (p) => botMsg(templates[p || "friendly"].balanceZeroFunding, "thinking"),
  balanceFunded: (p) => botMsg(templates[p || "friendly"].balanceFunded, "thinking"),
  balanceResult: (bal, p) => botMsg(templates[p || "friendly"].balanceResult(bal), "success"),
  balanceSyncPending: (p) => botMsg(templates[p || "friendly"].balanceSyncPending, "thinking"),
  balanceError: (p) => botMsg(templates[p || "friendly"].balanceError, "error"),
  askPaymentDetails: (p) => botMsg(templates[p || "friendly"].askPaymentDetails),
  invalidAddress: (p) => botMsg(templates[p || "friendly"].invalidAddress, "error"),
  invalidAmount: (p) => botMsg(templates[p || "friendly"].invalidAmount, "error"),
  insufficientBalance: (bal, p) => botMsg(templates[p || "friendly"].insufficientBalance(bal), "error"),
  confirmPayment: (amt, dest, p) => botMsg(templates[p || "friendly"].confirmPayment(amt, dest), "confirm"),
  sendingPayment: (p) => botMsg(templates[p || "friendly"].sendingPayment, "thinking"),
  submittingPayment: (p) => botMsg(templates[p || "friendly"].submittingPayment, "thinking"),
  paymentSuccess: (amt, hash, led, p) => botMsg(templates[p || "friendly"].paymentSuccess(amt, hash, led), "success"),
  paymentRejected: (p) => botMsg(templates[p || "friendly"].paymentRejected, "error"),
  paymentFailed: (reason, p) => botMsg(templates[p || "friendly"].paymentFailed(reason), "error"),
  disconnected: (p) => botMsg(templates[p || "friendly"].disconnected),
  genericError: (det, p) => botMsg(templates[p || "friendly"].genericError(det), "error"),
  personalityChanged: (p) => botMsg(templates[p || "friendly"].personalityChanged, "success"),
  txListHeader: (p) => botMsg(templates[p || "friendly"].txListHeader),
  txListItem: (type, amt, target, time, hash, p) => botMsg(templates[p || "friendly"].txListItem(type, amt, target, time, hash)),
  
  userText: (text) => userMsg(text),
  systemNote: (text, variant) => systemMsg(text, variant),
};

export { shortAddress };
