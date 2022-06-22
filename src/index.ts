import Binance, { OrderSide_LT } from "binance-api-node";
import { API, ST, PROP, E } from "./data";
const client = Binance(API);

import { SuperTrend, EMA } from "@debut/indicators";
const supertrend = new SuperTrend(ST.PERIOD, ST.MULTIPLIER);
const ema = new EMA(E.PERIOD);

//leverage config setup
client.futuresLeverage({
	symbol: PROP.pair,
	leverage: PROP.leverage,
});

// hear for websocket binance
client.ws.futuresCandles(PROP.pair, PROP.interval, (candle) => {
	let { high, low, close, isFinal } = candle;
	// trigger when candle close
	if (isFinal) {
		Main(Number(high), Number(low), Number(close));
	}
});

// run every candle
let bought: boolean = false;
let supertrendDir: number | undefined = undefined;
const Main = (h: number, l: number, c: number) => {
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

async function placeOrder(position: OrderSide_LT) {
	if ((await getBalance()) >= 0.008 || bought) {
		const order = await client.futuresOrder({
			symbol: PROP.pair,
			side: position,
			quantity: "0.008",
			type: "MARKET",
		});
		bought = !bought;
		return console.info(order);
	} else {
		return console.error("Low balance");
	}
}

async function getBalance() {
	const balance = await client.futuresAccountBalance();
	const symbol = balance.filter((el) => {
		return el.asset === PROP.symbol;
	});
	const { BTCUSDT } = await client.prices({ symbol: PROP.pair });
	return Number(symbol[0].balance) / Number(BTCUSDT);
}
