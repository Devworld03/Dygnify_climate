# Climate Hazard Trend Analyzer

A full-stack climate analytics application that analyzes historical temperature data to identify heatwave events, visualize long-term trends, and generate data-driven insights for a selected region.

## Live Demo

- **Frontend:** `https://YOUR-FRONTEND-URL.onrender.com`
- **Backend API:** https://climate-hazard-backend-ljg6.onrender.com
- **API Documentation:** https://climate-hazard-backend-ljg6.onrender.com/docs
- **Health Check:** https://climate-hazard-backend-ljg6.onrender.com/health

## Features

- **Region Search:** Search for locations using the Open-Meteo Geocoding API or enter coordinates manually.
- **Historical Analysis:** Analyze heatwave patterns across a configurable year range.
- **Heatwave Detection:** Identify heatwave events using seasonal temperature thresholds and a configurable minimum duration.
- **Trend Analysis:** Evaluate long-term changes using the Mann–Kendall trend test and linear regression.
- **Interactive Visualizations:** Explore yearly heatwave days and rolling averages through charts.
- **Event-Level Details:** View detected heatwave events and their associated statistics.
- **Automated Insights:** Generate concise summaries of historical trends and changes in heatwave frequency.
- **Data Quality Reporting:** Handle missing values, interpolate short gaps, and flag years with substantial missing data.
- **Caching:** Store processed regional results in MongoDB to reduce unnecessary data processing and API requests.
- **REST API:** Access analysis functionality through FastAPI endpoints.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Recharts |
| Backend | Python, FastAPI, Pydantic |
| Database | MongoDB |
| Data Source | Open-Meteo Historical Weather API |
| Data Processing | Pandas, NumPy |
| Statistical Analysis | SciPy, pymannkendall |
| Deployment | Render |

## Architecture

1. The user searches for a location and selects a historical time range.
2. The frontend sends the selected coordinates and date range to the FastAPI backend.
3. The backend maps the coordinates to a standardized geographic grid and checks the cache.
4. If the required data is not cached, the backend retrieves historical daily temperature data from Open-Meteo.
5. The data-processing pipeline cleans the time series and handles missing or invalid observations.
6. Seasonal temperature thresholds are calculated, and heatwave events are detected.
7. Statistical methods evaluate long-term trends and generate insights.
8. Processed results and metadata are stored in MongoDB.
9. The frontend displays the analysis, visualizations, detected events, and data-quality information.

## Heatwave Detection Methodology

The application uses a threshold-based approach to identify heatwave events.

1. **Data preparation:** Daily temperature observations are cleaned and aligned to a continuous date index.
2. **Seasonal thresholds:** A high temperature percentile is calculated for each day of the year using a moving seasonal window.
3. **Event detection:** Consecutive days exceeding their corresponding seasonal thresholds are grouped into events, subject to a configurable minimum duration.
4. **Annual aggregation:** Detected events are summarized by their start year to calculate yearly heatwave statistics.
5. **Trend evaluation:** Statistical tests and linear regression are used to assess changes over time.

The baseline period, percentile threshold, seasonal window, and minimum event duration are configurable through backend settings.

**Important:** The results are based on the selected temperature variable and configured detection methodology. They should be interpreted as analytical indicators rather than official climate or public-health warnings.

## Data Quality and Reliability

The data-processing pipeline includes the following safeguards:

- Removes physically implausible temperature observations.
- Interpolates short gaps in the daily time series.
- Flags years with more than the configured proportion of missing observations.
- Uses rolling averages to make longer-term patterns easier to interpret.
- Validates coordinates and year ranges before running an analysis.
- Applies request rate limits to selected API endpoints.
- Uses caching and per-region synchronization to reduce duplicate processing.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check backend health |
| GET | `/api/geocode?q={query}` | Search for locations |
| POST | `/api/analyze` | Prepare or retrieve regional analysis data |
| GET | `/api/hazards/heatwave` | Retrieve heatwave statistics and trend results |

### Example: Prepare an Analysis

`POST /api/analyze`

```json
{
  "hazard": "heatwave",
  "lat": 22.7196,
  "lon": 75.8577,
  "start_year": 1991,
  "end_year": 2020
}
```

### Example: Retrieve Heatwave Results

`GET /api/hazards/heatwave?lat=22.7196&lon=75.8577&start_year=1991&end_year=2020`

The API returns regional metadata, the selected period, baseline information, data-quality details, yearly statistics, detected events, trend metrics, and generated insights.

Interactive API documentation is available at `/docs` on the deployed backend.

## Project Structure

```text
climate-hazard-trend-analyzer/
├── backend/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── routers/
│       │   ├── geocode.py
│       │   └── hazards.py
│       ├── schemas/
│       └── services/
│           ├── cleaning.py
│           ├── heatwave.py
│           ├── insights.py
│           ├── openmeteo.py
│           ├── pipeline.py
│           └── trends.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── RegionPicker.jsx
│   │   ├── RangePicker.jsx
│   │   ├── Charts.jsx
│   │   └── InsightCards.jsx
│   ├── .env.example
│   └── package.json
├── render.yaml
└── README.md
```

*Adjust the structure above if your actual repository contains additional or differently named files.*

## Run Locally

### Prerequisites

- Python 3.10 or newer
- Node.js and npm
- A MongoDB database
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd climate-hazard-trend-analyzer
```

### 2. Configure the Backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```bash
venv\Scripts\activate
```

**macOS/Linux:**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the backend environment variables using your project's settings and environment-file conventions. At minimum, provide the MongoDB connection string, database name, and allowed frontend origins.

Example values:

```env
MONGO_URI=your_mongodb_connection_string
DB_NAME=climate_hazards
CORS_ORIGINS=["http://localhost:5173"]
```

Keep credentials private and never commit real secrets.

Start the backend from the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The backend should be available at `http://localhost:8000`.

### 3. Configure the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

**Note:** Vite environment variables are embedded during the frontend build. Restart the development server after changing `.env` values.

## Deployment

The application is deployed on Render.

1. Configure the backend service with its Python build and start commands.
2. Configure MongoDB connection details and allowed CORS origins.
3. Deploy the frontend as a static site.
4. Set the frontend's `VITE_API_BASE_URL` environment variable to the deployed backend URL.
5. Redeploy the frontend after changing build-time environment variables.
6. Verify the frontend, backend health endpoint, and API documentation.

Do not commit database credentials or other secrets to the repository.

## Limitations and Future Improvements

- Expand the analysis to additional hazards such as cold waves, droughts, and extreme precipitation.
- Add downloadable CSV reports and richer regional comparisons.
- Introduce automated tests for data cleaning, event detection, and API validation.
- Improve caching policies and background processing for large analysis requests.
- Add more detailed uncertainty reporting and validation against independent climate datasets.
- Enhance accessibility and mobile responsiveness.

## Author

Developed as a full-stack climate analytics project, combining historical weather data, statistical analysis, backend API development, and interactive data visualization.
