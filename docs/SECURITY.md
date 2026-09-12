# Güvenlik modeli

## Güvenlik hedefleri

- Yönetim panelini ilk kurulumda yerel cihazla sınırlamak
- LAN erişimini kimliği doğrulanmış ve HTTPS korumalı hâle getirmek
- Bir bot veya script ele geçirilse bile etki alanını daraltmak
- Microsoft parolası, token ve script sırlarının düz metin depolamaya, loglara ve yedeklere sızmasını önlemek
- Varsayılanları internete açık olmayan ve telemetrisiz tutmak

## Tehdit sınırları

| Sınır                       | Güven varsayımı                               | Zorunlu kontrol                                                             |
| --------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| Tarayıcı ↔ kontrol düzlemi  | LAN bütünüyle güvenilir değildir              | HTTPS, oturum doğrulama, CSRF ve güvenli çerez ilkeleri                     |
| Kontrol düzlemi ↔ SQLite    | Yerel dosyalar başka süreçlerce okunabilir    | Düşük yetkili servis kullanıcısı, dosya izinleri, sır yerine kasa referansı |
| Kontrol düzlemi ↔ worker    | Worker girdileri ve bot trafiği güvenilmezdir | Dar IPC sözleşmesi, şema doğrulama, süreç yalıtımı                          |
| Worker ↔ Minecraft sunucusu | Sunucu ve sohbet içeriği güvenilmezdir        | Girdi sınırları, hız/kaynak limitleri, güvenli hata işleme                  |
| Script ↔ host yetenekleri   | Script içeriği güvenilmezdir                  | İzin listesi, kaynak kotaları, sistem API’lerinin yokluğu                   |
| Uygulama ↔ güvenli kasa     | Sırlar yüksek hassasiyetlidir                 | Opak referans, erişim minimizasyonu, hata/log temizleme                     |

## İlk kurulum ve panel erişimi

- Yönetici yokken sunucu yalnızca loopback arayüzüne bağlanır.
- İlk yönetici oluşturma işlemi uzaktan çağrılamaz; vekil başlıkları loopback kanıtı sayılmaz.
- İlk sürümde tam olarak bir panel yöneticisi vardır.
- LAN dinleme ancak yönetici oturumu içinden açık bir eylemle etkinleştirilebilir ve HTTPS zorunludur.
- Uygulama otomatik port yönlendirme, bulut tüneli veya internet yayını yapmaz.
- Loopback dinleyicisi yalnız `127.0.0.1` ve varsa `::1` üzerinde HTTP kullanır; LAN ayrı HTTPS socket’idir ve wildcard bind varsayılan değildir.
- Loopback ile LAN ayrı cookie adı/audience kullanır. LAN oturum belirteci `Secure`, `HttpOnly`, host-only ve `SameSite=Strict` çerezindedir; loopback belirteci LAN origin’inde geçersizdir.
- Host ve Origin kesin allowlist ile doğrulanır. `X-Forwarded-For` ve benzeri proxy başlıkları loopback veya yönetici öncesi erişim kanıtı sayılmaz.
- İlk yönetici ve loopback oturum uç noktaları yalnız yapılandırılmış loopback HTTP origin'lerinde sunulur. Her istek gerçek socket istemci adresi ve Host allowlist'iyle; durum değiştiren istekler ayrıca tam Origin eşleşmesiyle reddet-varsayılanlı olarak denetlenir.
- Loopback erişimi tek başına kurulum sahipliği kanıtı değildir. Installer/CLI 256 bit rastgele bootstrap kanıtı üretir, yalnız özetini ve 10 dakikalık bitişini servise OS-korumalı kanaldan verir ve ham değeri yetkili kullanıcıya gösterir. İlk yönetici isteği kanıtı doğrular ve scrypt/veritabanı işleminden önce korumalı kaydı kalıcı olarak tüketir. Tüketim başarısız veya belirsizse yönetici yazılmaz ve süreç aynı kaydı tekrar denemez; yalnız kalıcı silme başarıyla tamamlanırsa kurulum ilerler.
- Bootstrap kanıt kaydı servis yeniden başlatmalarında zorunlu değildir: yönetici oluşturulduktan sonra OS-korumalı kayıt kaldırılabilir. Yönetici yokken kayıt eksikse kurulum uç noktası reddet-varsayılanlı olarak kullanılamaz kalır; servis kendiliğinden yeni kanıt üretmez veya daha zayıf bir kanala düşmez.
- Korumalı bootstrap kayıt dosyası en çok 1 KiB'dir ve tam olarak `digest` ile kanonik `expiresAt` alanlarını taşır. Ham kanıtı, ek alanı, hatalı özeti, on dakikadan uzun gelecekteki bitişi, sembolik bağı ve normal dosya dışındaki türleri kabul etmez; süresi geçmiş kayıt yok sayılır. İçerik hata mesajına veya loga eklenmez.
- Çalışma zamanı yalnız açıkça seçilmiş `127.0.0.1` veya `::1` adresine bağlanır. Veri dizini önceden mevcut, kendisi bağ/junction olmayan ve kanonik yolu platform katmanının sahiplik/ACL denetiminden geçmiş olmalıdır; denetim başarısızsa veritabanı açılmaz ve ağ dinleyicisi başlamaz.
- Linux/Raspberry Pi adaptörü root olmayan servis UID'si sahipliğinde dizin için tam `0700`, korumalı dosya için tam `0600` ister; UID `0`'ı, grup/diğer erişimini, sembolik bağı ve beklenmeyen dosya türünü reddeder. Windows yardımcı programının build/hedef framework kararı O-109 kapsamında çözülene kadar Windows servis entegrasyonu tamamlanmış sayılmaz.
- Windows ACL raporu yalnız yolu paket konumundan sabit türetilen ayrı yardımcı programdan, kabuksuz süreç çağrısıyla ve 5 saniye/64 KiB sınırları altında alınır; yol yapılandırmadan veya kullanıcı girdisinden kabul edilmez, son hedefin normal dosya olması gerekir ve `stderr` içeriği kullanıcı yanıtına taşınmaz. Raporun sürümü ve alanları tam eşleşmelidir. Dizin owner'ı yalnız LocalSystem veya Administrators olabilir; izin kalıtımı kapalıdır, deny ACE'leri reddedilir ve etkili izin yalnız servis SID'si, LocalSystem ile Administrators'a verilebilir. Servis SID'sinin doğrudan Modify izni ile yeni dosya ve yeni dizinlere tam Modify kalıtımı ayrı ayrı doğrulanır; `NoPropagateInherit` çocuk izni sağlamış sayılmaz. Yardımcı sürecin gerçek SID'si beklenen düşük yetkili servis SID'si değilse başlangıç reddedilir.
- Loopback oturum cookie'si `HttpOnly`, host-only, `SameSite=Strict` ve 24 saatlik üst sınırlıdır. Loopback HTTP nedeniyle `Secure` değildir ve LAN yüzeyinde hiçbir zaman kabul edilmez.
- Yönetici parolası en az 12 karakterdir. Parolanın kendisi saklanmaz; 16 bayt rastgele salt ve scrypt `N=2^17`, `r=8`, `p=1`, 64 bayt çıktı parametreleriyle üretilen doğrulayıcı SQLite'ta tutulur. Türetme asenkron yapılır ve aşırı büyük girdiler kaynak tüketimini sınırlamak için reddedilir.
- Parola doğrulama yalnız ortak authenticator üzerinden yapılır ve süreç genelinde aynı anda yalnız bir scrypt işi çalışır. Dolu kapasite yeni pahalı işi kuyruğa almaz veya paylaşılan loopback adresine bağlı başarısız-deneme kilidi üretmez; HTTP katmanı bunu genel bir kapasite yanıtına dönüştürür.
- Oturumlar 30 dakika hareketsizlikte ve oluşturulmalarından en geç 24 saat sonra sona erer. Rastgele 256 bitlik ham oturum belirteci yalnız istemciye verilir; SQLite'ta SHA-256 özeti ve süre/audience bilgisi saklanır.
- Oturum sorgulaması yalnız ham belirteci özetleyen, doğru audience'ı isteyen, iptal/idle/absolute koşullarını aynı SQL işleminde uygulayan ve idle bitişini mutlak sınırı aşmadan atomik yenileyen repository işlemiyle yapılır. Süresi dolmuş veya iptal edilmiş kayıt çağırana döndürülmez.
- Loopback ve LAN oturum audience'ları birbirinin yerine kullanılamaz. LAN ayarını değiştiren işlem mevcut oturuma ek olarak yöneticinin parolasını yeniden doğrular.
- Kurtarma yalnız yükseltilmiş yerel etkileşimli komutla yapılır. Bütün oturumlar iptal edilir, LAN kapanır ve kullanıcı verisi korunarak localhost bootstrap’a dönülür; uzaktan reset uç noktası yoktur.

