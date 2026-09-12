# Karar kaydı

Bu belge kabul edilmiş ürün kararlarını ve henüz çözülmemiş konuları tek yerde tutar. Kabul edilmiş karar değişirse ilgili tüm belgeler aynı değişiklikte güncellenmelidir.

## Kabul edilmiş kararlar

| Kimlik | Karar                                                                                                                                                                                                                                                                                                     | Durum        |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| D-001  | Proje adı MWT-MClient’tır; açık kaynak ve MIT lisanslıdır.                                                                                                                                                                                                                                                | Kabul edildi |
| D-002  | Hedefler Windows x64, Linux x64 ve Raspberry Pi OS ARM64’tür.                                                                                                                                                                                                                                             | Kabul edildi |
| D-003  | Uygulama ayrı, düşük yetkili kullanıcıyla sistem servisi olarak çalışır; botların başlangıçta çalışması isteğe bağlıdır.                                                                                                                                                                                  | Kabul edildi |
| D-004  | İlk kurulum yalnızca localhost’tadır. Yönetici oluşturulmadan LAN erişimi açılmaz.                                                                                                                                                                                                                        | Kabul edildi |
| D-005  | LAN erişimi HTTPS kullanır; uygulama dış internete otomatik port açmaz.                                                                                                                                                                                                                                   | Kabul edildi |
| D-006  | İlk sürüm tek panel yöneticisi kullanır.                                                                                                                                                                                                                                                                  | Kabul edildi |
| D-007  | Panel React + TypeScript; backend Node.js + TypeScript; veritabanı SQLite’tır.                                                                                                                                                                                                                            | Kabul edildi |
| D-008  | Panel modern, sade, mobil uyumlu, açık/koyu temalıdır; teknik ayrıntılar “Gelişmiş görünüm” altındadır.                                                                                                                                                                                                   | Kabul edildi |
| D-009  | Başlangıç dili Türkçedir; UI baştan i18n uyumludur. Script dili yalnızca İngilizcedir.                                                                                                                                                                                                                    | Kabul edildi |
| D-010  | Her bot ayrı worker sürecinde çalışır. İlk sürümün tek motoru Mineflayer’dır.                                                                                                                                                                                                                             | Kabul edildi |
| D-011  | HeadlessMC için motor soyutlaması korunur; uygulama ve panel seçeneği ilk sürümde yoktur.                                                                                                                                                                                                                 | Kabul edildi |
| D-012  | Microsoft ve offline hesaplar desteklenir. Microsoft parolası saklanmaz; cihaz giriş akışı kullanılır.                                                                                                                                                                                                    | Kabul edildi |
| D-013  | Tokenlar ve script sırları işletim sistemine uygun güvenli kasa katmanında saklanır.                                                                                                                                                                                                                      | Kabul edildi |
| D-014  | Hesaplar, sunucular ve bot profilleri ayrıdır. Aynı hesabın eşzamanlı kullanımına yapay sınır konmaz.                                                                                                                                                                                                     | Kabul edildi |
| D-015  | Minecraft sürümü otomatik algılanabilir veya elle seçilebilir.                                                                                                                                                                                                                                            | Kabul edildi |
| D-016  | Otomatik yeniden bağlanma ve kontrollü çökme kurtarma bulunur.                                                                                                                                                                                                                                            | Kabul edildi |
| D-017  | Loglar varsayılan olarak 14 gün veya 250 MB saklanır; ilk aşılan sınır temizliği tetikler.                                                                                                                                                                                                                | Kabul edildi |
| D-018  | Varsayılan telemetri yoktur. Yedekler token veya parola içermez.                                                                                                                                                                                                                                          | Kabul edildi |
| D-019  | `.mwtsk`, girinti tabanlı ve doğal İngilizce okunan DSL’dir; görsel ve metin editörü aynı modeli kullanır.                                                                                                                                                                                                | Kabul edildi |
| D-020  | Scriptin dosya sistemi, işletim sistemi komutu veya sınırsız ağ erişimi yoktur. İçe aktarım doğrulama ve kullanıcı onayı olmadan çalışmaz.                                                                                                                                                                | Kabul edildi |
| D-021  | Özel domain, Crowdin bağlantısı, TPM, gelişmiş görsel editör ve imzalı otomatik güncelleme sonraki sürümlerdedir.                                                                                                                                                                                         | Kabul edildi |
| D-022  | Kaldırıcı varsayılan olarak kullanıcı verisini korur ve ayrıca tüm verileri kaldırma seçeneği sunar.                                                                                                                                                                                                      | Kabul edildi |
| D-023  | Windows x64 dağıtımı MSI ile; Linux x64 ve Raspberry Pi OS ARM64 dağıtımı mimariye özel `tar.gz` paket ve systemd kurulum betiğiyle yapılır. Paketler özel Node.js çalışma zamanını içerir.                                                                                                               | Kabul edildi |
| D-024  | Windows’ta SCM altında özel düşük yetkili servis hesabı; Linux’ta özel sistem kullanıcısı ve sıkılaştırılmış systemd system service kullanılır. Servisin başlaması ile bot profillerinin otomatik başlaması ayrı ayarlardır.                                                                              | Kabul edildi |
| D-025  | Kontrol düzlemi worker’ları Node.js `child_process.fork()` ile başlatır; yerleşik, ebeveyn-çocuk IPC kanalı üzerinde sürümlü ve şema doğrulamalı JSON-uyumlu mesaj zarfları kullanılır.                                                                                                                   | Kabul edildi |
| D-026  | Backend Fastify tabanlı, aynı origin altında sürümlü REST/JSON API kullanır; tek yönlü canlı durum ve log akışı SSE ile sağlanır. İlk sürümde WebSocket yoktur.                                                                                                                                           | Kabul edildi |
| D-027  | Bootstrap ve aynı cihaz erişimi yalnızca `127.0.0.1`/`::1` üzerinde HTTP’dir. LAN ayrı bir dinleyicide, yalnızca yönetici sonrasında ve HTTPS ile açılır; iki origin’in oturumları birbirine taşınmaz.                                                                                                    | Kabul edildi |
| D-028  | LAN TLS için kurulum başına yerel CA ve ondan üretilen 90 günlük sunucu sertifikası kullanılır. Güven kurulumu kullanıcı tarafından yapılır; leaf sertifika ömrünün üçte ikisinde ve SAN değişince yenilenir.                                                                                             | Kabul edildi |
| D-029  | Yönetici kurtarma yalnızca cihazdaki yükseltilmiş etkileşimli komutla yapılır; tüm oturumlar iptal edilir, LAN kapanır ve veri korunarak localhost ilk yönetici oluşturma durumuna dönülür.                                                                                                               | Kabul edildi |
| D-030  | Windows kasası servis kimliğine bağlı kullanıcı kapsamlı DPAPI; Linux/Raspberry Pi kasası AEAD ile şifreli kasa ve systemd credential olarak verilen root-korumalı ana anahtar kullanır. Düz metin geri dönüşü yoktur.                                                                                    | Kabul edildi |
| D-031  | Microsoft/Minecraft cihaz girişi `prismarine-auth` ve projeye ait public-client kaydıyla uygulanır; kitaplığın dosya cache’i kullanılmaz, özel cache güvenli kasaya bağlanır. Worker yalnızca kısa ömürlü Minecraft erişim tokenı alır.                                                                   | Kabul edildi |
| D-032  | Minecraft sürümünde varsayılan `auto` modu status ping ile protokolü belirler ve yalnızca sürümde yayımlanan test edilmiş matrise eşler; elle seçim aynı matriste kalır, desteklenmeyen sürümde bot başlatılmaz.                                                                                          | Kabul edildi |
| D-033  | Geçici bağlantı hataları jitter’lı ve üst sınırlandırılmış geri çekilmeyle; worker çökmeleri ayrı, daha dar bir yeniden başlatma bütçesiyle ele alınır. Kalıcı kimlik/yapılandırma hataları otomatik denenmez.                                                                                            | Kabul edildi |
| D-034  | SQLite’ın tek yazarı kontrol düzlemidir; foreign keys, WAL ve busy timeout açılır. Sıralı/checksum’lı migration kayıtları kullanılır, her migration transaction içinde yürür, downgrade reddedilir.                                                                                                       | Kabul edildi |
| D-035  | Loglar SQLite dışında boyutla döndürülen yapılandırılmış JSONL segmentleridir; worker logları merkezi allowlist ve maskeleme katmanından sonra yazılır. Yaş ve toplam boyut temizliği birlikte uygulanır.                                                                                                 | Kabul edildi |
| D-036  | Kullanıcı yedeği tam SQLite kopyası değildir; seçmeli ve sanitize edilmiş taşınabilir dışa aktarımdır. Yönetici doğrulayıcısı, oturumlar, tokenlar, kasa anahtar/referansları ve script sırları dışlanır; geri yükleme LAN kapalı bootstrap durumuna döner.                                               | Kabul edildi |
| D-037  | Her `.mwtsk` dosyasında ilk yorum/boşluk olmayan satır `language 1` biçiminde zorunlu major dil sürümüdür. AST şema sürümü iç modelde ayrıca tutulur; bilinmeyen major sürüm çalıştırılmaz.                                                                                                               | Kabul edildi |
| D-038  | Script olayları sıra numarasıyla fan-out edilir; her script tek işleyici ve sınırlı FIFO kuyruk kullanır. Host eylemleri kararlı sırada tek broker’dan geçer; scriptler ortak değiştirilebilir bellek paylaşmaz.                                                                                          | Kabul edildi |
| D-039  | `BotEngine` yalnızca worker içinde uygulanır; kontrol düzlemi normalize yaşam döngüsü/olay/eylem zarflarını bilir. Motor yetenekleri capability set ile bildirilir ve ilk sürümde yalnızca `mineflayer` kabul edilir.                                                                                     | Kabul edildi |
| D-040  | İlk sürüm yalnızca metin script editörü ve ortak AST/formatter sözleşmesi içerir. Görsel editör sonraki sürümdedir ve hiçbir zaman desteklemediği AST düğümlerini kayıplı biçimde yazamaz.                                                                                                                | Kabul edildi |
| D-041  | İlk sürüm arka planda güncelleme denetlemez ve kendini güncellemez. Kullanıcı tarafından başlatılan sürüm denetimi kimliksiz bir metadata isteği yapabilir; kurulum elle, servis durdurularak ve ileri migration ile yapılır.                                                                             | Kabul edildi |
| D-042  | İlk sürüm yalnız sistem servisi kurulum modelini destekler; kullanıcı oturumuna özel taşınabilir kurulum ilk sürüm kapsamı dışındadır.                                                                                                                                                                    | Kabul edildi |
| D-043  | Kurulum sihirbazı hesap, sunucu veya bot profili için sabit/minimum adet dayatmaz. Kullanıcı istediği sayıda varlık ekleyebilir ve bunları sonradan panelden değiştirebilir veya kaldırabilir.                                                                                                            | Kabul edildi |
| D-044  | Agent, kullanıcı açıkça istemedikçe commit, branch, remote, push veya publish işlemi yapmaz; Git geçmişi ağırlıklı olarak GitHub Desktop ile kullanıcı tarafından yönetilir.                                                                                                                              | Kabul edildi |
| D-045  | Proje yayımlandığında GitHub’da herkese açık olur ve kurulabilir paketler GitHub Releases üzerinden sunulur; kesin hesap/organizasyon ve depo URL’si henüz seçilmemiştir.                                                                                                                                 | Kabul edildi |
| D-046  | `.mwtsk` Spigot Skript’ten esinlenir fakat Spigot Skript ile birebir kaynak, eklenti veya çalışma zamanı uyumluluğu iddia etmez.                                                                                                                                                                          | Kabul edildi |
| D-047  | Kaynak depo pnpm workspaces kullanır; `apps/control-service`, `apps/panel`, `packages/contracts`, `packages/core`, `packages/database` ve `packages/i18n` sınırlarıyla başlar. Geliştirme tabanı Node.js 22.16+ ve TypeScript strict modudur.                                                             | Kabul edildi |
| D-048  | SQLite erişimi yalnız kontrol servisinin bağımlılığı olan `@mwt-mclient/database` paketindedir. `node:sqlite` ve açık SQL migration'ları kullanılır; ham bağlantı dışa açılmaz. Şema uyumluluğu kalıcı PRAGMA'lardan önce okunur ve transaction-control SQL'i reddedilir. Worker bu pakete bağımlı olmaz. | Kabul edildi |
| D-049  | Kontrol servisi veritabanını ağ dinleyicisinden önce açıp migration/bütünlük denetimini tamamlar; hata durumunda dinlemeye geçmez ve kapanışta bağlantıyı kapatır. Veri yolu platform katmanından açıkça verilir. Durum API'si veritabanına ilişkin yalnız hazır olma işareti ile şema sürümünü yayımlar. | Kabul edildi |
| D-050  | Tek yönetici parolası en az 12 karakterdir ve scrypt (`N=2^17`, `r=8`, `p=1`, 16 bayt rastgele salt, 64 bayt çıktı) ile doğrulanır. Oturum 30 dakika hareketsizlikte ve en geç 24 saatte sona erer; LAN ayarı değişikliği parolanın yeniden doğrulanmasını gerektirir. Ham oturum belirteci saklanmaz.    | Kabul edildi |
| D-051  | Yönetici parola doğrulaması süreç genelinde aynı anda bir scrypt işiyle sınırlıdır; dolu işlem yeni pahalı işi kuyruğa almaz veya başarısız-deneme kilidi oluşturmaz. Oturum kabulü audience, iptal ve iki süre sınırını tek atomik repository işleminde doğrular ve idle süresini aynı işlemde yeniler.  | Kabul edildi |
| D-052  | İlk yönetici oluşturma; yapılandırılmış loopback HTTP origin/Host ve gerçek loopback istemci adresine ek olarak installer/CLI'nin OS-korumalı kanalda ürettiği, 10 dakikalık tek-kullanımlık 256 bit bootstrap kanıtını gerektirir. Kanıt doğrulanmadan scrypt veya veritabanı yazımı yapılmaz.           | Kabul edildi |
| D-053  | Projenin README ve yayımlandığında GitHub bilgi alanları, insan yönlendirmesi ve incelemesi altında yapay zekâ destekli geliştirme araçları kullanıldığını şeffafça belirtir.                                                                                                                             | Kabul edildi |

