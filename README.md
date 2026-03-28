# EDA Backend API

Backend API for Samsung Watch EDA (Electrodermal Activity) data collection.

## Features

- Direct MongoDB storage in `EDA_Data` collection
- Batch upload support (500 records per batch)
- Duplicate detection and prevention
- RESTful API endpoints
- Winston logging

## Setup

### Local Development

1. Install dependencies:
```bash
cd eda_backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
MONGODB_URI=mongodb+srv://tech_user:Nextyou@24@cluster0.ush6z3w.mongodb.net/
PORT=5001
NODE_ENV=development
```

4. Start server:
```bash
# Development
npm run dev

# Production
npm start
```

### Render Deployment

1. Push code to GitHub

2. Create new Web Service on Render:
   - Connect your GitHub repository
   - Select `Wearable_app/eda_backend` as root directory
   - Build Command: `npm install`
   - Start Command: `npm start`

3. Add Environment Variables in Render:
   - `MONGODB_URI`: `mongodb+srv://tech_user:Nextyou@24@cluster0.ush6z3w.mongodb.net/`
   - `NODE_ENV`: `production`
   - `PORT`: `5001`

4. Deploy!

Your backend will be available at: `https://your-app.onrender.com`

## API Endpoints

### POST /api/v1/health-data/eda-batch
Batch upload EDA data from watch

**Request Body:**
```json
{
  "data": [
    {
      "user_id": "123456",
      "timestamp": "2024-03-28 10:30:00",
      "rr_interval_ms": 850,
      "accel_x": -1000,
      "accel_y": -3000,
      "accel_z": 2000,
      "step_count": 100,
      "eda": 32.5
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "EDA data uploaded successfully",
  "data": {
    "inserted": 1,
    "duplicates": 0,
    "user_id": "123456"
  }
}
```

### GET /api/v1/health-data/eda
Get EDA data with pagination

**Query Parameters:**
- `user_id` (optional): Filter by user ID
- `limit` (optional): Records per page (default: 50, max: 500)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "message": "EDA data retrieved successfully",
  "data": [...],
  "pagination": {
    "total": 1000,
    "page": 1,
    "limit": 50,
    "pages": 20
  }
}
```

## Data Schema

```javascript
{
  user_id: String,        // Watch device ID
  timestamp: String,      // Data collection time
  rr_interval_ms: Number, // Heart rate RR interval
  accel_x: Number,        // Accelerometer X
  accel_y: Number,        // Accelerometer Y
  accel_z: Number,        // Accelerometer Z
  step_count: Number,     // Cumulative steps
  eda: Number,            // EDA value (skin temperature)
  createdAt: Date,        // MongoDB timestamp
  updatedAt: Date         // MongoDB timestamp
}
```

## MongoDB Collection

- **Database:** Default database (no database name in URI)
- **Collection Name:** `Eda_Data` (capital E, capital D)
- **Indexes:** 
  - `{ user_id: 1, timestamp: 1 }` (unique)
  - `{ user_id: 1 }`

## Watch App Integration

Update watch app `BackendApiSender.kt`:

```kotlin
// For Render deployment
private val BACKEND_URL = "https://your-app.onrender.com/api/v1/health-data/eda-batch"

// For local testing
// private val BACKEND_URL = "http://YOUR_LOCAL_IP:5001/api/v1/health-data/eda-batch"
```

## Logging

Logs are stored in:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## License

ISC
