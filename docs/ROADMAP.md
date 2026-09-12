# Yol haritası

Bu yol haritası tarih veya sürüm numarası taahhüdü vermez. Aşamalar, önce güvenlik sınırlarını doğrulayıp sonra kullanıcı yüzeyini genişletecek sırada düzenlenmiştir.

## Aşama 0 — Temel belgeler

- Ürün kapsamı, mimari, güvenlik, veri modeli ve karar kaydı
- `.mwtsk` dilinin güvenlik sınırı ve ortak model ilkesi
- Platform, lisans ve katkı kuralları
- Açık kararların sahiplik ve kabul ölçütleriyle kapatılması

## Aşama 1 — İlk sürüm temeli

- Node.js + TypeScript kontrol düzlemi ve SQLite şema/migration temeli
- React + TypeScript panel kabuğu, Türkçe i18n kaynakları, açık/koyu tema ve mobil düzen
- Yalnızca localhost ilk kurulum ve tek yönetici oluşturma
- Platforma uygun düşük yetkili servis hesabı ve servis yaşam döngüsü
- Güvenli kasa soyutlaması ve hedef platform uygulamaları
- LAN erişimini yönetici sonrası açık seçimle HTTPS üzerinden etkinleştirme

Çıkış koşulu: yönetici öncesi LAN erişiminin mümkün olmadığı, sırların düz metne düşmediği ve üç platformda servis davranışının doğrulandığı bir temel.

## Aşama 2 — Mineflayer bot yönetimi

- Ayrı hesap, sunucu ve bot profili yönetimi
- Microsoft cihaz giriş akışı ve offline hesaplar
- Her bot için ayrı Mineflayer worker süreci
- Otomatik/elle Minecraft sürümü seçimi
- Otomatik yeniden bağlanma, kontrollü çökme kurtarma ve görünür durumlar
- Profil bazlı isteğe bağlı cihaz başlangıcında otomatik başlatma
- Sır temizlenmiş loglar; 14 gün veya 250 MB saklama

Çıkış koşulu: worker arızasının diğer botları veya paneli düşürmediği ve aynı hesabın birden fazla profilde uygulama kaynaklı kilit olmadan kullanılabildiği bir bot yaşam döngüsü.

## Aşama 3 — Güvenli `.mwtsk` temeli

- Sürümlemeli ayrıştırıcı, AST, doğrulayıcı ve kararlı biçimleyici
- Sınırlandırılmış yorumlayıcı ile izinli Mineflayer yetenekleri
- Metin editörü
- İçe aktarma, etki özeti, içerik-hash bağlı onay ve etkinleştirme akışı
- Kaynak/kuyruk/hız kotaları ve kötü niyetli girdi testleri
- Görsel editörün ileride kullanacağı ortak model sözleşmesi

Çıkış koşulu: geçersiz veya onaysız içe aktarımın çalışmadığı ve scriptin sistem API’lerine erişemediği doğrulanmış bir çalışma zamanı.

## Aşama 4 — Paketleme ve ilk halka açık sürüm hazırlığı

- Windows x64, Linux x64 ve Raspberry Pi OS ARM64 paketleme/kurulum yolu
- Kullanıcı verisini varsayılan koruyan kaldırma ve açık “tüm verileri kaldır” seçeneği
- Sır içermeyen yedekleme/geri yükleme davranışı
- Güvenlik, yükseltme, kurtarma ve uyumluluk belgeleri
- Lisans/üçüncü taraf bildirimleri ve sürüm kabul testleri

## Sonraki sürümler için ayrılmış işler

- HeadlessMC motor uygulaması ve ancak hazır olduğunda panel seçeneği
- Özel domain
- Crowdin bağlantısı
- TPM desteği
- Gelişmiş görsel script editörü
- İmzalı otomatik güncelleme

Bu maddelerin sırası ve sürüm eşlemesi henüz kararlaştırılmamıştır.

## Sürekli kalite kapıları

- Güvenlik sınırı ve sır sızıntısı testleri
- Üç hedef mimaride derleme/çalışma doğrulaması
- Erişilebilirlik, mobil düzen ve açık/koyu tema kontrolleri
- Türkçe kaynak metin ile i18n anahtar bütünlüğü
- Belgeler, uygulama davranışı ve karar kaydı tutarlılığı

## Açık kararlar

Dağıtım biçimleri, sertifika deneyimi, kasa uygulamaları, kurtarma eşikleri, desteklenen Minecraft sürüm matrisi ve DSL ayrıntıları çözülmeden ilgili aşamanın çıkış koşulu tamamlanmış sayılmaz. Tam liste `docs/DECISIONS.md` içindedir.