## Mimari inceleme sonuçları

### R-001 — Paketleme

- **Seçenekler:** Kullanıcı oturumuna özel taşınabilir paket servis/başsız çalışma hedefini karşılamaz; sistem Node.js’ine dayalı paket sürüm farklarına açıktır; tek çalıştırılabilir dosya native modül/veri dosyalarında kısıtlayıcıdır; özel Node.js runtime içeren sistem-servisi paketi daha büyüktür fakat tekrarlanabilirdir.
- **İlk sürüm önerisi:** Windows x64 için WiX tabanlı MSI ve Windows servis yaşam döngüsünü köprüleyen WinSW; systemd kullanan Linux x64 ve Raspberry Pi OS ARM64 için mimariye özel `tar.gz`, doğrulanmış kur/kaldır betiği ve unit dosyası. Node.js runtime paket içinde sabitlenir.
- **Güvenlik/platform etkisi:** Kurulum yükseltilmiş yetki ister, runtime istemez. Paket hash’i/yayın kaynağı doğrulanmalıdır. Linux dağıtım alt sınırı açık karardır.
- **Sonuç:** Temel yöntem D-023, yalnız servis kurulumu D-042 olarak kabul edildi; desteklenen dağıtım sürümleri O-101’de açık.

### R-002 — Windows service ve Linux systemd modeli

