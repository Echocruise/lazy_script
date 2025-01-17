const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const {getLogFile, sleep, parallelRun} = require('./lib/common');
const {getNowDate, getNowHour, getMoment} = require('./lib/moment');
const {sleepTime} = require('./lib/cron');
const {getCookieData} = require('./lib/env');
const serverChan = require('./lib/serverChan');
const mailer = require('./lib/mailer');
const TemporarilyOffline = {start: _.noop, cron: _.noop, getName: () => 'TemporarilyOffline'};

const Common = require('./jd/base/common');

const Sign = require('./jd/sign');
const SignShop = require('./jd/sign/shop');
const SignRemote = require('./jd/sign/remote');
const PlantBean = require('./jd/plantBean');
const SuperMarket = require('./jd/superMarket');
const SuperMarketRedeem = TemporarilyOffline || require('./jd/superMarket/redeem');
const Pet = require('./jd/pet');
const Fruit = require('./jd/fruit');
const TurnTableFarm = require('./jd/fruit/turnTableFarm');
const Wfh = require('./jd/wfh');
const jdFactory = require('./jd/jdFactory');
const Health = require('./jd/wfh/Health');
const HealthShare = require('./jd/wfh/HealthShare');
const HealthSign = require('./jd/wfh/HealthSign');
const Harmony1 = require('./jd/wfh/harmony1');
const Harmony2 = require('./jd/wfh/harmony2');
const Harmony3 = require('./jd/wfh/harmony3');
const Earn = require('./jd/earn');
const Cash = require('./jd/cash');
const CashShare = require('./jd/cash/share');
const StatisticsBean = require('./jd/statistics/bean');
const Ssjj = TemporarilyOffline || require('./jd/ssjj'); // 没什么收益, 所以进行移除
const Trump = require('./jd/trump');
const Smfe = require('./jd/smfe');
const IsvShopSign = require('./jd/isv/shopSign');
const CrazyJoy = TemporarilyOffline || require('./jd/crazyJoy');
const Necklace = require('./jd/necklace');
const SecondKillRedPacket = require('./jd/secondKill/redPacket');
const DreamFactory = TemporarilyOffline || require('./jd/dreamFactory');
const JxCfd = TemporarilyOffline || require('./jd/jxCfd');
const Car = require('./jd/car');
const VipClubShake = require('./jd/vipClub/shake');
const KoiRedPacket = require('./jd/koiRedPacket');
const Joy = TemporarilyOffline || require('./jd/joy');
const JoyRedeem = require('./jd/joy/redeem');
const Family = TemporarilyOffline || require('./jd/family');
const BianPao = require('./jd/family/bianPao');
const JxHongBao = require('./jd/family/jxHongBao');
const JxFarm = require('./jd/wq/JxFarm');
const WomenBlindBox = require('./jd/family/WomenBlindBox');
const LuckyToHitTheGoldenEgg = require('./jd/family/LuckyToHitTheGoldenEgg');
const Live = require('./jd/live');
const LiveRedEnvelopeRain = TemporarilyOffline || require('./jd/live/RedEnvelopeRain');
const SignBeanHome = require('./jd/sign/beanHome');
const GlobalChallenge = TemporarilyOffline || require('./jd/globalMart/challenge');
const Singjd = require('./jd/wq/singjd');
const Isp5G = require('./jd/isp5g');
const EarnJingDou = require('./jd/earnJingDou');
const Carnivalcity = require('./jd/shoppingFestival/carnivalcity');
const Xiemi = require('./jd/xiemi/index');
const BeanSmallBean = require('./jd/sign/beanSmallBean');
const GoldCreator = require('./jd/goldCreator');
const Olympicgames = require('./jd/olympicgames');
const OlympicgamesApplet = require('./jd/olympicgames/applet');
const OlympicgamesShopLottery = require('./jd/olympicgames/ShopLottery');

/* 极速版 */
const LiteSign = require('./jd/lite/Sign');
const SpringReward = require('./jd/lite/SpringReward');
const EarnCoins = require('./jd/lite/EarnCoins');
const LiteCashSign = require('./jd/lite/CashSign');

/* 本地执行 */
const ReceiveNecklaceCoupon = require('./jd/local/ReceiveNecklaceCoupon');

const nowHour = getNowHour();
const nowDate = getNowDate();
const errorOutput = [];
let yesterdayAppPath;
let yesterdayLog = '';

async function multipleRun(targets, onceDelaySecond = 1) {
  return parallelRun({
    list: targets,
    runFn: doRun,
    onceDelaySecond,
  });
}

async function serialRun(targets, runFn = doRun) {
  for (const target of targets) {
    let stop = false;
    runFn(..._.concat(target)).then(() => {
      stop = true;
    });
    await polling(5 * 60, () => stop);
  }

  async function polling(seconds, stopFn) {
    if (seconds <= 0) return;
    const onceSeconds = 30;
    const stop = stopFn();
    if (stop) return;
    const secondArray = [seconds, onceSeconds];
    await sleep(_.min(secondArray));
    return polling(_.subtract(...secondArray), stopFn);
  }
}

async function doRun(target, cookieData = getCookieData(target.scriptName), method = 'start') {
  const timeLabel = `[${getMoment().format('YYYY-MM-DD HH:mm:ss.SSS')}] [${target.getName()}] do ${method}`;
  console.time(timeLabel);
  let result;
  try {
    result = await target[method](cookieData);
  } catch (e) {
    errorOutput.push(e);
    console.log(e);
  }
  console.timeEnd(timeLabel);
  return result;
}

