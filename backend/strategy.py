def evaluate_signal(rsi: float | None, price: float, ema200: float | None) -> str:
    """
    Signal strategy:
      BUY  -> RSI < 30 AND price > EMA200
      SELL -> RSI > 70
      HOLD -> everything else
    """
    if rsi is None:
        return "HOLD"

    if rsi < 30 and ema200 is not None and price > ema200:
        return "BUY"
    elif rsi > 70:
        return "SELL"
    else:
        return "HOLD"