- **Seçenekler:** Kullanıcı oturumunda başlangıç kolay ama “sistem servisi” ve başsız çalışma hedefini bozuyor; dinamik kullanıcı güçlü yalıtım sağlasa da kalıcı kasa/kimlik yaşam döngüsünü zorlaştırıyor; özel kalıcı düşük yetkili hesap her platformda öngörülebilir.
- **İlk sürüm önerisi:** Windows SCM’de parola göstermeyen özel yerel servis hesabı, servis SID’i ve dar veri ACL’leri; Linux’ta shell/login kapalı özel sistem kullanıcısı, `StateDirectory`/`LogsDirectory`, `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem=strict` ve `ProtectHome=true`. Sertleştirme seçenekleri üç mimaride test edilir.
- **Güvenlik/platform etkisi:** Yönetici/root yalnızca kurma, kaldırma, kurtarma ve yükseltmede kullanılır. Servis otomatik başlayabilir; botlar yalnız profil tercihiyle başlar.
- **Sonuç:** D-024 olarak kabul edildi.

### R-003 — Kontrol servisi-worker IPC

- **Seçenekler:** TCP/yerel socket motor çeşitliliğine uygun ama saldırı yüzeyi ve kimlik doğrulama getirir; worker threads ayrı süreç şartını karşılamaz; Node child-process IPC aynı makinedeki Node worker’lar için en dar çözümdür.
- **İlk sürüm önerisi:** `child_process.fork()` yerleşik IPC kanalı, yalnız JSON-uyumlu veri, `protocolVersion/type/requestId/sequence/payload` zarfı, iki yönde şema ve boyut doğrulaması, timeout/backpressure. Worker veritabanına ve yenileme tokenına erişmez.
- **Güvenlik/platform etkisi:** Ağ portu açılmaz ve kabuk kullanılmaz. Windows/Linux davranışı Node tarafından taşınır; parent ölünce orphan worker bırakmama ayrıca test edilir.
- **Sonuç:** D-025 olarak kabul edildi.

