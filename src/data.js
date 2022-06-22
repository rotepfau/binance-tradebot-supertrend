"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROP = exports.E = exports.ST = exports.API = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const API = {
    apiKey: process.env.API_KEY,
    apiSecret: process.env.SECRET_KEY,
};
exports.API = API;
const ST = {
    PERIOD: 2,
    MULTIPLIER: 3,
};
exports.ST = ST;
const E = {
    PERIOD: 3,
};
exports.E = E;
const PROP = {
    symbol: "USDT",
    leverage: 1,
    pair: "BTCUSDT",
    interval: "1m",
};
exports.PROP = PROP;
