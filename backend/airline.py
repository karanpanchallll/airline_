from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FilterInput(BaseModel):
    origin: str
    destination: str
    start_date: str
    end_date: str

# Gemini API config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

@app.post("/api/analyze")
async def analyze_demand(filters: FilterInput):
    # Simulated data
    days = pd.date_range(filters.start_date, filters.end_date, freq='D')
    np.random.seed(42)
    demand = np.random.poisson(150, len(days))
    base_price = 220
    price_variation = np.random.normal(0, 40, len(days))
    weekend_boost = [30 if day.weekday() >= 5 else 0 for day in days]
    prices = np.round(base_price + price_variation + weekend_boost, 2)

    sample_data = pd.DataFrame({
        "date": days.strftime('%Y-%m-%d'),
        "origin": filters.origin,
        "destination": filters.destination,
        "bookings": demand,
        "price": prices
    })

    json_data = sample_data.to_json(orient="records")

    prompt = f"""
Analyze this airline booking and pricing data between {filters.origin} and {filters.destination}:
{json_data}

Extract:
1. Popular travel days or high-demand periods
2. Demand trend (increasing/decreasing/stable)
3. Price trend (rising/falling/stable)
4. Key observations

Return the output **strictly as valid JSON** inside triple backticks like this:
```json
{{
  "demand_trend": "...",
  "price_trend": "...",
  "popular_days": ["..."],
  "observations": "..."
}}
"""

    try:
        response = model.generate_content(prompt)
        raw_output = response.parts[0].text.strip()
        print("RAW GEMINI RESPONSE:\n", raw_output)

        match = re.search(r"```json(.*?)```", raw_output, re.DOTALL)
        if match:
            json_block = match.group(1).strip()
            result = json.loads(json_block)
        else:
            result = {"error": "Gemini did not return valid JSON format."}

    except Exception as e:
        result = {"error": f"AI processing failed: {str(e)}"}

    return {
        "data": sample_data.to_dict(orient="records"),
        "insights": result
    }