### R-004 — Backend API

- **Seçenekler:** Express basit fakat şema disiplini ek çalışma ister; NestJS kapsam için ağırdır; Fastify yerleşik yaşam döngüsü ve JSON Schema doğrulamasını daha dar bir çekirdekte sunar. WebSocket çift yönlüdür fakat ilk sürüm ihtiyacından fazladır; SSE tek yönlü durum/log akışına yeterlidir.
- **İlk sürüm önerisi:** Fastify, `/api/v1` REST/JSON ve aynı-origin SSE. Değişiklik komutları REST’tir; bütün giriş/çıkışlar uygulama tarafından sahip olunan sabit şemalarla doğrulanır.
- **Güvenlik/platform etkisi:** Kullanıcı tarafından sağlanan dinamik şema derlenmez. Body/stream limitleri, CSRF ve Origin denetimleri ortak middleware sınırında uygulanır.
- **Sonuç:** D-026 olarak kabul edildi.

### R-005 — Localhost ve LAN HTTPS

- **Seçenekler:** Her yerde HTTPS ilk bootstrap’ta güven uyarısı yaratır; tek HTTP dinleyicisini LAN’a açmak kabul edilmiş güvenliği bozar; ayrı loopback HTTP ve LAN HTTPS dinleyicileri açık bir güven sınırı sağlar.
- **İlk sürüm önerisi:** `127.0.0.1` ve varsa `::1` üzerinde HTTP bootstrap/yerel panel; LAN etkinse seçilen özel ağ adreslerinde ayrı HTTPS dinleyicisi. Wildcard bind varsayılan değildir. Host ve Origin allowlist uygulanır; loopback ve LAN cookie adları/audience’ları ayrıdır.
- **Güvenlik/platform etkisi:** Loopback cookie’si LAN’da kabul edilmez; LAN cookie’si `Secure`, `HttpOnly`, host-only ve `SameSite=Strict` olur. Proxy başlıkları istemci adresi kanıtı sayılmaz.
- **Sonuç:** D-027 olarak kabul edildi.

