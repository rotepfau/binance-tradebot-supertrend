import * as dotenv from "dotenv";
dotenv.config();

const API = {
	apiKey: process.env.API_KEY,
	apiSecret: process.env.SECRET_KEY,
};

const ST = {
	PERIOD: 2,
	MULTIPLIER: 3,
};

const E = {
	PERIOD: 3,
};

const PROP = {
	symbol: "USDT",
	leverage: 1,
	pair: "BTCUSDT",
	interval: "1m",
};

export { API, ST, E, PROP };