### LAN sertifika güveni

- Kurulum başına offline yerel CA oluşturulur; CA özel anahtarı güvenli kasada kalır ve dışa aktarılamaz.
- 90 günlük ECDSA P-256 leaf sertifika yalnız etkin LAN IP/isimlerini SAN olarak taşır; ömrünün üçte ikisinde veya SAN değiştiğinde atomik yenilenir.
- CA public sertifikası ve parmak izi yalnız localhost panelinden alınabilir. Uygulama istemci cihazlarının trust store’una otomatik müdahale etmez.
- CA/leaf özel anahtarları, yedek, log veya tanılama paketine girmez.

## Minecraft hesapları

- Microsoft parolası hiçbir ekranda istenmez ve hiçbir katmanda saklanmaz.
- Microsoft bağlantısı OAuth cihaz giriş akışını kullanır.
- `prismarine-auth`, projeye ait public-client kaydı ve MSAL cihaz akışıyla kullanılır. Cihaz kodu callback’i panele taşınır; konsola/loga yazılmaz ve parola akışı çağrı yüzeyinde kapalıdır.
- Kitaplığın varsayılan dosya cache’i kullanılmaz. Özel cache adapter’ı Microsoft/Xbox/Minecraft yenileme zincirini yalnız güvenli kasada tutar.
- Worker yenileme tokenı veya kasa anahtarı almaz; yalnız ihtiyaç anında üretilen kısa ömürlü Minecraft erişim tokenını alır ve süreç sonlandığında atar.
- Offline hesapların doğrulanmış Microsoft kimliği olmadığı panelde görünür biçimde belirtilir.
- Aynı hesabın birden fazla worker’da kullanılmasına uygulama kilidi konmaz; sağlayıcı hataları veya sınırları gizlenmez.

## Sır yönetimi

- Sır değerleri SQLite, `.env`, script metni, tanılama paketi veya yedek içinde saklanmaz.
- Script sırları isimlendirilmiş kasa kayıtları olarak çözülür; panel geri okumada varsayılan olarak değeri göstermez.
- Kasa yoksa veya kilitliyse ilgili özellik güvenli biçimde durur. Düz metin geri dönüşü yoktur.
- Bellekteki sır ömrü mümkün olduğunca kısa tutulur ve worker’a yalnızca gerekli olduğu anda aktarılır.
- Hassas alanlar loglama öncesi merkezi ve test edilen bir temizleme katmanından geçer.
- Windows’ta `CRYPTPROTECT_LOCAL_MACHINE` kullanılmaz; servis hesabına bağlı user-scope DPAPI, etkileşimsiz/UI-forbidden modda kullanılır. Ciphertext ve veri dizini servis SID ACL’siyle korunur.
- Linux/Raspberry Pi OS’ta kasa AES-256-GCM ile şifrelenir; ana anahtar installer tarafından üretilmiş root-only kaynaktan systemd `LoadCredential` ile servise verilir. Secret Service veya kullanıcı oturumu gerekmez.
- İlk sürüm TPM kullanmaz. OS admin/root ve ele geçirilmiş servis süreci kasa tehdit sınırının dışındadır; bu sınırlama kullanıcı belgesinde açıkça belirtilir.

## Script güvenliği

- `.mwtsk` çalışma zamanı genel dosya sistemi, süreç başlatma, kabuk/işletim sistemi komutu, ortam değişkeni, dinamik modül yükleme veya ham soket API’si sağlamaz.
- Genel amaçlı HTTP/ağ çağrısı yoktur. Gelecekte bir ağ yeteneği eklenirse hedef ve işlem bazında açık izin gerektirir; bu ilk sürüm kararı değildir.
- Ayrıştırma, statik doğrulama, izin/etki özeti ve kullanıcı onayı tamamlanmadan içe aktarılan script çalışmaz.
- Scriptler süre, bellek, olay kuyruğu ve eylem hızına ilişkin sınırlarla çalıştırılır; kesin kotalar açık karardır.
- Sonsuz döngü, olay fırtınası ve aşırı sohbet/komut gönderimi worker’ı veya sistemi tüketememelidir.
- Her script tek aktif handler ve bounded FIFO kullanır; dolu kuyruk yeni olayı çalıştırmadan reddeder ve sır içermeyen uyarı üretir. Host eylemleri merkezi broker’da kararlı sıraya alınır; kullanıcı stop eylemi script eylemlerinden önceliklidir.