### R-006 — Yerel sertifika oluşturma ve yenileme

- **Seçenekler:** Tek self-signed leaf her yenilemede yeniden güven ister; genel CA özel domain olmadan LAN IP/isimlerini veremez; kurulum başına yerel CA güveni bir kez kurup leaf yenilemeyi otomatikleştirir.
- **İlk sürüm önerisi:** Offline kurulum CA’sı, 90 günlük ECDSA P-256 leaf, etkin LAN IP/isimleri için SAN; ömrün üçte ikisinde veya SAN değişiminde atomik yenileme ve dinleyiciyi yeniden yükleme. CA sertifikası ve parmak izi yalnız localhost panelinden sunulur; istemci trust store değişikliği otomatik yapılmaz.
- **Güvenlik/platform etkisi:** CA özel anahtarı güvenli kasadadır ve yedeğe girmez. Yeni istemci güveni kullanıcı sorumluluğudur; özel domain hâlâ kapsam dışıdır.
- **Sonuç:** D-028 olarak kabul edildi.

### R-007 — Yönetici hesabı kurtarma

- **Seçenekler:** E-posta/bulut kurtarma yerel-öncelikli ürünü büyütür; güvenlik soruları zayıftır; yedek kurtarma kodu yeni sır yaşam döngüsü doğurur; yerel OS yöneticisiyle reset mevcut fiziksel/yönetici güven sınırına uyar.
- **İlk sürüm önerisi:** Yalnız etkileşimli, yükseltilmiş yerel kurtarma komutu. Komut kapsamı gösterip onay ister; admin doğrulayıcısını ve oturumları siler, LAN’ı kapatır, veriyi ve kasayı korur, localhost bootstrap’a döner.
- **Güvenlik/platform etkisi:** Uzak API yoktur. OS admin/root zaten cihaz güven sınırındadır; olay yerel audit kaydına sır içermeden yazılır.
- **Sonuç:** D-029 olarak kabul edildi.

### R-008 — Windows ve Linux güvenli kasa

- **Seçenekler:** Düz dosya yasaktır; Windows machine-scope DPAPI aynı makinedeki her kullanıcıya fazla geniştir; user-scope DPAPI servis kimliğine bağlanabilir. Linux Secret Service kullanıcı oturumu ister; kernel keyring yeniden başlatmada kalıcı değildir; systemd credential başsız servise uygundur.
- **İlk sürüm önerisi:** Windows’ta servis hesabı altında user-scope DPAPI ve UI-forbidden mod; Linux/Raspberry Pi’de AES-256-GCM şifreli kasa, kurulumda üretilen root-only ana anahtarın systemd `LoadCredential` ile servise verilmesi.
- **Güvenlik/platform etkisi:** Sırlar disk üzerinde açık değildir ve normal kullanıcıdan korunur; OS admin/root veya ele geçirilmiş servis süreci tehdit sınırı dışındadır. TPM olmadan donanıma bağlı koruma yoktur.
- **Sonuç:** D-030 olarak kabul edildi; hedef OS/systemd alt sürümü O-101’i etkiler.

### R-009 — Kullanıcı oturumu olmadan Microsoft tokenı

- **Seçenekler:** Kullanıcı kasası/Secret Service başsız açılmaz; kullanıcıdan her boot giriş istemek autostart’ı bozar; servis kimliğine ait kasa başsız çalışma ile uyumludur.
- **İlk sürüm önerisi:** Refresh zinciri yalnız kontrol servisinin kasasında tutulur. Worker’a yenileme tokenı veya kasa anahtarı verilmez; yalnız ihtiyaç anında alınmış kısa ömürlü Minecraft erişim tokenı aktarılır ve worker bitince atılır.
- **Güvenlik/platform etkisi:** Cihaz çalınmasına karşı koruma OS disk/hesap güvenliği kadardır; TPM sonraki sürümdedir. Kasa açılamazsa bot güvenli biçimde `reauth_required` durumunda kalır.
- **Sonuç:** D-030 ve D-031 kapsamında kabul edildi.

### R-010 — Microsoft cihaz kodu kitaplığı ve yaşam döngüsü

