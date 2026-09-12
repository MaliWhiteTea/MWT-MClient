# MWT-MClient çalışma kuralları

Bu kurallar depo kökünün tamamında geçerlidir.

## Çalışmaya başlamadan önce

1. `README.md` ile `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DATA-MODEL.md`, `docs/SCRIPT-SPEC.md`, `docs/ROADMAP.md` ve `docs/DECISIONS.md` dosyalarını oku.
2. İstenen değişikliği kabul edilmiş kararlarla ve açık kararlarla karşılaştır.
3. Bir ayrıntı kesinleşmemişse sessizce ürün kapsamına ekleme; `docs/DECISIONS.md` içindeki “Açık kararlar” bölümüne taşı veya kullanıcıdan karar iste.
4. Yalnızca görev için gereken dosyalara dokun; ilgisiz yeniden düzenleme, bağımlılık ekleme veya kapsam genişletme yapma.

## Zorunlu güvenlik sınırları

- İlk kurulum yalnızca localhost üzerinden yapılır; yönetici oluşturulmadan LAN dinleyicisi açılmaz.
- LAN panel erişimi HTTPS kullanır. UPnP, NAT-PMP veya benzeri yollarla dış internete otomatik port açılmaz.
- Servis ayrı ve düşük yetkili bir işletim sistemi kullanıcısıyla çalışır; gereksiz yükseltilmiş yetki istemez.
- Microsoft parolası istenmez veya saklanmaz. Kimlik doğrulamada cihaz giriş akışı kullanılır.
- Tokenlar ve script sırları veritabanına ya da düz metin yapılandırmaya yazılmaz; güvenli kasa soyutlamasında yalnızca referansları tutulur.
- Script çalışma zamanı dosya sistemi, işletim sistemi komutları ve sınırsız ağ erişimi sunmaz.
- İçe aktarılan script doğrulama ve açık kullanıcı onayı tamamlanmadan etkinleştirilemez.
- Loglara, hata mesajlarına, dışa aktarımlara ve yedeklere gizli bilgi sızdırma.
- Telemetriyi varsayılan hâle getirme veya gizli bir ağ çağrısı ekleme.
- Kaldırma akışında kullanıcı verilerini varsayılan olarak koru; tam silmeyi ayrı ve açık bir seçim yap.

## Mimari ve ürün sınırları

- Backend Node.js + TypeScript, panel React + TypeScript, kalıcı veri SQLite olarak kalır.
- Her bot ayrı worker sürecinde çalışır. İlk sürümün tek motoru Mineflayer’dır.
- HeadlessMC için motor sınırını koru; uygulamasını ekleme ve panelde görünür seçenek üretme.
- Hesap, sunucu ve bot profillerini ayrı varlıklar olarak tut. Aynı hesabın eşzamanlı kullanımı için yapay bir kısıt ekleme.
- Kullanıcı arayüzü Türkçe başlar fakat tüm kullanıcı metinleri i18n anahtarları üzerinden tasarlanır. Script dili yalnızca İngilizcedir.
- Teknik ayrıntıları varsayılan deneyime taşımak yerine “Gelişmiş görünüm” altında tut.
- Özel domain, Crowdin entegrasyonu, TPM, gelişmiş görsel editör ve imzalı otomatik güncellemeyi ilk sürüme dahil etme.

## Değişiklik disiplini

- Uygulama davranışını değiştiren her görevde ilgili belgeyi aynı değişiklik içinde güncelle.
- Güvenlik açısından önemli kod için tehdit sınırını, başarısızlık davranışını ve gizli bilgi temizlemeyi test et.
- Platforma özgü kodu soyutlamaların arkasında tut ve Windows x64, Linux x64 ile Raspberry Pi OS ARM64 etkisini değerlendir.
- Yeni bağımlılık eklemeden önce gerekliliğini, lisansını, bakım durumunu ve üç hedef platform desteğini doğrula.
- Test veya doğrulama çalıştırılmadıysa bunu teslim notunda açıkça belirt. Yapılmamış işi tamamlanmış gibi sunma.
