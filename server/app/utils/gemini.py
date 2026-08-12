import os
import json
import httpx
from typing import List, Dict, Any

# Load API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


async def analyze_visitor_behavior(visitor_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sends visitor journey data to Gemini to get insights about their behavior,
    purchase intent, bot status, intent group, and classification.
    """
    if not GEMINI_API_KEY:
        return generate_mock_insights(visitor_data)

    # Build prompt
    prompt = f"""
    You are an AI Analytics Architect. Analyze this visitor's website activity data and classify them.
    
    Visitor Data:
    {json.dumps(visitor_data, indent=2, default=str)}
    
    Provide your response in JSON format. The JSON must match this schema:
    {{
      "summary": "A concise summary (1-2 sentences) of their journey and interest.",
      "purchase_intent": "high" | "medium" | "low",
      "is_bot": true | false,
      "intent_group": "A group description, e.g., 'window_shopping', 'price_comparison', 'intent_to_buy', 'spam_attempt', 'accidental_click'",
      "classification": "Buyer" | "Browser" | "Bot" | "Returning Customer",
      "recommendations": ["First UI/UX recommendation based on behavior", "Second recommendation"],
      "insights": "Additional context or insights about what pages or categories they focused on."
    }}
    
    Return ONLY the raw JSON object. Do not wrap it in markdown code blocks.
    """

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                res_data = response.json()
                text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text.strip())
            else:
                print(
                    f"Gemini API returned error code {response.status_code}: {response.text}"
                )
    except Exception as e:
        print(f"Error calling Gemini API: {e}")

    return generate_mock_insights(visitor_data)


def generate_mock_insights(visitor_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback rule-based classification when Gemini is unavailable or not configured.
    """
    pageviews = visitor_data.get("pageviews", [])
    events = visitor_data.get("events", [])
    forms = visitor_data.get("forms", [])

    # Count important events
    cart_adds = sum(
        1 for e in events if e.get("event_type") in ("cart_add", "cart_addition")
    )
    wishlist_adds = sum(
        1 for e in events if e.get("event_type") in ("wishlist_add", "wishlist_addition")
    )
    conversions = visitor_data.get("conversions", [])
    search_queries = [
        e.get("event_data", {}).get("query")
        for e in events
        if e.get("event_type") == "search"
    ]

    has_purchased = len(conversions) > 0
    has_form = len(forms) > 0

    # Basic bot heuristic
    is_bot = False
    user_agent = visitor_data.get("device", {}).get("browser", "")
    if "bot" in user_agent.lower() or "spider" in user_agent.lower():
        is_bot = True

    # Intent classification
    if is_bot:
        purchase_intent = "low"
        classification = "Bot"
        intent_group = "automated_crawler"
        summary = "Automated traffic detected. This activity aligns with search engine crawlers or scraping bots."
        recommendations = ["Monitor traffic patterns", "Configure robots.txt if needed"]
    elif has_purchased:
        purchase_intent = "high"
        classification = "Buyer"
        intent_group = "completed_purchase"
        summary = "Highly engaged buyer who successfully completed a checkout transaction."
        recommendations = [
            "Send post-purchase thank you email with discount",
            "Recommend matching items in follow-up",
        ]
    elif cart_adds > 0:
        purchase_intent = "high"
        classification = "Buyer"
        intent_group = "abandoned_cart"
        summary = "Visitor added items to their shopping cart but did not proceed to checkout."
        recommendations = [
            "Trigger cart abandonment reminder",
            "Highlight limited stock or free shipping",
        ]
    elif wishlist_adds > 0:
        purchase_intent = "medium"
        classification = "Browser"
        intent_group = "wishlist_curator"
        summary = "Visitor saved items to their wishlist, showing intent but deferring purchasing."
        recommendations = [
            "Prompt user to register to save wishlist permanently",
            "Send alerts if items in their wishlist go on sale",
        ]
    elif len(pageviews) > 5:
        purchase_intent = "medium"
        classification = "Browser"
        intent_group = "deep_browsing"
        summary = "Visitor browsed multiple pages and products, displaying active product exploration."
        recommendations = [
            "Implement exit-intent popup with first-time buyer discount",
            "Optimize recommendation widget placements",
        ]
    elif has_form:
        purchase_intent = "medium"
        classification = "Buyer"
        intent_group = "contact_form_lead"
        summary = "Visitor engaged with the platform by submitting a contact/lead form."
        recommendations = [
            "Respond immediately to the contact query",
            "Subscribe lead to relevant newsletters",
        ]
    else:
        purchase_intent = "low"
        classification = "Browser"
        intent_group = "quick_exit"
        summary = "Visitor had a brief session with minimal engagement."
        recommendations = [
            "Improve landing page speed",
            "Make hero banner call-to-actions more prominent",
        ]

    # Additional text response
    insights = f"Visitor viewed {len(pageviews)} pages. "
    if search_queries:
        insights += f"Searched for: {', '.join(search_queries)}. "
    if cart_adds:
        insights += f"Added to cart {cart_adds} times. "

    return {
        "summary": summary,
        "purchase_intent": purchase_intent,
        "is_bot": is_bot,
        "intent_group": intent_group,
        "classification": classification,
        "recommendations": recommendations,
        "insights": insights.strip(),
    }