- **Seçenekler:** `@azure/msal-node` yalnız Microsoft OAuth katmanını çözer, Xbox/Minecraft zinciri ayrıca yazılmalıdır; Mineflayer’ın kullandığı `prismarine-auth` tüm zinciri ve özel cache arayüzünü sağlar; parola tabanlı akış yasaktır.
- **İlk sürüm önerisi:** Projeye ait public-client kaydıyla `prismarine-auth` MSAL cihaz akışı; cihaz kodu callback’i panele taşınır, konsola yazılmaz. Özel cache adapter’ı tüm token nesnesini güvenli kasada tutar; erişim süresi dolunca yeniler, iptal/çıkışta cache’i siler, hatada yeniden bağlantı ister.
- **Güvenlik/platform etkisi:** Varsayılan dosya cache’i ve parola seçeneği hiçbir çağrı yolunda kullanılmaz. Aynı hesap için kontrol düzlemi yenilemeleri birleştirir ama worker eşzamanlılığına kilit koymaz.
- **Sonuç:** D-031 olarak kabul edildi; istemci kaydının sahibi/yayın koşulları O-102’de açık.

### R-011 — Minecraft sürüm algılama ve matris

- **Seçenekler:** Yalnız elle seçim hataya açıktır; bağımlılığın “en son” desteğini varsaymak tekrarlanamaz; status ping ile protokol belirleyip sabitlenmiş/test edilmiş matrise eşlemek güvenlidir.
- **İlk sürüm önerisi:** `auto` varsayılanı status ping yapar; protokol numarası yayınla birlikte gelen destek matrisine eşlenir. Proxy yanlış raporlarsa kullanıcı desteklenen matristen elle seçebilir. Belirsiz/uyumsuz sürümde giriş denenmez.
- **Güvenlik/platform etkisi:** Kötü niyetli ping yanıtı boyut/zaman aşımıyla sınırlanır. Matris bütün platformlarda aynı lockfile ve uyumluluk testlerinden üretilir.
- **Sonuç:** Davranış D-032 olarak kabul edildi; ilk sürümün kesin sürüm listesi O-103’te release gate olarak açık.

### R-012 — Worker çökme ve yeniden başlatma eşikleri

- **Seçenekler:** Sonsuz hızlı retry kaynak tüketir/ban riski yaratır; hiç retry kullanılabilirliği düşürür; hata sınıfına göre sınırlı retry dengelidir.
- **İlk sürüm önerisi:** Geçici ağ kopmalarında 1, 2, 4, 8, 16, 30, sonra 60 saniye tavanlı ve ±%20 jitter’lı bekleme; 15 dakikada 10 başarısız denemeden sonra `attention_required`. Worker çökmesinde 10 dakikada en fazla 3 yeniden başlatma (2, 5, 15 saniye); 10 dakika kararlı çalışmada bütçe sıfırlanır. Kimlik/yapılandırma hatası retry edilmez.
- **Güvenlik/platform etkisi:** Sayaç kontrol düzlemindedir, servis yeniden başlatılınca crash-loop bilgisi korunur. Kullanıcı durdurması tüm planlı retry’ları iptal eder.
- **Sonuç:** D-033 olarak kabul edildi; gerçek ağ testleriyle ayarlanabilir ama kod başlangıcını engellemez.

### R-013 — SQLite şeması ve migration

- **Seçenekler:** `PRAGMA user_version` basit ama geçmiş/checksum bırakmaz; ORM’ye bağlı otomatik senkronizasyon öngörülemez; açık SQL migration günlüğü denetlenebilir.
- **İlk sürüm önerisi:** Tek kontrol-düzlemi yazarı, WAL, foreign keys ve busy timeout; monoton kimlik/checksum/zaman taşıyan `schema_migrations`; migration başına transaction ve başlamadan önce uygulama-içi kurtarma snapshot’ı. Yalnız ileri migration, eski binary ile açmayı reddetme.
- **Güvenlik/platform etkisi:** Worker DB dosyasını açmaz. Migration snapshot’ı kullanıcı yedeği değildir; veri dizini ACL’sinde tutulur ve başarı sonrası kontrollü temizlenir.
- **Sonuç:** D-034 olarak kabul edildi; kesin tablolar uygulama tasarımında DATA-MODEL sınırlarından türetilecek.

### R-014 — Log döndürme ve maskeleme

- **Seçenekler:** SQLite logları ana veriyi şişirir; worker başına serbest dosya sır temizlemeyi dağıtır; merkezi yapılandırılmış JSONL denetlenebilir ve taşınabilirdir.
- **İlk sürüm önerisi:** Worker yalnız allowlist alanlı log olayını IPC ile yollar. Kontrol servisi hassas anahtarları kaldırır, savunma amaçlı değer-pattern maskelemesi ve boyut kırpması uygular, 10 MiB JSONL segmentlerini atomik döndürür. Başlangıçta, döndürmede ve saatte bir 14 gün/250 MB sınırı uygulanır; dışa aktarım yeniden sanitize edilir.
- **Güvenlik/platform etkisi:** Auth header, token, cihaz kodu, parola ve script sırrı hiçbir seviyede yazılmaz. Disk doluluğu servisi düşürmez; panelde yerel uyarı üretir.
- **Sonuç:** D-035 olarak kabul edildi.

### R-015 — Yedekleme ve geri yükleme

