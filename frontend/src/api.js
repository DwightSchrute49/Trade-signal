import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

export const fetchSignals = (limit = 50) =>
  API.get(`/signals?limit=${limit}`).then((r) => r.data);

export const fetchStockData = (symbol) =>
  API.get(`/stock/${encodeURIComponent(symbol)}`).then((r) => r.data);

export const triggerScan = () =>
  API.post("/scan").then((r) => r.data);

export const fetchSymbols = () =>
  API.get("/symbols").then((r) => r.data.symbols);
