# Ürün tanımı

## Amaç

MWT-MClient, teknik ayrıntıları gerektiğinde erişilebilir tutarken Mineflayer botlarını yerel bir cihazda güvenli ve anlaşılır biçimde kurmayı, çalıştırmayı ve izlemeyi sağlayan açık kaynak bir yönetim uygulamasıdır.

## Hedef kullanıcı ve kullanım bağlamı

İlk sürüm, kendi Windows x64, Linux x64 veya Raspberry Pi OS ARM64 cihazında bot çalıştıran tek bir panel yöneticisini hedefler. Yalnız sistem servisi kurulum modeli desteklenir; kullanıcı oturumuna özel taşınabilir kurulum ilk sürüm kapsamında değildir. Panel aynı cihazdan veya güvenilen yerel ağdan kullanılabilir. İnternete açık, çok kiracılı bir barındırma hizmeti hedeflenmez.

## Deneyim ilkeleri

- Varsayılan arayüz modern, sade, mobil uyumlu ve Türkçedir.
- Açık ve koyu tema desteklenir.
- Kullanıcıya dönük bütün metinler ilk günden i18n anahtarlarıyla yönetilir.
- Bağlantı ayrıntıları, ham hata bilgileri ve worker tanılama verileri “Gelişmiş görünüm” altında sunulur.
- Script anahtar kelimeleri ve tanımlayıcı sözleşmesi İngilizcedir; panel ve wiki çevrilebilir.

## İlk sürüm kapsamı

### Güvenli ilk kurulum

1. Yeni kurulum yalnızca localhost üzerinde erişilebilir olur.
2. Kullanıcı tek panel yöneticisini oluşturur.
3. Sihirbaz belirli sayıda hesap, sunucu veya bot profili oluşturmayı zorunlu kılmaz; kullanıcı hiç eklemeden bitirebilir veya ihtiyacı kadar ekleyebilir.
4. Yönetici oluşmadan LAN erişimi etkinleştirilemez.
5. Yönetici isterse HTTPS üzerinden LAN erişimini ve cihaz başlangıcında otomatik çalışmayı etkinleştirir.
6. Uygulama yönlendiricide otomatik port açmaz ve dış internet yayını yapılandırmaz.

### Yönetilen varlıklar

- **Hesap:** Microsoft veya offline Minecraft kimliği ve güvenli kasa referansları.
- **Sunucu:** Adres, port ve tercih edilen/otomatik Minecraft sürümü gibi bağlantı bilgileri.
- **Bot profili:** Hesap ile sunucuyu bir çalışma yapılandırmasında birleştiren, script ve yeniden bağlanma ayarlarını taşıyan varlık.

Aynı hesap birden fazla bot profilinde ve sunucuda eşzamanlı kullanılabilir. MWT-MClient buna yapay bir sınır koymaz; dış hizmetlerin uyguladığı sınırlar kullanıcıya anlaşılır biçimde bildirilir.

Uygulama hesap, sunucu veya bot profili sayısı için sabit ürün limiti koymaz. Bu varlıklar kurulumdan sonra panelden eklenebilir, değiştirilebilir ve güvenli başvuru bütünlüğü kurallarıyla kaldırılabilir.

### Bot çalıştırma

- İlk sürümde yalnızca Mineflayer motoru bulunur.
- Her bot örneği ayrı worker sürecinde çalışır.
- Minecraft sürümü otomatik algılanabilir veya kullanıcı tarafından seçilebilir.
- Beklenmeyen bağlantı kesilmelerinde otomatik yeniden bağlanma uygulanır.
- Çöken worker, sınırlandırılmış ve gecikmeli bir kurtarma politikasıyla yeniden başlatılır; sürekli çökme döngüsü görünür bir hata durumuna geçer.
- Kullanıcı isterse seçili bot profilleri cihaz başlangıcında otomatik başlar.

### Kimlik doğrulama ve sırlar

- Microsoft hesapları cihaz giriş akışıyla bağlanır; Microsoft parolası uygulamaya girilmez ve saklanmaz.
- Offline hesaplar desteklenir ve çevrimdışı kimliğin güvenlik niteliği arayüzde açıkça belirtilir.
- Tokenlar ve kullanıcı tanımlı script sırları işletim sistemine uygun güvenli kasa katmanında saklanır.

### Panel ve gözlemlenebilirlik

- Botların durum, bağlantı ve kontrollü eylemleri panelden yönetilir.
- Loglar varsayılan olarak en fazla 14 gün veya toplam 250 MB tutulur; eşiklerden ilkine ulaşınca eski kayıtlar temizlenir.
- Telemetri bulunmaz; ürün dışına varsayılan ölçüm veya kullanım verisi gönderilmez.

### Scriptler

- Girinti tabanlı, doğal İngilizce okunan ve Spigot Skript’ten esinlenen `.mwtsk` DSL kullanılır.
- Spigot Skript ile kaynak veya çalışma zamanı açısından birebir uyumluluk iddia edilmez.
- İlk sürüm metin editörü sunar. Sonraki görsel editör aynı belge/AST modelini paylaşacak ve kayıplı düzenleme yapmayacaktır.
- Scriptler sınırlandırılmış yeteneklerle çalışır; dosya sistemi, işletim sistemi komutları ve sınırsız ağ erişimi yoktur.
- İçe aktarılan script önce ayrıştırılır ve doğrulanır; gösterilen izin/etki özeti kullanıcı tarafından onaylanmadan çalışmaz.

### Yaşam döngüsü

- Sistem bileşeni ayrı, düşük yetkili bir işletim sistemi kullanıcısıyla servis olarak çalışır.
- Kaldırıcı varsayılan olarak kullanıcı verilerini korur; tüm verileri kaldırma ayrıca ve açıkça seçilebilir.
- Gizli tokenlar, parolalar, yönetici parola doğrulayıcısı, oturumlar, kasa referans/değerleri ve TLS özel anahtarları kullanıcı yedeğine dahil edilmez. Geri yükleme LAN kapalı bootstrap durumuna döner.

## İlk sürüm dışında

- HeadlessMC uygulaması ve panel seçeneği
- Özel domain yönetimi
- Crowdin bağlantısı
- TPM destekli anahtar koruması
- Gelişmiş görsel script editörü
- İmzalı otomatik güncelleme
- Birden fazla panel yöneticisi veya rol tabanlı yetkilendirme
- İnternete otomatik yayınlama ya da otomatik port açma
- Kullanıcı oturumuna özel taşınabilir kurulum

## Kabul ölçütleri

- Desteklenen üç platform için kurulum ve servis yaşam döngüsü doğrulanmıştır.
- LAN erişimi yönetici öncesinde kapalı, sonrasında yalnızca açık kullanıcı seçimiyle HTTPS olarak açılabilir.
- Bir worker çökmesi kontrol düzlemini veya diğer bot worker’larını düşürmez.
- Yedek ve log örneklerinde token/parola bulunmadığı otomatik testlerle doğrulanır.
- Aynı hesabı kullanan birden fazla bot profili uygulama kaynaklı kilit olmadan başlatılabilir.
- `.mwtsk` metni, AST round-trip’i ve içe aktarma aynı sürümleme/doğrulama hattından geçer; kaynak değişikliği eski onayı geçersiz kılar.

## Açık kararlar

Ürün deneyimini etkileyen kesinleşmemiş konular `docs/DECISIONS.md` içindeki “Açık kararlar” bölümünde tek kaynak olarak tutulur.
