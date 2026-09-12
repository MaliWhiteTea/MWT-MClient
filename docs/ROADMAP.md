# Yol haritası

Bu yol haritası tarih veya sürüm numarası taahhüdü vermez. Aşamalar, önce güvenlik sınırlarını doğrulayıp sonra kullanıcı yüzeyini genişletecek sırada düzenlenmiştir.

## Aşama 0 — Temel belgeler

- Ürün kapsamı, mimari, güvenlik, veri modeli ve karar kaydı
- `.mwtsk` dilinin güvenlik sınırı ve ortak model ilkesi
- Platform, lisans ve katkı kuralları
- Açık kararların sahiplik ve kabul ölçütleriyle kapatılması

## Aşama 1 — İlk sürüm temeli

- Node.js + TypeScript kontrol düzlemi; Fastify `/api/v1` REST/JSON ve SSE sözleşmeleri
- Sürümlü/şema doğrulamalı child-process IPC zarfları ve yalnız Mineflayer’ı kabul eden `BotEngine` sınırı
- SQLite tek-yazar katmanı, açık/checksum’lı ileri migration ve recovery snapshot temeli
- React + TypeScript panel kabuğu, Türkçe i18n kaynakları, açık/koyu tema ve mobil düzen
- Yalnız loopback HTTP ilk kurulum, tek yönetici ve ayrı LAN HTTPS durum makinesi
- Windows DPAPI ve Linux/systemd credential tabanlı güvenli kasa adapter’ları
- Yerel CA oluşturma, manuel istemci güveni ve otomatik leaf yenileme
- Platforma uygun düşük yetkili servis hesabı, yerel yönetici kurtarma ve servis yaşam döngüsü

Çıkış koşulu: yönetici öncesi LAN erişiminin mümkün olmadığı, sırların düz metne düşmediği ve üç platformda servis davranışının doğrulandığı bir temel.

## Aşama 2 — Mineflayer bot yönetimi

- Ayrı hesap, sunucu ve bot profili yönetimi
- Microsoft cihaz giriş akışı ve offline hesaplar
- Her bot için ayrı Mineflayer worker süreci
- Otomatik/elle Minecraft sürümü seçimi
- Hata sınıflı otomatik yeniden bağlanma, sınırlı worker restart bütçesi ve görünür `attention_required` durumu
- Profil bazlı isteğe bağlı cihaz başlangıcında otomatik başlatma
- Sır temizlenmiş loglar; 14 gün veya 250 MB saklama

Çıkış koşulu: worker arızasının diğer botları veya paneli düşürmediği ve aynı hesabın birden fazla profilde uygulama kaynaklı kilit olmadan kullanılabildiği bir bot yaşam döngüsü.

## Aşama 3 — Güvenli `.mwtsk` temeli

- Sürümlemeli ayrıştırıcı, AST, doğrulayıcı ve kararlı biçimleyici
- Sınırlandırılmış yorumlayıcı ile izinli Mineflayer yetenekleri
- Metin editörü
- İçe aktarma, etki özeti, içerik-hash bağlı onay ve etkinleştirme akışı
- Script başına seri FIFO, merkezi kararlı eylem broker’ı, ölçülmüş kaynak/kuyruk/hız kotaları ve kötü niyetli girdi testleri
- Görsel editörün ileride kullanacağı ortak model sözleşmesi

Çıkış koşulu: geçersiz veya onaysız içe aktarımın çalışmadığı ve scriptin sistem API’lerine erişemediği doğrulanmış bir çalışma zamanı.

## Aşama 4 — Paketleme ve ilk halka açık sürüm hazırlığı

- Yalnız sistem servisi kurulum modelinin uçtan uca doğrulanması; kullanıcı oturumuna özel taşınabilir kurulumun ilk sürüm paketlerinden çıkarılması
- Windows x64 için özel Node.js runtime içeren MSI/WinSW paketi
- Systemd tabanlı Linux x64 ve Raspberry Pi OS ARM64 için özel runtime içeren mimariye özel `tar.gz`, kur/kaldır betiği ve unit
- Kullanıcı verisini varsayılan koruyan kaldırma ve açık “tüm verileri kaldır” seçeneği
- Sır/admin doğrulayıcısı içermeyen `.mwtbackup` dışa aktarımı ve LAN-kapalı bootstrap restore’u
- Kimliksiz, yalnız kullanıcı eylemiyle sürüm metadata kontrolü ve elle yükseltme yolu
- Güvenlik, yükseltme, kurtarma ve uyumluluk belgeleri
- Lisans/üçüncü taraf bildirimleri ve sürüm kabul testleri
- Kesin hesap/organizasyon kararı sonrasında herkese açık GitHub deposu ve GitHub Releases üzerinde kurulabilir paketler

## Sonraki sürümler için ayrılmış işler

- HeadlessMC motor uygulaması ve ancak hazır olduğunda panel seçeneği
- Özel domain
- Özel domain sonrasında ACME/Let’s Encrypt sertifika yönetimi
- Crowdin bağlantısı
- Türkçe dışındaki ek panel dilleri
- TPM desteği
- Gelişmiş görsel script editörü
- İmzalı otomatik güncelleme
- Gereksinim oluşursa birden fazla panel kullanıcısı ve roller
- İsteğe bağlı editör/VS Code `.mwtsk` sözdizimi desteği

Bu maddelerin sırası ve sürüm eşlemesi henüz kararlaştırılmamıştır.

## Sürekli kalite kapıları

- Güvenlik sınırı ve sır sızıntısı testleri
- Üç hedef mimaride derleme/çalışma doğrulaması
- Erişilebilirlik, mobil düzen ve açık/koyu tema kontrolleri
- Türkçe kaynak metin ile i18n anahtar bütünlüğü
- Belgeler, uygulama davranışı ve karar kaydı tutarlılığı

## Açık kararlar

Tam liste `docs/DECISIONS.md` içindedir. Microsoft özelliğinin yayınından önce uygulama kaydı (O-102), bot uyumluluk çıkışından önce Minecraft matrisi (O-103), script runtime'dan önce tetikleyici/eylem kataloğu ve ölçülmüş kotalar (O-105/O-106) kapanmalıdır. Linux destek tabanı (O-101), yedek şifreleme deneyimi (O-104) ve kesin GitHub hesap/organizasyon/depo adresi (O-108) halka açık paketleme öncesi gereklidir; sonraki görsel editör kapsamı (O-107) ilk sürümü engellemez.
