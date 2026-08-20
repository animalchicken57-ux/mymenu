import type { Dictionary } from "./en";

/**
 * Turkish strings.
 *
 * Typed as `Dictionary`, so this file cannot drift from `en.ts` — a missing or
 * misspelled key is a build error, not a half-translated screen (AD-11).
 *
 * Turkish takes no plural suffix after a number — "3 ürün", never "3 ürünler" —
 * so the itemCount forms are deliberately identical. See lib/i18n/format.ts.
 */
export const tr: Dictionary = {
  brand: {
    name: "MyMenu",
    tagline: "Restoranınızın kendi sipariş sayfası.",
  },

  common: {
    email: "E-posta",
    password: "Şifre",
    confirmPassword: "Şifreyi doğrulayın",
    restaurantName: "Restoran adı",
    signIn: "Giriş yap",
    signUp: "Hesap oluştur",
    signOut: "Çıkış yap",
    saving: "Kaydediliyor",
    back: "Geri",
    support: "Yardım",
    settings: "Ayarlar",
    account: "Hesabınız",
  },

  auth: {
    signupTitle: "Ücretsiz başlayın",
    signupSubtitle: "Kurulumu iki dakika. Kart yok, kurulacak bir şey yok.",
    loginTitle: "Giriş yap",
    loginSubtitle: "Tekrar hoş geldiniz.",
    haveAccount: "Zaten hesabınız var mı?",
    noAccount: "Yeni misiniz?",
    forgotLink: "Şifrenizi mi unuttunuz?",

    forgotTitle: "Şifrenizi sıfırlayın",
    forgotSubtitle:
      "E-postanızı verin, yeni şifre belirlemeniz için bir bağlantı gönderelim.",
    forgotSubmit: "Bağlantıyı gönder",
    forgotSent:
      "Bu e-postaya ait bir hesap varsa bağlantı yola çıktı. Bağlantı bir kez çalışır ve bir saat sonra geçersiz olur.",

    resetTitle: "Yeni şifre belirleyin",
    resetSubmit: "Yeni şifreyi kaydet",
    resetDone: "Şifre değişti. Diğer bütün cihazlardan çıkış yapıldı.",

    errors: {
      emailTaken: "Bu e-postanın zaten bir hesabı var — giriş yapmak ister misiniz?",
      passwordTooShort: "En az 8 karakter kullanın.",
      passwordMismatch: "İki şifre birbirinden farklı.",
      restaurantNameRequired: "Restoranınızın adını yazın.",
      emailInvalid: "Bu bir e-posta adresine benzemiyor.",
      badCredentials: "Bu e-posta ile şifre birbirini tutmuyor.",
      linkExpired: "Bu bağlantının süresi doldu. Yenisini isteyin.",
      alreadySetUp: "Bu hesabın zaten bir restoranı var.",
      noRestaurant:
        "Bu hesap bir restorana bağlı değil. Sahibinden sizi eklemesini isteyin.",
      generic: "Bizim tarafımızda bir şeyler ters gitti. Tekrar deneyin.",
    },
  },

  roles: {
    owner: "Sahibi",
    staff: "Mutfak",
    driver: "Kurye",
  },

  dashboard: {
    title: "Bugün",
    emptyTitle: "Henüz sipariş yok.",
    emptyAction: "İlk yemeğinizi ekleyin",
  },

  kitchen: {
    title: "Siparişler",
    empty: "Açık sipariş yok.",
  },

  deliveries: {
    title: "Teslimatlar",
    empty: "Size atanmış teslimat yok.",
  },

  forbidden: {
    title: "Bu sayfa sizin değil.",
    body: "Hesabınızın MyMenu'nün bu bölümüne erişimi yok.",
    backToWork: "Kendi ekranınıza dönün",
  },

  ordering: {
    closedTitle: "Şu anda kapalı.",
    opensAt: "{time} açılıyor.",
    notTakingOrders: "Bu restoran henüz sipariş almıyor.",

    currency: "AED",
    soldOut: "Tükendi",
    add: "Ekle",
    addNamed: "{dish} ekle",
    oneFewer: "Bir {dish} eksilt",
    oneMore: "Bir {dish} daha",

    tableLabel: "Masa {n}",
    menuSections: "Menü bölümleri",

    itemCountOne: "1 ürün",
    itemCountTwo: "2 ürün",
    itemCountFew: "{n} ürün",
    itemCountMany: "{n} ürün",
    orderButton: "Sipariş ver",

    backToMenu: "← Menüye dön",
    yourOrder: "Siparişiniz",
    howAreYouGettingIt: "Nasıl almak istersiniz?",
    modeDineIn: "Masadayım",
    modePickup: "Gelip alacağım",
    modeDelivery: "Adresime getirin",

    tableNumber: "Masa numarası",
    whereToBring: "Nereye getirelim?",
    addressHint: "Bina, daire numarası, işe yarayacak her şey",
    yourPhone: "Telefon numaranız",
    phoneHint: "05x xxx xxxx",
    kitchenNote: "Mutfağa iletmek istediğiniz bir şey var mı? (isteğe bağlı)",
    kitchenNoteHint: "Soğansız",

    sending: "Gönderiliyor…",
    sendToKitchen: "Mutfağa gönder",
    payAtRestaurant: "Ödemeyi restoranda yaparsınız.",

    shareLocation: "📍 Konumumu paylaş",
    findingYou: "Sizi buluyoruz…",
    locationShared: "Konum paylaşıldı.",
    locationSharedBody:
      "Kurye haritada bir iğne görür, böylece yol tarifi için sizi aramak zorunda kalmaz.",
    checkOnMap: "Haritada görün",
    removeLocation: "Kaldır",
    locationDenied:
      "Telefonunuz konum paylaşımına izin vermedi. Sorun değil — yazdığınız adres yeterli.",
    locationFailed:
      "Konumunuzu alamadık. Yazdığınız adres yeterli.",
  },

  orderStatus: {
    orderNumber: "Sipariş #{n}",
    atTable: " · Masa {n}",

    stepReceived: "alındı",
    stepCooking: "pişiyor",
    stepReady: "hazır",

    receivedTitle: "Mutfak siparişinizi aldı.",
    receivedBody: "Birazdan başlayacaklar.",
    cookingTitle: "Şimdi pişiyor.",
    cookingBody: "Uzun sürmeyecek.",
    readyTitle: "Hazır.",
    readyBody: "Gelip alabilirsiniz.",
    completedTitle: "Tamamlandı.",
    completedBody: "Sipariş verdiğiniz için teşekkürler.",
    cancelledTitle: "Bu sipariş iptal edildi.",
    cancelledBody: "Bu sizin için sürprizse restoranla konuşun.",

    keepOpen:
      "Bu sayfayı açık bırakın ya da bu bağlantıya geri dönün. 24 saat çalışır.",

    notFound: "Bu siparişi bulamıyoruz.",
    notFoundBody:
      "Sipariş bağlantıları 24 saat sonra çalışmayı bırakır. Hâlâ yemeğinizi bekliyorsanız doğrudan restorana sorun.",
  },
};
