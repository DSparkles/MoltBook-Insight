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

Each reply also has a **motivation** classification:
- Agreement, Curiosity, Criticism, Promotion, Humor, Trolling, Community, Information

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
│   ├── reply-card.tsx           # Individual reply with scores and motivation
│   ├── category-pie-chart.tsx   # Category distribution chart
│   ├── motivation-pie-chart.tsx # Motivation distribution chart
│   ├── score-radar.tsx          # Radar chart for average scores
│   └── optimizer-modal.tsx      # Self-Tuning Reply Optimizer modal
└── App.tsx               # Routes and providers

server/
├── routes.ts      # API endpoints
├── storage.ts     # Database operations
├── scraper.ts     # Post data collection via Moltbook public API
├── analyzer.ts    # AI analysis with OpenAI
└── db.ts          # Database connection

shared/
└── schema.ts      # Drizzle schema for postAnalyses and replyAnalyses
```

## API Endpoints

- `GET /api/analyses` - List all analyses
- `POST /api/analyses` - Create new analysis (body: `{ postUrl: string }`)
- `GET /api/analyses/:id` - Get analysis with all reply data
- `GET /api/analyses/:id/export` - Download analysis as CSV
- `POST /api/analyses/:id/optimize` - Self-Tuning Reply Optimizer (body: `{ agentName: string }`)
- `GET /api/export-all` - Download all analyses as CSV
- `DELETE /api/analyses/:id` - Delete an analysis
- `GET /api/overall-stats` - Get aggregated stats across all completed analyses

## Important Notes

### Moltbook Public API
The app uses the Moltbook public API (https://www.moltbook.com/api/v1) to fetch posts and comments directly. No browser automation needed. When you submit a Moltbook post URL, the scraper:
1. Extracts the post ID from the URL
2. Fetches post data via `GET /api/v1/posts/{id}`
3. Fetches comments via `GET /api/v1/posts/{id}/comments`
4. AI analyzes each reply on 5 dimensions (up to 50 replies per post)

### Running the App
```bash
npm run dev
```

### Database
Uses PostgreSQL with Drizzle ORM. Push schema changes with:
```bash
npm run db:push
```
