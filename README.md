# Order Flow Manager

A full-stack order management system built with React, Express, TypeScript, and MongoDB.

## Features

- Menu display with categories (Pizza, Burgers, Salads, Sides)
- Shopping cart functionality
- Order placement with customer details
- Real-time order status tracking
- Responsive UI with Tailwind CSS

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI components
- React Query for state management
- Wouter for routing

### Backend
- Express.js
- TypeScript
- MongoDB
- WebSocket support

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```
   DATABASE_URL=mongodb://localhost:27017
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get specific menu item
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details

## Project Structure

```
├── client/          # Frontend React app
├── server/          # Backend Express server
├── shared/          # Shared types and schemas
├── script/          # Build scripts
└── public/          # Static assets
```

## License

MIT