def evaluate_signal(rsi, price, ema50):

    if rsi is None:
        return "HOLD"

    if rsi < 35 and price > ema50:
        return "BUY"

    elif rsi > 65 and price < ema50:
        return "SELL"

    else:
        return "HOLD"