- **Seçenekler:** Ham SQLite kopyası tutarlı olabilir ama admin doğrulayıcısını taşır; seçmeli dışa aktarım daha çok kod ister fakat sır/verifier sınırını gerçekten uygular; tam kasa yedeği kabul edilmiş kararla çelişir.
- **İlk sürüm önerisi:** Sürümlü manifest, checksum ve sanitize edilmiş veri veritabanı içeren `.mwtbackup` ZIP. Admin/oturum/audit güvenlik olayları, tokenlar, kasa referansları/değerleri ve TLS özel anahtarları dışlanır. Restore staging alanında doğrulanır, atomik devreye alınır; LAN kapalı ve admin yok bootstrap durumunda açılır, Microsoft hesapları ile script sırları yeniden bağlanır.
- **Güvenlik/platform etkisi:** Arşiv yine sunucu adresi ve script gibi kullanıcı verileri taşır; kullanıcıya hassas olduğu bildirilir. Arşiv şifreleme UX’i açık karardır.
- **Sonuç:** Güvenli içerik ve restore davranışı D-036 olarak kabul edildi; şifreleme O-104’te açık.

### R-016 — `.mwtsk` gramer sürümleme

- **Seçenekler:** Dosya dışı metadata taşınabilirliği bozar; SemVer her küçük değişiklikte gereksiz dallanma yaratır; zorunlu major sürüm satırı kırıcı gramer değişikliklerini açıklar.
- **İlk sürüm önerisi:** İlk anlamlı satır tam olarak `language 1`; kırıcı sözdizimi/anlam değişikliği major’ı artırır. Aynı major içindeki eklemeler eski dosyanın anlamını değiştiremez. AST kendi tamsayı şema sürümünü taşır; parser çıktısından yeniden üretilir.
- **Güvenlik/platform etkisi:** Eksik/bilinmeyen sürüm fail-closed olur. Kayıplı göç otomatik kaydetmez ve yeniden onay gerektirir.
- **Sonuç:** D-037 olarak kabul edildi.

### R-017 — Script tetikleyicileri, kotalar, kuyruklar ve çakışma

- **Seçenekler:** Paralel handler’lar hızlı ama yarış üretir; tek global sıra yavaş bir scriptin hepsini durdurur; script başına seri kuyruk ve merkezi eylem broker’ı yalıtım ile belirlenimliliği dengeler.
- **İlk sürüm önerisi:** Olaylara artan sıra numarası verilir, scriptlere profil bağlama sırasıyla fan-out edilir; her scriptte tek handler ve bounded FIFO vardır. Dolu kuyruk yeni olayı reddeder ve uyarı üretir. Eylemler `(eventSequence, bindingOrder, actionSequence)` sırasıyla broker’dan geçer; kullanıcı stop eylemi önceliklidir. Paylaşılan değiştirilebilir script durumu yoktur.
- **Güvenlik/platform etkisi:** Adım/süre/bellek/queue/action-rate limitleri zorunludur; sayılar Raspberry Pi ARM64 ölçümleriyle belirlenmelidir. Tetikleyici/eylem kataloğu ürün kabiliyetini belirlediğinden kullanıcı kararı ister.
- **Sonuç:** Zamanlama/çatışma temeli D-038 olarak kabul edildi; katalog O-105, sayısal kotalar O-106’da açık.

### R-018 — HeadlessMC’ye hazırlanma

- **Seçenekler:** Kontrol düzleminde Mineflayer tipleri hızlı ama gelecekte kırıcıdır; kapsamlı ortak-denominator API erken soyutlamadır; dar normalize yaşam döngüsü ve capability modeli yeterlidir.
- **İlk sürüm önerisi:** Motor adapter’ı worker içinde kalır. Kontrol düzlemi `start/stop/status/event/action` zarfları ve capability kümesini bilir; motor-özel ayar sürümlü opak yapılandırmadır. `engineId=mineflayer` dışında doğrulama reddedilir.
- **Güvenlik/platform etkisi:** Yeni motor ayrı worker image/entrypoint ve capability allowlist gerektirir; HeadlessMC kodu veya görünürlüğü ilk sürüme sızmaz.
- **Sonuç:** D-039 olarak kabul edildi.

### R-019 — İlk görsel script editörü

- **Seçenekler:** İlk sürümde tam görsel editör kapsamı büyütür; salt-okunur AST görünümü sınırlı değer sunar; metin editörü + stabil AST seam güvenli başlangıçtır.
- **İlk sürüm önerisi:** İlk sürümde görsel editör yoktur. Sonraki ilk görsel editör yalnız açıkça desteklenen AST alt kümesini düzenler; bilinmeyen düğümleri salt-okunur gösterir ve kayıplı kaydetmeyi engeller.
- **Güvenlik/platform etkisi:** Her iki editör de aynı parser/validator/approval hash hattını kullanır; görsel yüzey güvenlik doğrulamasını atlayamaz.
- **Sonuç:** İlk sürüm sınırı D-040 olarak kabul edildi; sonraki görsel editörün ürün kapsamı O-107’de kullanıcıya bırakıldı.

