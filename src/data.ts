import { CandleChartInterval_LT } from "binance-api-node";
import * as dotenv from "dotenv";
dotenv.config();

const API = {
	apiKey: process.env.API_KEY,
	apiSecret: process.env.SECRET_KEY,
};

const ST = {
	PERIOD: 10,
	MULTIPLIER: 3,
};

const E = {
	PERIOD: 200,
};

type PROPTYPE = {
	symbol: string;
	leverage: number;
	pair: string;
	interval: CandleChartInterval_LT;
	balance: number;
};

const PROP: PROPTYPE = {
	symbol: "USDT",
	leverage: 1,
	pair: "BTCUSDT",
	interval: "1m",
	balance: 0.008, //btc converted
};

export { API, ST, E, PROP };