async function doCron(target, cookieData = getCookieData()) {
  return doRun(target, cookieData, 'cron');
}

// 本地测试
async function doRun1(target, index = 0, needScriptName = false) {
  await doRun(target, getCookieData(needScriptName ? target.scriptName : void 0)[index]);
}

async function doCron1(target, index = 0) {
  await doCron(target, getCookieData()[index]);
}

async function main() {
  if (process.env.NOT_RUN) {
    console.log('不执行脚本');
    return;
  }
  const scheduleOptions = [
    {
      valid: 0,
      run: async () => {
        await serialRun([
          // 23点后的活动补充
          KoiRedPacket,
          IsvShopSign,
          SignShop,
          EarnJingDou,

          // 统计豆豆
          StatisticsBean,

          Olympicgames,
          OlympicgamesApplet,
          OlympicgamesShopLottery,

          // 常驻活动
          SignBeanHome, SignRemote, Sign,
          Fruit, Pet, TurnTableFarm,
          Cash,
          BeanSmallBean,
          PlantBean,
          Family,
          Live,
          Necklace,
          SecondKillRedPacket,

          // 极速版
          VipClubShake, SpringReward, LiteCashSign, EarnCoins,

          [jdFactory, getCookieData(jdFactory.scriptName)[0]],
          [Earn, getCookieData(Earn.scriptName, 'JD_EARN_COOKIE')],

          Smfe,
          GoldCreator,
          Trump,
          // TODO 确认活动有效性
          Car,
        ]);
        await multipleRun([
          HealthSign,
          HealthShare,
          Health,
        ]);
      },
    },
    {
      valid: 5,
      run: async () => {
        await doRun(JxFarm);
      },
    },
    {
      valid: 6,
      run: async () => {
        await doCron(TurnTableFarm);
        await doRun(Joy);
      },
    },
    {
      valid: 7,
      run: async () => {
        await serialRun([
          Fruit, Pet,
          Olympicgames,
          SuperMarket,
          EarnCoins,
          Family,
        ]);
      },
    },
    {
      valid: 9,
      run: async () => {
        await doRun(DreamFactory);
      },
    },
    {
      valid: 10,
      run: async () => {
        await doRun(jdFactory, getCookieData()[0]);
      },
    },
    {
      valid: 12,
      run: async () => {
        await serialRun([
          Fruit, Pet,
        ]);
      },
    },
    {
      valid: 14,
      run: async () => {
      },
    },
    {
      valid: 15,
      run: async () => {
        await doRun(CrazyJoy);
      },
    },
    {
      valid: 16,
      run: async () => {
        await doRun(PlantBean, getCookieData());
      },
    },
    {
      valid: 18,
      run: async () => {
        await serialRun([
          Fruit, Pet,
          Olympicgames,
        ]);
      },
    },
    {
      valid: 19,
      run: async () => {
        await doRun(EarnCoins);
      },
    },
    {
      valid: 20,
      run: async () => {
        await doRun(SuperMarket);
      },
    },
    {
      valid: 22,
      run: async () => {
        await serialRun([
          [jdFactory, getCookieData()[0]],
          Fruit, Pet,
          Necklace,
          Olympicgames,
        ]);
      },
    },
    {
      valid: 23,
      run: async () => {
        await serialRun([
          Sign,
          KoiRedPacket,
          Cash,
          [PlantBean, getCookieData()],
        ]);
        await doCron(PlantBean);
        // await doRun(CrazyJoy);
        yesterdayAppPath = getLogFile('app');

        // 24点后定时启动
        await multipleRun([
          SignShop,
          SuperMarketRedeem,
          // JoyRedeem,
        ]);
        await multipleRun([
          EarnJingDou, IsvShopSign,
          // 做任务抽奖
          WomenBlindBox,
        ], 0);
      },
    },
  ];

  await cronLoop();

  for (const {valid, run} of scheduleOptions) {
    if (nowHour === valid) {
      await run();
    }
  }

  if (yesterdayAppPath) {
    yesterdayLog = fs.readFileSync(yesterdayAppPath);
  }

  // 定时循环
  async function cronLoop() {
    await doCron(jdFactory, getCookieData()[0]);
    await doCron(CrazyJoy);

    if (nowHour % 2 === 0) {
      await doCron(PlantBean);
    }

    if (nowHour % 5 === 0) {
      await doCron(Joy);
      await doCron(Health);
    }

    if (nowHour % 6 === 0) {
      await doCron(SuperMarket);
    }
  }
}

main().then(function () {
  const resultPath = path.resolve(__dirname, '../dist/result.txt');
  if (!fs.existsSync(resultPath)) return;
  return fs.readFileSync(resultPath);
}).then((resultContent = '') => {
  const logFile = getLogFile('app');
  let content = yesterdayLog;
  if (fs.existsSync(logFile)) {
    content += fs.readFileSync(logFile);
  }
  content += resultContent;
  if (!_.isEmpty(errorOutput)) {
    mailer.send({
      subject: ['lazy_script_error', nowDate, nowHour].join('_'),
      text: errorOutput.join('\n'),
    });
  }
  if (!content) return;
  const title = ['lazy_script', nowDate, nowHour].join('_');
  mailer.send({
    subject: title, text: content,
  });
  serverChan.send(title, content).then(() => {
    console.log('发送成功');
  });
});
