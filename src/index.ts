import Binance, { OrderSide_LT } from "binance-api-node";
import { API, ST, PROP, E } from "./data";
const client = Binance(API);

import { SuperTrend, EMA } from "@debut/indicators";
const supertrend = new SuperTrend(ST.PERIOD, ST.MULTIPLIER);
const ema = new EMA(E.PERIOD);

// leverage config setup
client.futuresLeverage({
	symbol: PROP.pair,
	leverage: PROP.leverage,
});

// set previous candles on indicators
(async () => {
	const pastCandles = await client.futuresCandles({
		symbol: PROP.pair,
		interval: PROP.interval,
	});
	for (let i = pastCandles.length - E.PERIOD; i < pastCandles.length; i++) {
		const { high, low, close } = pastCandles[i];
		const st = supertrend.nextValue(
			Number(high),
			Number(low),
			Number(close)
		);
		ema.nextValue(Number(close));
		if (i === pastCandles.length - 1) prevSupertrendDir = st.direction;
	}
	return console.info("past candles set");
})();

// hear for websocket binance
client.ws.futuresCandles(PROP.pair, PROP.interval, (candle) => {
	let { high, low, close, isFinal } = candle;
	// trigger when candle close
	if (isFinal) {
		Main(Number(high), Number(low), Number(close));
	}
});

let bought: boolean = false;
let supertrendDir: number | undefined = undefined;
let prevSupertrendDir: number | undefined = undefined;
// run every candle
const Main = (h: number, l: number, c: number) => {
	const st = supertrend.nextValue(h, l, c);
	const e = ema.nextValue(c);
	supertrendDir = st ? st.direction : undefined;
	console.info("bought", bought);
	console.info("supertrend", st);
	console.info("ema", e);
	console.info("close", c);
	if (
		bought === false &&
		c > e &&
		prevSupertrendDir === 1 &&
		supertrendDir === -1
	) {
		console.info("Buyin");
		placeOrder("BUY");
	}
	if (
		bought === true &&
		c < e &&
		prevSupertrendDir === -1 &&
		supertrendDir === 1
	) {
		console.info("Selling");
		placeOrder("SELL");
	}
	prevSupertrendDir = supertrendDir;
};

async function placeOrder(position: OrderSide_LT) {
	if ((await getBalance()) >= PROP.balance || bought) {
		const order = await client.futuresOrder({
			symbol: PROP.pair,
			side: position,
			quantity: PROP.balance.toString(),
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
