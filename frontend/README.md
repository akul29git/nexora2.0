# Nexora2 Frontend

Production-quality React dashboard for the Nexora2 IoT sensor pipeline.

## Features

- **Real-time Monitoring**: Live sensor data with automatic polling (2s interval)
- **Interactive Charts**: Acceleration, gyroscope, and distance visualizations using Recharts
- **Status Indicators**: Clear visual status (Live/Stale/Fallback/Error) with source tracking
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Light Theme**: Clean, professional light theme with Tailwind CSS
- **TypeScript**: Full type safety across the codebase
- **Error Boundaries**: Graceful error handling with retry functionality
- **Loading States**: Skeleton screens and spinners for better UX

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **TanStack Query (React Query)** for data fetching and caching
- **Recharts** for interactive charts
- **Lucide React** for icons
- **date-fns** for date formatting
- **Vitest** for testing
- **ESLint + Prettier** for code quality

## Project Structure

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components (Button, Card, Badge, etc.)
│   │   ├── sensors/      # Sensor-specific display components
│   │   └── charts/       # Chart components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── test/             # Test setup
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.cjs
├── prettier.config.cjs
└── vitest.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- Backend server running on `http://localhost:3000`

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` with API requests proxied to `http://localhost:3000`.

### Building

```bash
npm run build
```

Output will be in the `dist/` directory.

### Testing

```bash
npm test
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

## API Integration

The frontend expects the backend API at `/api` (proxied in development):

- `GET /api/sensors` - Latest sensor reading
- `GET /api/health` - Server health status

The polling interval is 2 seconds for sensor data and 5 seconds for health.

## Components Overview

### Dashboard (Main View)

Displays:
- Connection status with live/stale/fallback indicators
- Key metrics cards (status, uptime, data age, last contact)
- Real-time charts for:
  - Acceleration (X, Y, Z axes)
  - Gyroscope (X, Y, Z axes)
  - Distance sensors (Ultrasonic + LiDAR)
- Detailed sensor readings cards with:
  - Vector3D display for 3-axis sensors
  - Scalar values with progress bars
  - Valid/invalid badges
- Raw JSON response for debugging

### UI Components

- **Button** - Primary, secondary, ghost, danger variants with loading state
- **Card** - Flexible card with header, body, footer
- **Badge** - Status badges with variants and optional indicator dots
- **StatCard** - Metric display with trend indicator
- **LoadingSpinner** - Multiple sizes, overlay support
- **ErrorBoundary** - Graceful error handling with retry

### Sensor Components

- **SensorStatus** - Connection status with source, age, last contact
- **SensorReadingCard** - Sensor container with validity badge
- **Vector3D** - Three-axis display with formatted values
- **ScalarValue** - Single value with progress bar and range

### Chart Components

- **SensorChart** - Reusable line chart with tooltip, legend, responsive container

## Customization

### Colors

Edit `tailwind.config.js` to customize the color palette:

```js
colors: {
  primary: { ... },      // Main brand color
  surface: { ... },      // Neutral grays
  status: {              // Status colors
    ok: '#10b981',
    stale: '#f59e0b',
    fallback: '#6b7280',
    error: '#ef4444',
  },
}
```

### Polling Intervals

Modify in `src/hooks/useSensorData.ts`:

```ts
export function useSensorData(pollInterval = 2000) { ... }
export function useHealth(pollInterval = 5000) { ... }
```

### Chart History

Change `CHART_HISTORY_SIZE` in `Dashboard.tsx` (default: 50 points).

## Environment Variables

Create `.env` file for production:

```env
VITE_API_URL=https://your-api-domain.com/api
```

## Deployment

Build output in `dist/` can be served by any static file server:

```bash
npm run build
# Serve dist/ with nginx, Apache, Vercel, Netlify, etc.
```

For production, update the proxy in `vite.config.ts` to your actual API URL.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT