# backend/app/services/insights.py
def build_insight(yearly: list[dict], trend: dict) -> str:
    n = len(yearly)
    if n < 8 or trend.get("method") == "insufficient_data":
        return "Not enough years in the selected range (at least 8 needed) to assess a trend."

    days = [y["heatwave_days"] for y in yearly]
    k = min(10, max(n // 3, 1))
    first = sum(days[:k]) / k
    last = sum(days[-k:]) / k
    first_label = f"{yearly[0]['year']}-{yearly[k - 1]['year']}"
    last_label = f"{yearly[-k]['year']}-{yearly[-1]['year']}"

    if first == 0 and last == 0:
        return "No heatwave days were detected in this region for the selected period."

    if first > 0:
        pct = (last - first) / first * 100
        change = f"{'increased' if pct >= 0 else 'decreased'} by {abs(pct):.0f}%"
    else:
        change = f"went from 0 to {last:.1f} days/year"

    text = (
        f"Average heatwave days per year {change} between {first_label} "
        f"({first:.1f} days/yr) and {last_label} ({last:.1f} days/yr)."
    )

    p = trend["p_value"]
    if trend["significant"]:
        direction = "upward" if trend["sen_slope"] > 0 else "downward"
        text += (
            f" The Mann-Kendall test shows a statistically significant {direction} trend "
            f"(p={p:.3f}, Sen's slope {trend['sen_slope']:+.2f} days/yr)."
        )
    else:
        text += (
            f" However, the trend is not statistically significant (p={p:.3f}), "
            f"so this change may be natural variability."
        )
    return text