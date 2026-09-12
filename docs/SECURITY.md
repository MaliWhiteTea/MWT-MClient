# Güvenlik modeli

## Güvenlik hedefleri

- Yönetim panelini ilk kurulumda yerel cihazla sınırlamak
- LAN erişimini kimliği doğrulanmış ve HTTPS korumalı hâle getirmek
- Bir bot veya script ele geçirilse bile etki alanını daraltmak
- Microsoft parolası, token ve script sırlarının düz metin depolamaya, loglara ve yedeklere sızmasını önlemek
- Varsayılanları internete açık olmayan ve telemetrisiz tutmak

## Tehdit sınırları

| Sınır | Güven varsayımı | Zorunlu kontrol |
| --- | --- | --- |
| Tarayıcı ↔ kontrol düzlemi | LAN bütünüyle güvenilir değildir | HTTPS, oturum doğrulama, CSRF ve güvenli çerez ilkeleri |
| Kontrol düzlemi ↔ SQLite | Yerel dosyalar başka süreçlerce okunabilir | Düşük yetkili servis kullanıcısı, dosya izinleri, sır yerine kasa referansı |
| Kontrol düzlemi ↔ worker | Worker girdileri ve bot trafiği güvenilmezdir | Dar IPC sözleşmesi, şema doğrulama, süreç yalıtımı |
| Worker ↔ Minecraft sunucusu | Sunucu ve sohbet içeriği güvenilmezdir | Girdi sınırları, hız/kaynak limitleri, güvenli hata işleme |
| Script ↔ host yetenekleri | Script içeriği güvenilmezdir | İzin listesi, kaynak kotaları, sistem API’lerinin yokluğu |
| Uygulama ↔ güvenli kasa | Sırlar yüksek hassasiyetlidir | Opak referans, erişim minimizasyonu, hata/log temizleme |

## İlk kurulum ve panel erişimi

- Yönetici yokken sunucu yalnızca loopback arayüzüne bağlanır.
- İlk yönetici oluşturma işlemi uzaktan çağrılamaz; vekil başlıkları loopback kanıtı sayılmaz.
- İlk sürümde tam olarak bir panel yöneticisi vardır.
- LAN dinleme ancak yönetici oturumu içinden açık bir eylemle etkinleştirilebilir ve HTTPS zorunludur.
- Uygulama otomatik port yönlendirme, bulut tüneli veya internet yayını yapmaz.
- Oturum belirteçleri güvenli, HttpOnly ve uygun SameSite çerezleriyle taşınır; hassas değişiklikler yeniden doğrulama gerektirebilir.
- Parola saklama için güncel, bellek-zorlu bir parola türetme yöntemi seçilecektir; kesin algoritma ve parametreler açık karardır.

## Minecraft hesapları

- Microsoft parolası hiçbir ekranda istenmez ve hiçbir katmanda saklanmaz.
- Microsoft bağlantısı OAuth cihaz giriş akışını kullanır.
- Yenileme/erişim tokenları yalnızca güvenli kasada tutulur ve loglardan temizlenir.
- Offline hesapların doğrulanmış Microsoft kimliği olmadığı panelde görünür biçimde belirtilir.
- Aynı hesabın birden fazla worker’da kullanılmasına uygulama kilidi konmaz; sağlayıcı hataları veya sınırları gizlenmez.

## Sır yönetimi

- Sır değerleri SQLite, `.env`, script metni, tanılama paketi veya yedek içinde saklanmaz.
- Script sırları isimlendirilmiş kasa kayıtları olarak çözülür; panel geri okumada varsayılan olarak değeri göstermez.
- Kasa yoksa veya kilitliyse ilgili özellik güvenli biçimde durur. Düz metin geri dönüşü yoktur.
- Bellekteki sır ömrü mümkün olduğunca kısa tutulur ve worker’a yalnızca gerekli olduğu anda aktarılır.
- Hassas alanlar loglama öncesi merkezi ve test edilen bir temizleme katmanından geçer.

## Script güvenliği

- `.mwtsk` çalışma zamanı genel dosya sistemi, süreç başlatma, kabuk/işletim sistemi komutu, ortam değişkeni, dinamik modül yükleme veya ham soket API’si sağlamaz.
- Genel amaçlı HTTP/ağ çağrısı yoktur. Gelecekte bir ağ yeteneği eklenirse hedef ve işlem bazında açık izin gerektirir; bu ilk sürüm kararı değildir.
- Ayrıştırma, statik doğrulama, izin/etki özeti ve kullanıcı onayı tamamlanmadan içe aktarılan script çalışmaz.
- Scriptler süre, bellek, olay kuyruğu ve eylem hızına ilişkin sınırlarla çalıştırılır; kesin kotalar açık karardır.
- Sonsuz döngü, olay fırtınası ve aşırı sohbet/komut gönderimi worker’ı veya sistemi tüketememelidir.

## Süreç ve işletim sistemi güvenliği

- Ana servis ayrı bir düşük yetkili kullanıcıyla çalışır; yönetici/root gerektiren kurulum işi çalışma zamanından ayrılır.
- Her bot ayrı child process/worker sürecidir. Bir worker’ın çökmesi veya ele geçirilmesi diğer worker’lara doğrudan erişim vermemelidir.
- Worker IPC mesajları sürümlü şemalarla doğrulanır; beklenmeyen mesaj güvenli biçimde reddedilir.
- Kullanıcı verisi dizinleri ve IPC uçları yalnızca gerekli hesaplarca okunabilir/yazılabilir olur.

## Log, yedek ve kaldırma

- Logların varsayılan saklama süresi 14 gün, toplam boyut sınırı 250 MB’tır; önce ulaşılan sınır temizliği tetikler.
- Loglarda token, parola, yetkilendirme başlığı, cihaz kodu ve script sırrı bulunamaz.
- Kullanıcı yedekleri gizli tokenları ve parolaları kapsamaz. Script sırlarının yalnızca adları/referansları taşınabilir; değerleri taşınmaz.
- Kaldırıcı varsayılan olarak kullanıcı verilerini korur. “Tüm verileri kaldır” seçeneği kapsamı açıklanmış, ayrı ve açık bir onay gerektirir.

## Telemetri ve güncellemeler

- Varsayılan telemetri, izleme pikseli veya kullanım analitiği yoktur.
- İmzalı otomatik güncelleme sonraki sürümlere bırakılmıştır. İlk sürüm için güncelleme dağıtım yöntemi kararlaştırılmamıştır.

## Güvenlik doğrulaması

- Yönetici öncesi LAN erişimi için negatif testler
- HTTPS zorunluluğu ve güvenli oturum ayarları için entegrasyon testleri
- Log/yedek sır sızıntısı için sabit örnekli testler
- Bozuk ve kötü niyetli IPC ile `.mwtsk` girdileri için fuzz ve sınır testleri
- Worker çökmesi, yeniden başlatma fırtınası ve kaynak tüketimi testleri
- Üç hedef platformda dosya izinleri ve güvenli kasa davranışı testleri

## Açık kararlar

Sertifika sağlama ve güven modeli, yönetici parola politikası/kurtarma akışı, platform kasa uygulamaları, sandbox kotaları ve güvenlik güncelleme dağıtımı `docs/DECISIONS.md` içinde karara bağlanacaktır.
