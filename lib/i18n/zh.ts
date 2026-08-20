import type { Dictionary } from "./en";

/**
 * Simplified Chinese strings.
 *
 * Typed as `Dictionary`, so this file cannot drift from `en.ts` — a missing or
 * misspelled key is a build error, not a half-translated screen (AD-11).
 *
 * Chinese has no grammatical plural, so the four itemCount forms are all the
 * same sentence. That is intentional, not an unfinished translation — see the
 * plural rules in lib/i18n/format.ts.
 */
export const zh: Dictionary = {
  brand: {
    name: "MyMenu",
    tagline: "属于你餐厅自己的点餐页面。",
  },

  common: {
    email: "邮箱",
    password: "密码",
    confirmPassword: "确认密码",
    restaurantName: "餐厅名称",
    signIn: "登录",
    signUp: "注册账号",
    signOut: "退出登录",
    saving: "保存中",
    back: "返回",
    support: "帮助",
    settings: "设置",
    account: "你的账号",
  },

  auth: {
    signupTitle: "免费开始",
    signupSubtitle: "两分钟就能设置好。不用银行卡，也不用安装任何东西。",
    loginTitle: "登录",
    loginSubtitle: "欢迎回来。",
    haveAccount: "已经有账号了？",
    noAccount: "第一次来？",
    forgotLink: "忘记密码？",

    forgotTitle: "重设密码",
    forgotSubtitle: "留下你的邮箱，我们会发一个链接给你设置新密码。",
    forgotSubmit: "发送链接",
    forgotSent:
      "如果这个邮箱有账号，链接已经在路上了。链接只能用一次，一小时后失效。",

    resetTitle: "设置新密码",
    resetSubmit: "保存新密码",
    resetDone: "密码已更改。其他设备都已退出登录。",

    errors: {
      emailTaken: "这个邮箱已经有账号了，要直接登录吗？",
      passwordTooShort: "至少用 8 个字符。",
      passwordMismatch: "两次输入的密码不一样。",
      restaurantNameRequired: "请填写你餐厅的名称。",
      emailInvalid: "这看起来不像一个邮箱地址。",
      badCredentials: "这个邮箱和密码对不上。",
      linkExpired: "链接已过期。请重新申请一个。",
      alreadySetUp: "这个账号已经有一家餐厅了。",
      noRestaurant: "这个账号不属于任何餐厅。请让老板把你加进来。",
      generic: "我们这边出了点问题。请再试一次。",
    },
  },

  roles: {
    owner: "老板",
    staff: "后厨",
    driver: "配送员",
  },

  dashboard: {
    title: "今天",
    emptyTitle: "还没有订单。",
    emptyAction: "添加第一道菜",
  },

  kitchen: {
    title: "订单",
    empty: "没有进行中的订单。",
  },

  deliveries: {
    title: "配送",
    empty: "没有分配到配送任务。",
  },

  forbidden: {
    title: "这个页面不属于你。",
    body: "你的账号没有权限进入 MyMenu 的这一部分。",
    backToWork: "回到你的页面",
  },

  ordering: {
    closedTitle: "现在打烊了。",
    opensAt: "{time} 开门。",
    notTakingOrders: "这家餐厅还没有开始接单。",

    currency: "AED",
    soldOut: "已售完",
    add: "加入",
    addNamed: "加入{dish}",
    oneFewer: "少一份{dish}",
    oneMore: "多一份{dish}",

    tableLabel: "{n} 号桌",
    menuSections: "菜单分类",

    itemCountOne: "1 份",
    itemCountTwo: "2 份",
    itemCountFew: "{n} 份",
    itemCountMany: "{n} 份",
    orderButton: "下单",

    backToMenu: "← 返回菜单",
    yourOrder: "你的订单",
    howAreYouGettingIt: "你想怎么拿到？",
    modeDineIn: "我在桌上",
    modePickup: "我自己来取",
    modeDelivery: "送到我这里",

    tableNumber: "桌号",
    whereToBring: "送到哪里？",
    addressHint: "楼栋、房号，任何有帮助的信息",
    yourPhone: "你的电话号码",
    phoneHint: "05x xxx xxxx",
    kitchenNote: "有什么要告诉后厨的吗？（可不填）",
    kitchenNoteHint: "不要洋葱",

    sending: "发送中…",
    sendToKitchen: "发送到后厨",
    payAtRestaurant: "你在餐厅付款。",

    shareLocation: "📍 分享我的位置",
    findingYou: "正在定位…",
    locationShared: "位置已分享。",
    locationSharedBody: "配送员会拿到地图上的定位点，就不用打电话问路了。",
    checkOnMap: "在地图上查看",
    removeLocation: "移除",
    locationDenied:
      "你的手机拒绝了位置分享。没关系，你填的地址就够用了。",
    locationFailed: "我们没能获取你的位置。你填的地址就够用了。",
  },

  orderStatus: {
    orderNumber: "订单 #{n}",
    atTable: " · {n} 号桌",

    stepReceived: "已收到",
    stepCooking: "制作中",
    stepReady: "已做好",

    receivedTitle: "后厨收到你的订单了。",
    receivedBody: "他们马上就开始做。",
    cookingTitle: "正在制作。",
    cookingBody: "不会等太久。",
    readyTitle: "做好了。",
    readyBody: "来取吧。",
    completedTitle: "全部完成。",
    completedBody: "感谢你的订单。",
    cancelledTitle: "这个订单已取消。",
    cancelledBody: "如果你觉得意外，可以跟餐厅聊一下。",

    keepOpen: "让这个页面开着，或者回到这个链接。它在 24 小时内有效。",

    notFound: "我们找不到这个订单。",
    notFoundBody:
      "订单链接 24 小时后就失效了。如果你还在等餐，请直接问餐厅。",
  },
};
