# Climate Hazard Trend Analyzer

## Setup
### Backend
```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
### Frontend
```
cd frontend
npm install
npm run dev
```

## Architecture
_TODO_

## Data source
Open-Meteo Historical API (ERA5 reanalysis), daily `temperature_2m_max`.

## Hazard logic (heatwave)
_TODO: calendar-day 95th percentile (+/- window), fixed 1991-2020 baseline, 3+ consecutive days_

## Assumptions
- Region is represented by a single ERA5 grid point (box centre).
- _TODO_

## What I would improve with more time
_TODO_

## AI tools used
_TODO: which tools and how_
