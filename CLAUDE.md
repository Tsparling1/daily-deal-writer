# Daily Deal Writer — CLAUDE.md

## Auto-approved operations
The following are pre-approved for this project:
- git (all standard operations: add, commit, push, pull, status, log, diff)
- node / npm (install, start, run scripts)
- File read/write operations in this project directory

## Project overview
Single-page web app for TMS Solutions Group that uses the Anthropic Claude API to generate
social media marketing posts (Facebook/Instagram, Google Business, SMS) from a deal description.

## Stack
- Backend: Node.js + Express (server.js)
- Frontend: Single HTML file (index.html) — no frameworks
- AI: Anthropic Claude API via @anthropic-ai/sdk with streaming (SSE)
- Deploy target: Render

## Environment
- ANTHROPIC_API_KEY — required, set in .env locally or in Render dashboard
- PORT — optional, defaults to 3000

## Running locally
```bash
npm install
cp .env.example .env   # then add your API key
npm start
```
