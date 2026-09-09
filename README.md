# Dashboard Project

This project consists of two parts:
- Frontend: React application (client/)
- Backend: Node.js API (server/)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- SQL Server (accessible from the backend)
- npm or yarn

### Backend Setup
1. Navigate to the `server` directory.
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and fill in your SQL Server connection details.
4. Start the server: `npm start`
   - The server will run on `http://localhost:5000` by default.

### Frontend Setup
1. Navigate to the `client` directory.
2. Install dependencies: `npm install`
3. Create a `.env` file in the client directory (if needed) to set the API base URL.
   - By default, the frontend expects the backend at `http://localhost:5000/api`.
   - If your backend is running on a different port or host, create a `.env` file in the client directory with:
     ```
     VITE_API_BASE_URL=http://your-backend-host:port/api
     ```
4. Start the development server: `npm run dev`
   - The frontend will run on `http://localhost:5173` by default.

### Project Structure
```
dashboard-project/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API service
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
└── server/                  # Node.js backend
    ├── src/
    │   ├── config/         # Database configuration
    │   ├── routes/         # API routes
    │   ├── utils/          # Utility functions
    │   └── server.js       # Entry point
    ├── .env                # Environment variables (create from .env.example)
    └── .env.example
```

### API Endpoint
- `GET /api/dashboard-data`
  - Query Parameters:
    - `startDate` (optional): Format YYYY-MM-DD
    - `endDate` (optional): Format YYYY-MM-DD
  - Returns JSON with the following structure:
    ```json
    {
      "totals": {
        "totalVisits": number,
        "totalSamples": number,
        "totalDelegates": number,
        "avgSamplesPerVisit": number
      },
      "visitTrend": [
        { "date": "YYYY-MM-DD", "visitCount": number }
      ],
      "samplesByDelegate": [
        { "label": "Delegate Name", "value": number }
      ],
      "delegatePerformance": [
        { "delegate": "Delegate Name", "visits": number, "samples": number }
      ],
      "geoData": [
        {
          "latitude": number,
          "longitude": number,
          "label": string,
          "value": number
        }
      ]
    }
    ```

### Notes
- The backend expects a stored procedure named `sp_GetVisitsAndQuestionsXML` that returns XML data.
- The stored procedure should accept two optional parameters: `@StartDate` and `@EndDate` (as VARCHAR(10)).
- If the parameters are not provided, the procedure should return all data.
- The XML returned by the stored procedure is parsed and converted to JSON for the frontend.

### Troubleshooting
- If you encounter connection issues, double-check your `.env` file and ensure the SQL Server is accessible.
- Make sure the SQL Server allows remote connections if the backend is running on a different machine.
- The backend uses the `mssql` package; consult its documentation for more advanced configuration.

