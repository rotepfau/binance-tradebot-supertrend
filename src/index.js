"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const binance_api_node_1 = __importDefault(require("binance-api-node"));
const data_1 = require("./data");
const client = (0, binance_api_node_1.default)(data_1.API);
const indicators_1 = require("@debut/indicators");
const supertrend = new indicators_1.SuperTrend(data_1.ST.PERIOD, data_1.ST.MULTIPLIER);
const ema = new indicators_1.EMA(data_1.E.PERIOD);
//leverage config setup
client.futuresLeverage({
    symbol: data_1.PROP.pair,
    leverage: data_1.PROP.leverage,
});
// hear for websocket binance
client.ws.futuresCandles(data_1.PROP.pair, data_1.PROP.interval, (candle) => {
    let { high, low, close, isFinal } = candle;
    // trigger when candle close
    if (isFinal) {
        Main(Number(high), Number(low), Number(close));
    }
});
// run every candle
let bought = false;
let supertrendDir = undefined;
const Main = (h, l, c) => {
    const st = supertrend.nextValue(h, l, c);
    const e = ema.nextValue(c);
    supertrendDir = st ? st.direction : undefined;
    if (bought === false && c > e && supertrendDir === -1) {
        console.info("Buyin");
        placeOrder("BUY");
    }
    if (bought === true && c < e && supertrendDir === 1) {
        console.info("Selling");
        placeOrder("SELL");
    }
};
getBalance().then(console.log);
function placeOrder(position) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((yield getBalance()) >= 0.008 || bought) {
            const order = yield client.futuresOrder({
                symbol: data_1.PROP.pair,
                side: position,
                quantity: "0.008",
                type: "MARKET",
            });
            bought = !bought;
            return console.info(order);
        }
        else {
            return console.error("Low balance");
        }
    });
}
function getBalance() {
    return __awaiter(this, void 0, void 0, function* () {
        const balance = yield client.futuresAccountBalance();
        const symbol = balance.filter((el) => {
            return el.asset === data_1.PROP.symbol;
        });
        const { BTCUSDT } = yield client.prices({ symbol: data_1.PROP.pair });
        return Number(symbol[0].balance) / Number(BTCUSDT);
    });
}
