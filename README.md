# MWT-MClient

MWT-MClient, Mineflayer tabanlı Minecraft botlarını aynı cihazdaki modern bir web panelinden yönetmeyi hedefleyen, MIT lisanslı ve açık kaynak bir projedir.

> **Şeffaflık notu:** Proje, insan yönlendirmesi ve incelemesi altında yapay zekâ destekli geliştirme araçları kullanılarak geliştirilmektedir.

> Proje şu anda çalışma alanı, SQLite yaşam döngüsü, localhost kontrol servisi ve tek yönetici kimlik doğrulama temeli aşamasındadır. Henüz kurulabilir uygulama paketi veya yayımlanmış sürüm yoktur.

## Hedeflenen ilk sürüm

- Windows x64, Linux x64 ve Raspberry Pi OS ARM64 desteği
- Ayrı, düşük yetkili bir sistem kullanıcısı altında servis olarak çalışma
- İlk sürümde yalnız sistem servisi kurulumu; kullanıcı oturumuna özel taşınabilir kurulum yok
- İsteğe bağlı cihaz başlangıcında otomatik başlatma
- Aynı cihazdan ve yerel ağdan erişilebilen, mobil uyumlu React paneli
- Yalnızca localhost üzerinden ilk kurulum; yönetici oluşturulana kadar LAN erişiminin kapalı kalması
- LAN erişiminde HTTPS; yönlendiricide veya dış internette otomatik port açmama
- Tek panel yöneticisi
- Microsoft cihaz giriş akışı ve offline Minecraft hesapları
- Hesap, sunucu ve bot profillerinin ayrı yönetimi
- Kurulum sihirbazında sabit sayı zorunluluğu olmadan istenen sayıda hesap, sunucu ve bot profili ekleme; bunları daha sonra değiştirme veya kaldırma
- Her bot için ayrı Mineflayer worker süreci
- Otomatik sürüm algılama veya elle Minecraft sürümü seçimi
- Kontrollü çökme kurtarma ve otomatik yeniden bağlanma
- Metin ve ileride görsel editör tarafından paylaşılacak `.mwtsk` script modeli

İlk sürümde HeadlessMC uygulanmayacak ve panelde seçenek olarak gösterilmeyecektir. Özel domain, Crowdin bağlantısı, TPM desteği, gelişmiş görsel editör ve imzalı otomatik güncelleme de sonraki sürümlere bırakılmıştır.

MWT Script, Spigot Skript’ten esinlenir fakat Spigot Skript ile birebir uyumluluk iddiası taşımaz.

## Temel ilkeler

- Microsoft parolaları hiçbir zaman saklanmaz; token ve script sırları işletim sistemine uygun güvenli kasa katmanında tutulur.
- Scriptler dosya sistemine, işletim sistemi komutlarına veya sınırsız ağ erişimine ulaşamaz.
- İçe aktarılan scriptler doğrulanmadan ve kullanıcı açıkça onaylamadan çalıştırılmaz.
- Telemetri varsayılan olarak yoktur.
- Yedekler gizli tokenları ve parolaları içermez.
- Kaldırma işlemi varsayılan olarak kullanıcı verilerini korur; tüm verileri silme ayrıca seçilebilir.

## Belgeler

- [Ürün kapsamı](docs/PRODUCT.md)
- [Mimari](docs/ARCHITECTURE.md)
- [Güvenlik modeli](docs/SECURITY.md)
- [Veri modeli](docs/DATA-MODEL.md)
- [MWT Script taslak belirtimi](docs/SCRIPT-SPEC.md)
- [Yol haritası](docs/ROADMAP.md)
- [Karar kaydı ve açık kararlar](docs/DECISIONS.md)
- [Katkı ve ajan çalışma kuralları](AGENTS.md)

## Geliştirme

Geliştirme çalışma alanı pnpm workspaces kullanır ve SQLite online backup API'si nedeniyle Node.js 22.16 veya üzerini gerektirir. Mevcut iskelet için doğrulama komutu:

```text
pnpm install
pnpm verify
```

Bu komutlar yalnız geliştirme iskeletini doğrular; henüz sistem servisi kurmaz veya bot çalıştırmaz.

Panelin geliştirme görünümünü yalnız localhost üzerinde açmak için:

```text
pnpm dev
```

## Lisans

MWT-MClient, [MIT Lisansı](LICENSE) ile lisanslanacaktır. Proje GitHub’da yayımlandığında herkese açık olacaktır; kesin hesap/organizasyon ve depo adresi henüz kararlaştırılmamıştır.
