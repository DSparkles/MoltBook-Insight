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
├── scraper.ts     # Post data collection (uses demo data)
├── analyzer.ts    # AI analysis with OpenAI
└── db.ts          # Database connection

shared/
└── schema.ts      # Drizzle schema for postAnalyses and replyAnalyses
```

## API Endpoints

- `GET /api/analyses` - List all analyses
- `POST /api/analyses` - Create new analysis (body: `{ postUrl: string }`)
- `GET /api/analyses/:id` - Get analysis with all reply data
- `DELETE /api/analyses/:id` - Delete an analysis

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
