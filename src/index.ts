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

// strategy variables
let position: "opened" | "closed" = "closed";
let direction: "short" | "long" | "" = "";
let supertrendDir: number | undefined = undefined;
let prevSupertrendDir: number | undefined = undefined;
let lastAvgPrice: number | undefined = undefined;
let closeValue: number | undefined = undefined;
let stDirValue: number | undefined = undefined;
let emaValue: number | undefined = undefined;

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
		if (i === pastCandles.length - 1) supertrendDir = st.direction;
	}
	console.info("past candles set");
	// start to hear future candles
	console.info("started to hear for new candles");
	client.ws.futuresCandles(PROP.pair, PROP.interval, (candle) => {
		let { high, low, close, isFinal } = candle;
		// trigger when candle close
		if (isFinal) {
			prevSupertrendDir = supertrendDir;
			strategy(Number(high), Number(low), Number(close));
		}
		switch (position) {
			case "closed":
				if (
					direction !== "long" &&
					closeValue! > emaValue! &&
					prevSupertrendDir === 1 &&
					supertrendDir === -1
				) {
					position = "opened";
					direction = "long";
					console.info("Open Long");
					placeOrder("BUY");
				}
				if (
					direction !== "short" &&
					closeValue! < emaValue! &&
					prevSupertrendDir === -1 &&
					supertrendDir === 1
				) {
					position = "opened";
					direction = "short";
					console.info("Open Short");
					placeOrder("SELL");
				}
				break;
			case "opened":
				switch (direction) {
					case "long":
						if (
							closeValue! < emaValue! &&
							prevSupertrendDir === -1 &&
							supertrendDir === 1
						) {
							position = "closed";
							direction = "";
							console.info("Stoploss Long");
							placeOrder("SELL");
						}
						if (Number(close) >= lastAvgPrice! * 1.005) {
							position = "closed";
							direction = "";
							console.info("Profit Long");
							placeOrder("SELL");
						}
						break;
					case "short":
						if (
							closeValue! > emaValue! &&
							prevSupertrendDir === 1 &&
							supertrendDir === -1
						) {
							position = "closed";
							direction = "";
							console.info("Stoploss Short");
							placeOrder("BUY");
						}
						if (Number(close) <= lastAvgPrice! * 0.995) {
							position = "closed";
							direction = "";
							console.info("Profit Short");
							placeOrder("BUY");
						}
						break;
				}
		}
	});
})();

// run every candle
const strategy = (h: number, l: number, c: number) => {
	const stValue = supertrend.nextValue(h, l, c);
	stDirValue = stValue.direction;
	emaValue = Number(ema.nextValue(c));
	closeValue = c;
	supertrendDir = stDirValue ? stDirValue : undefined;
	console.info("position", position);
	console.info("direction", direction);
	console.info("supertrend", stDirValue);
	console.info("ema", emaValue);
	console.info("close", c);
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
		const lastOrder = await client.futuresGetOrder({
			symbol: PROP.pair,
			orderId: order.orderId,
		});
		lastAvgPrice = Number(lastOrder.avgPrice);
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
