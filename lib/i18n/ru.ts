import type { Dictionary } from "./en";

/**
 * Russian strings.
 *
 * Typed as `Dictionary`, so this file cannot drift from `en.ts` — a missing or
 * misspelled key is a build error, not a half-translated screen (AD-11).
 *
 * Russian counts in three shapes, not two, and the rule keys off the last
 * digit: 1 but not 11 takes "блюдо", 2–4 but not 12–14 take "блюда", everything
 * else takes "блюд". The forms below feed that rule in lib/i18n/format.ts —
 * `two` and `few` are both the 2–4 shape, which is why they read alike.
 */
export const ru: Dictionary = {
  brand: {
    name: "MyMenu",
    tagline: "Собственная страница заказов вашего ресторана.",
  },

  common: {
    email: "Электронная почта",
    password: "Пароль",
    confirmPassword: "Повторите пароль",
    restaurantName: "Название ресторана",
    signIn: "Войти",
    signUp: "Создать аккаунт",
    signOut: "Выйти",
    saving: "Сохраняем",
    back: "Назад",
    support: "Помощь",
    settings: "Настройки",
    account: "Ваш аккаунт",
  },

  auth: {
    signupTitle: "Начните бесплатно",
    signupSubtitle: "Настройка займёт две минуты. Без карты и без установки.",
    loginTitle: "Войти",
    loginSubtitle: "С возвращением.",
    haveAccount: "Уже есть аккаунт?",
    noAccount: "Впервые здесь?",
    forgotLink: "Забыли пароль?",

    forgotTitle: "Сброс пароля",
    forgotSubtitle:
      "Оставьте почту, и мы пришлём ссылку, чтобы задать новый пароль.",
    forgotSubmit: "Отправить ссылку",
    forgotSent:
      "Если на этой почте есть аккаунт, ссылка уже отправлена. Она срабатывает один раз и действует час.",

    resetTitle: "Задайте новый пароль",
    resetSubmit: "Сохранить новый пароль",
    resetDone: "Пароль изменён. На всех остальных устройствах выполнен выход.",

    errors: {
      emailTaken: "На этой почте уже есть аккаунт — может, войти?",
      passwordTooShort: "Используйте не меньше 8 символов.",
      passwordMismatch: "Пароли не совпадают.",
      restaurantNameRequired: "Укажите название вашего ресторана.",
      emailInvalid: "Это не похоже на адрес электронной почты.",
      badCredentials: "Эта почта и пароль не подходят друг к другу.",
      linkExpired: "Срок действия ссылки истёк. Запросите новую.",
      alreadySetUp: "К этому аккаунту уже привязан ресторан.",
      noRestaurant:
        "Этот аккаунт не относится ни к одному ресторану. Попросите владельца добавить вас.",
      generic: "У нас что-то пошло не так. Попробуйте ещё раз.",
    },
  },

  roles: {
    owner: "Владелец",
    staff: "Кухня",
    driver: "Курьер",
  },

  dashboard: {
    title: "Сегодня",
    emptyTitle: "Заказов пока нет.",
    emptyAction: "Добавьте первое блюдо",
  },

  kitchen: {
    title: "Заказы",
    empty: "Активных заказов нет.",
  },

  deliveries: {
    title: "Доставки",
    empty: "Доставок не назначено.",
  },

  forbidden: {
    title: "Эта страница не ваша.",
    body: "У вашего аккаунта нет доступа к этой части MyMenu.",
    backToWork: "Вернуться на свой экран",
  },

  ordering: {
    closedTitle: "Сейчас закрыто.",
    opensAt: "Открывается в {time}.",
    notTakingOrders: "Этот ресторан пока не принимает заказы.",

    currency: "AED",
    soldOut: "Закончилось",
    add: "Добавить",
    addNamed: "Добавить {dish}",
    oneFewer: "На одно {dish} меньше",
    oneMore: "Ещё одно {dish}",

    tableLabel: "Стол {n}",
    menuSections: "Разделы меню",

    itemCountOne: "{n} блюдо",
    itemCountTwo: "{n} блюда",
    itemCountFew: "{n} блюда",
    itemCountMany: "{n} блюд",
    orderButton: "Заказать",

    backToMenu: "← Назад в меню",
    yourOrder: "Ваш заказ",
    howAreYouGettingIt: "Как вы хотите это получить?",
    modeDineIn: "Я за столом",
    modePickup: "Заберу сам",
    modeDelivery: "Привезите мне",

    tableNumber: "Номер стола",
    whereToBring: "Куда привезти?",
    addressHint: "Дом, номер квартиры — всё, что поможет",
    yourPhone: "Ваш номер телефона",
    phoneHint: "05x xxx xxxx",
    kitchenNote: "Хотите что-то передать на кухню? (необязательно)",
    kitchenNoteHint: "Без лука",

    sending: "Отправляем…",
    sendToKitchen: "Отправить на кухню",
    payAtRestaurant: "Вы платите в ресторане.",

    shareLocation: "📍 Поделиться моим местоположением",
    findingYou: "Определяем, где вы…",
    locationShared: "Местоположение отправлено.",
    locationSharedBody:
      "Курьер получит точку на карте, так что ему не придётся звонить и спрашивать дорогу.",
    checkOnMap: "Посмотреть на карте",
    removeLocation: "Убрать",
    locationDenied:
      "Телефон не разрешил передать местоположение. Ничего страшного — адреса, который вы напишете, достаточно.",
    locationFailed:
      "Не удалось определить ваше местоположение. Адреса, который вы напишете, достаточно.",
  },

  orderStatus: {
    orderNumber: "Заказ №{n}",
    atTable: " · Стол {n}",

    stepReceived: "принят",
    stepCooking: "готовится",
    stepReady: "готов",

    receivedTitle: "Кухня получила ваш заказ.",
    receivedBody: "Скоро возьмутся за него.",
    cookingTitle: "Готовится.",
    cookingBody: "Это ненадолго.",
    readyTitle: "Готово.",
    readyBody: "Заберите, пожалуйста.",
    completedTitle: "Всё готово.",
    completedBody: "Спасибо за заказ.",
    cancelledTitle: "Этот заказ отменён.",
    cancelledBody: "Если для вас это неожиданность, поговорите с рестораном.",

    keepOpen:
      "Оставьте эту страницу открытой или вернитесь по этой ссылке. Она работает 24 часа.",

    notFound: "Мы не нашли такой заказ.",
    notFoundBody:
      "Ссылки на заказ перестают работать через 24 часа. Если вы всё ещё ждёте еду, спросите напрямую в ресторане.",
  },
};