## Süreç ve işletim sistemi güvenliği

- Ana servis ayrı bir düşük yetkili kullanıcıyla çalışır; yönetici/root gerektiren kurulum işi çalışma zamanından ayrılır.
- Veritabanı migration ve bütünlük denetimi ağ dinleyicisinden önce tamamlanır. Daha yeni veya bütünlüğü bozulmuş şema halinde servis dinlemeye geçmez; durum API'si dosya yolunu ya da migration hata ayrıntısını yayımlamaz.
- Her bot ayrı child process/worker sürecidir. Bir worker'ın çökmesi veya ele geçirilmesi diğer worker'lara doğrudan erişim vermemelidir.
- Worker yalnız `child_process.fork()` yerleşik IPC kanalını kullanır; ağ IPC portu veya kabuk yoktur. Kontrol→worker ile worker→kontrol mesajları ayrı şemalarla sürüm, tür, güvenli tamsayı aralığındaki sıra, boyut ve içerik bakımından doğrulanır; yanlış yön ve beklenmeyen mesaj güvenli biçimde reddedilir.
- Kullanıcı verisi dizinleri ve IPC uçları yalnızca gerekli hesaplarca okunabilir/yazılabilir olur.
- Linux systemd unit’i en az `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem=strict` ve `ProtectHome=true` kullanır; Windows servis hesabının etkileşimli giriş ve gereksiz erişimleri kapatılır. Platform sertleştirmesi Mineflayer/native bağımlılıklarla test edilir.

## Log, yedek ve kaldırma

- Logların varsayılan saklama süresi 14 gün, toplam boyut sınırı 250 MB’tır; önce ulaşılan sınır temizliği tetikler.
- Loglar SQLite dışında 10 MiB yapılandırılmış JSONL segmentlerine yazılır. Worker alan allowlist’i, merkezi hassas anahtar kaldırma, savunma amaçlı pattern maskelemesi ve değer boyutu sınırı yazmadan önce uygulanır; dışa aktarım ikinci kez sanitize edilir.
- Loglarda token, parola, yetkilendirme başlığı, cihaz kodu, cookie, TLS özel anahtarı ve script sırrı bulunamaz. Disk doluluğu servisi düşürmez ve hassas veriyi başka konuma dökmez.
- Kullanıcı yedeği ham SQLite kopyası değildir. Admin parola doğrulayıcısı, oturumlar, güvenlik audit olayları, tokenlar, kasa referans/değerleri, cihaz kodları ve TLS özel anahtarları dışlanır.
- Restore önce staging’de manifest/checksum/şema doğrular, sonra atomik devreye alınır. Uygulama admin yok ve LAN kapalı açılır; Microsoft hesapları ile script sırları yeniden bağlanmadan çalışmaz.
- Kaldırıcı varsayılan olarak kullanıcı verilerini korur. “Tüm verileri kaldır” seçeneği kapsamı açıklanmış, ayrı ve açık bir onay gerektirir.

## Telemetri ve güncellemeler

- Varsayılan telemetri, izleme pikseli veya kullanım analitiği yoktur.
- İmzalı otomatik güncelleme sonraki sürümlere bırakılmıştır. İlk sürüm arka planda güncelleme kontrolü yapmaz; kullanıcı tarafından başlatılan kontrol yalnız kimliksiz release metadata isteği yapabilir ve kurulum elle yürür.

## Güvenlik doğrulaması

- Yönetici öncesi LAN erişimi için negatif testler
- HTTPS zorunluluğu ve güvenli oturum ayarları için entegrasyon testleri
- Log/yedek sır sızıntısı için sabit örnekli testler
- Bozuk ve kötü niyetli IPC ile `.mwtsk` girdileri için fuzz ve sınır testleri
- Worker çökmesi, yeniden başlatma fırtınası ve kaynak tüketimi testleri
- Üç hedef platformda dosya izinleri ve güvenli kasa davranışı testleri

## Açık kararlar

Yedeklerin zorunlu şifrelenip şifrelenmeyeceği, Linux/systemd destek tabanı ve script sayısal kotaları `docs/DECISIONS.md` içinde açık kalır. Microsoft uygulama kaydı ve resmî release adresi halka açık sürüm öncesi tamamlanmalıdır.
