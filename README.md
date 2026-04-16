# Turbochat AI

**Turbochat AI** is a production-ready, full-stack AI chatbot platform. It allows businesses and developers to scrape websites, train on custom documentation, and deploy a source-grounded, premium AI assistant in minutes.

## Demo Video

<video src="chatinterface/public/turbochatdemo.mp4" controls muted playsinline width="100%"></video>

If the embedded player does not render in your viewer, open the demo directly:
[Watch demo](chatinterface/public/turbochatdemo.mp4)

## Key Features

- **Instant Web Crawling**: Paste a URL and Turbochat learns your entire site, product documentation, and FAQs.
- **Source-Grounded Answers**: Responses are generated using RAG (Retrieval-Augmented Generation) to ensure accuracy and reduce hallucinations.
- **Premium Dashboard**: A sleek, modern control center to manage your chatbot fleet, monitor system health, and track message volume.
- **Chat Playground**: Test your chatbot with real-time conversations before deploying.
- **Embeddable Widget**: A lightweight, floating chat widget that can be installed on any website stack with a single `<script>` tag.
- **Multi-Model Support**: Powered by OpenAI GPT-4 and Google Gemini for robust, high-quality responses.
- **Credits & Billing**: Built-in credit system for managing trial and pro tiers.

## Technical Architecture

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS, Radix UI.
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python), Async processing, Beautiful Soup for scraping.
- **Database**: SQLite (SQLAlchemy) for metadata, chat history, and user profiles.
- **Vector Search**: [Pinecone](https://www.pinecone.io/) for efficient semantic retrieval.
- **Auth**: [NextAuth.js](https://next-auth.js.org/) for secure Google OAuth integration.

##  Project Structure

```text
├── chatinterface/       # Next.js Frontend (Dashboard & Landing Page)
│   ├── app/             # Next.js App Router (Dashboard, Playground, Shared Clips)
│   ├── landing/         # Premium Landing Page & Components
│   ├── public/          # Static assets & widget.js shim
│   └── components/      # Shared UI library (shadcn/ui)
├── scraper/             # Specialized web crawling and processing logic
├── server.py            # Main FastAPI Backend & API Orchestrator
├── database.py          # SQLite schema and database access layer
├── database_init.py     # Database initialization script
├── webcrawl.py          # Standalone crawler utility
├── chatinterface/public/turbochatdemo.mp4  # Hero section demo video
└── docker-compose.yml   # Full-stack Docker orchestration
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI / Gemini API Keys
- Pinecone API Key

### 1. Manual Backend Setup
```bash
# Set up virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations/init (if applicable)
python3 database.py

# Start the server
python3 server.py
```
*API will be available at `http://localhost:8000`*

### 2. Manual Frontend Setup
```bash
cd chatinterface
npm install
npm run dev
```
*Dashboard will be available at `http://localhost:3000`*

### 3. Docker Deployment (Recommended)
```bash
cp .env.example .env
# Fill in your API keys
docker-compose up --build
```

## 🎨 Customizing the Branding
You can adjust the theme and branding by editing the `globals.css` and the theme configuration in `chatinterface/app/layout.tsx`. All components are built using Tailwind CSS for maximum flexibility.

---

## Contributing
Built with for teams that want better customer support. Feel free to open issues or submit PRs to help improve Turbochat.

## License
MIT