### R-020 — Elle güncelleme ve sürüm bildirimi

- **Seçenekler:** Arka plan kontrolü telemetri algısı ve ağ davranışı doğurur; hiç bildirim güvenlik sürümlerini görünmez kılar; açık kullanıcı eylemiyle metadata kontrolü dengelidir.
- **İlk sürüm önerisi:** Panel mevcut sürümü gösterir; yalnız “Güncellemeleri denetle” eylemi GitHub Releases tabanlı sabit metadata adresine kimliksiz GET yapar. İndirme/kurma otomatik değildir. Elle kurulum servisi durdurur, yerel migration recovery snapshot’ı alır, paketi yükseltir ve downgrade’i reddeder.
- **Güvenlik/platform etkisi:** Benzersiz kimlik, hesap, bot veya kullanım verisi gönderilmez. İmzalı otomatik updater yoktur; dağıtım paketinin bütünlük doğrulaması yine zorunludur.
- **Sonuç:** D-041 olarak kabul edildi. GitHub Releases kanalı D-045 ile kesinleşti; hesap/organizasyon ve bundan türeyen metadata adresi O-108’de açık.

## Açık kararlar

### O-101 — Desteklenen Linux ve işletim sistemi alt sürümleri

`systemd`, credential desteği, glibc ve paketlenmiş Node.js gereksinimlerini karşılayan kesin dağıtım/sürüm tabanı seçilmeli. Bu bir destek ve test maliyeti kararıdır; ürün sahibinin hedef kitlesini gerektirir.

### O-102 — Microsoft uygulama kaydının sahibi

Public-client kaydını yönetecek hesap/kuruluş, istemci kimliği, uygulama adı ve Microsoft yayın/uyumluluk gereklilikleri ürün sahibi tarafından belirlenmeli. Microsoft hesap kodu bu olmadan uçtan uca yayımlanamaz.

### O-103 — İlk yayın Minecraft destek matrisi

Kesin sürüm listesi seçilen/pinlenen Mineflayer, minecraft-protocol ve minecraft-data sürümleriyle CI uyumluluk testinden sonra dondurulmalı. Bu deneysel release gate’tir; iskelet kodu engellemez.

### O-104 — Yedek şifreleme deneyimi

Seçenekler: yalnız sanitize edilmiş düz arşiv en taşınabilir; zorunlu passphrase şifreleme daha güvenli ama unutulan parolada kurtarılamaz; isteğe bağlı şifreleme iki akışı büyütür. Öneri zorunlu passphrase şifrelemedir, ancak bu kullanıcı deneyimi/kurtarma tercihi ürün sahibine bırakılmıştır.

### O-105 — İlk `.mwtsk` tetikleyici ve eylem kataloğu

Bot yaşam döngüsü, chat, zamanlayıcı ve komut tetikleyicilerinden hangilerinin ilk sürüme gireceği ürün kapsamını doğrudan değiştirir. Öneri yalnız `bot joined`, `bot disconnected`, `chat received` ve kontrollü süre tetikleyicisiyle başlamak; kesin katalog kullanıcı kararına bırakılmıştır.

### O-106 — Script sayısal kotaları

Adım, wall-clock süre, heap, FIFO derinliği ve eylem hızı için güvenli alt/üst sınırlar Windows x64, Linux x64 ve en yavaş Raspberry Pi ARM64 hedefinde ölçülmeli. Öneri ölçümden önce sayıları API sözleşmesine gömmemektir; script runtime uygulamasını engeller.

### O-107 — Sonraki sürüm görsel editör kapsamı

Blok editörü, form tabanlı olay/eylem düzenleyicisi veya salt-okunur model görünümünden hangisinin yapılacağı ürün sahibinin deneyim tercihidir. İlk sürümü engellemez.

### O-108 — GitHub hesap/organizasyon ve depo adresi

Proje ve paketler sırasıyla herkese açık GitHub deposu ve GitHub Releases üzerinden yayımlanacaktır. Hangi GitHub hesabı/organizasyonunun kullanılacağı ve kesin depo URL’si ürün sahibine bırakılmıştır. Mevcut yerel Git remote’u bu kararın verildiği anlamına gelmez; kullanıcı açıkça seçmeden belge veya otomasyonlarda kalıcı yayın adresi olarak kullanılmaz. İlk kod iskeletini engellemez; halka açık sürümü ve sürüm metadata URL’sini engeller.

## Karar verme ölçütleri

- Güvenli varsayılan ve en az yetki
- Windows x64, Linux x64 ve Raspberry Pi OS ARM64 üzerinde doğrulanabilirlik
- Çevrimdışı/yerel-öncelikli çalışma ve telemetrisizlik
- Bakım maliyeti ve açık kaynak lisans uyumu
- Kullanıcı deneyiminin sade kalması; teknik ayrıntıların gelişmiş görünümde yer alması
- Kabul edilmiş ilk sürüm kapsamını büyütmeme
