import Binance, { OrderSide_LT } from "binance-api-node";
import { API, ST, PROP, E } from "./data";
const client = Binance(API);

import { SuperTrend, EMA } from "@debut/indicators";
const supertrend = new SuperTrend(ST.PERIOD, ST.MULTIPLIER);
const ema = new EMA(E.PERIOD);

// set previous candles on indicators
(async () => {
	console.info("reading previous candles");
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
	console.info("past candles set");
	// start to hear future candles
	console.info("started to hear for new candles");
	client.ws.futuresCandles(PROP.pair, PROP.interval, (candle) => {
		let { high, low, close, isFinal } = candle;
		// trigger when candle close
		if (isFinal) {
			Main(Number(high), Number(low), Number(close));
		}
	});
})();

// leverage config setup
client.futuresLeverage({
	symbol: PROP.pair,
	leverage: PROP.leverage,
});

// hear for websocket binance

let position: "opened" | "closed" = "closed";
let direction: "short" | "long" | "" = "";
let supertrendDir: number | undefined = undefined;
let prevSupertrendDir: number | undefined = undefined;
let lastAvgPrice: number = 0;
// run every candle
const Main = (h: number, l: number, c: number) => {
	const st = supertrend.nextValue(h, l, c);
	const e = ema.nextValue(c);
	supertrendDir = st ? st.direction : undefined;
	console.info("position", position);
	console.info("direction", direction);
	console.info("supertrend", st);
	console.info("ema", e);
	console.info("close", c);
	if (position === "closed") {
		if (
			direction !== "long" &&
			c > e &&
			prevSupertrendDir === 1 &&
			supertrendDir === -1
		) {
			console.info("Open Long");
			placeOrder("BUY");
			position = "opened";
			direction = "long";
		}
		if (
			direction !== "short" &&
			c < e &&
			prevSupertrendDir === -1 &&
			supertrendDir === 1
		) {
			console.info("Open Short");
			placeOrder("SELL");
			position = "opened";
			direction = "short";
		}
	}

	if (position === "opened") {
		if (
			direction === "long" &&
			c < e &&
			prevSupertrendDir === -1 &&
			supertrendDir === 1
		) {
			console.info("Close Long");
			placeOrder("SELL");
			position = "closed";
			direction = "";
		}
		if (
			direction === "short" &&
			c > e &&
			prevSupertrendDir === 1 &&
			supertrendDir === -1
		) {
			console.info("Close Short");
			placeOrder("BUY");
			position = "closed";
			direction = "";
		}
		if (direction === "long" && c >= lastAvgPrice * 1.005) {
			console.info("Close Long");
			placeOrder("SELL");
			position = "closed";
			direction = "";
		}
		if (direction === "short" && c <= lastAvgPrice * 0.995) {
			console.info("Close Short");
			placeOrder("BUY");
			position = "closed";
			direction = "";
		}
	}

	prevSupertrendDir = supertrendDir;
};

// place order
async function placeOrder(position: OrderSide_LT) {
	if ((await getBalance()) >= PROP.balance) {
		const order = await client.futuresOrder({
			symbol: PROP.pair,
			side: position,
			quantity: PROP.balance.toString(),
			type: "MARKET",
		});
		lastAvgPrice = Number(order.avgPrice);
		return console.info(order);
	} else {
		return console.error("Low balance");
	}
}

// get current future account balance and convert to BTC
async function getBalance() {
	const balance = await client.futuresAccountBalance();
	const symbol = balance.filter((el) => {
		return el.asset === PROP.symbol;
	});
	const { BTCUSDT } = await client.prices({ symbol: PROP.pair });
	return Number(symbol[0].balance) / Number(BTCUSDT);
}
