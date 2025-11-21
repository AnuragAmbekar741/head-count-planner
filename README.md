# Head Count Planner

A comprehensive financial planning tool for tracking headcount, costs, and runway. Plan scenarios, visualize burn rates, and make informed decisions about your company's financial health.

## Features

- 📊 **Scenario Planning**: Create and manage multiple financial scenarios
- 💰 **Cost & Revenue Tracking**: Track costs and revenues with flexible time periods
- 📈 **Pipeline Visualization**: Visualize burn cycles with drag-and-drop pipeline view
- 🤖 **AI-Powered**: Convert natural language into structured scenario data using LLM
- 📉 **Financial Metrics**: Real-time calculation of burn rate, growth rate, and runway
- 🔐 **Google OAuth**: Secure authentication with Google Sign-In

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.12 or higher)
- **Poetry** (for Python dependency management)
- **PostgreSQL** (or SQLite for development)
- **Google OAuth Credentials** (for authentication)
- **OpenAI API Key** (for LLM features)

## Installation

### Backend Setup

1. Navigate to the service directory:

```bash
cd service
```

2. Install Poetry (if not already installed):

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

3. Install Python dependencies:

```bash
poetry install
```

4. Set up environment variables:
   Create a `.env` file in the `service` directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/headcount_planner
# or for SQLite (development):
# DATABASE_URL=sqlite://db.sqlite3

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GMAIL_REDIRECT_URI=http://localhost:8000/auth/google/callback

# JWT
JWT_SECRET_KEY=your_secret_key_here

# OpenAI (for LLM features)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.7
```

5. Initialize database migrations:

```bash
make migrate-init-db
```

6. Apply migrations:

```bash
make migrate-up
```

### Frontend Setup

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the `client` directory:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_BASE_URL=http://localhost:8000
```

## Running the Application

### Development Mode

1. **Start the backend server** (from `service` directory):

```bash
make dev
```

Or manually:

```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

2. **Start the frontend development server** (from `client` directory):

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Production Mode

1. **Build the frontend**:

```bash
cd client
npm run build
```

2. **Run the backend** (from `service` directory):

```bash
make run
```

Or manually:

```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Database Migrations

When you make changes to models, generate and apply migrations:

1. **Generate migration**:

```bash
cd service
make migrate-gen
```

2. **Apply migration**:

```bash
make migrate-up
```

## Project Structure

```
head-count-planner/
├── client/                 # React
```
