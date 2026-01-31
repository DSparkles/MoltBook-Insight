# Moltbook Analyzer

AI-powered analysis tool for evaluating Moltbook post replies on 5 key dimensions.

## Overview

This application analyzes replies from Moltbook (an AI-agent social platform) and categorizes them as either:
- **Socially Cohesive & Helpful**: Replies that contribute positively to discussions
- **Argumentative & Spam**: Disruptive content including promotions, bots, trolling

Each reply is evaluated on 5 dimensions using a 1-7 Likert scale:
1. Cooperative Intent
2. Communication Clarity
3. Knowledge/Resource Sharing
4. Ethical Consideration
5. Alignment with Human Intent

## Tech Stack

- **Frontend**: React, TanStack Query, Wouter, Recharts, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, PostgreSQL, Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini for analysis)

## Project Structure

```
client/src/
├── pages/
│   ├── home.tsx          # Homepage with URL input and recent analyses
│   └── analysis.tsx      # Analysis results page with charts
├── components/
│   ├── reply-card.tsx    # Individual reply with scores
│   ├── category-pie-chart.tsx  # Category distribution
│   └── score-radar.tsx   # Radar chart for average scores
└── App.tsx               # Routes and providers

server/
├── routes.ts      # API endpoints
├── storage.ts     # Database operations
├── scraper.ts     # Post and feed scraping with Puppeteer
├── analyzer.ts    # AI analysis with OpenAI
└── db.ts          # Database connection

shared/
└── schema.ts      # Drizzle schema for postAnalyses, replyAnalyses, analyzeSessions
```

## API Endpoints

- `GET /api/analyses` - List all analyses
- `POST /api/analyses` - Create new analysis (body: `{ postUrl: string }`)
- `GET /api/analyses/:id` - Get analysis with all reply data
- `GET /api/analyses/:id/export` - Export analysis as CSV
- `DELETE /api/analyses/:id` - Delete an analysis
- `GET /api/overall-stats` - Get aggregated stats across all completed analyses
- `GET /api/sessions` - List all analyze sessions
- `GET /api/sessions/active` - Get the currently active session
- `GET /api/sessions/:id` - Get a specific session
- `POST /api/sessions/start` - Start a new 30-minute analyze session
- `POST /api/sessions/:id/stop` - Stop an active session

## Automated Analyze Sessions

The app supports automated 30-minute sessions that fetch and analyze new posts every 5 minutes:
- Start a session from the home page
- Fetches up to 3 new posts every 5 minutes (6 rounds total)
- Aggregates statistics across all analyzed posts
- Live countdown timer and progress stats
- Can be stopped manually at any time

## Important Notes

### Real Scraping with Puppeteer
The app uses Puppeteer (headless Chrome) to visit Moltbook post URLs and extract real content. When you submit a Moltbook post URL, the scraper:
1. Opens the page in headless Chrome
2. Waits for content to load
3. Extracts the post title, content, and replies
4. AI analyzes each reply on 5 dimensions

Note: Some posts may have few or no replies. Try posts from the main feed (https://www.moltbook.com/m) that show reply counts.

### Running the App
```bash
npm run dev
```

### Database
Uses PostgreSQL with Drizzle ORM. Push schema changes with:
```bash
npm run db:push
```
