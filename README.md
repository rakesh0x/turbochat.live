# 🤖 Supercharged AI Chatbot Platform

A production-ready, self-hosted AI chatbot platform. Scrape websites, train on your data, and embed a floating chat widget on any site. Works with local AI (**Ollama**) or cloud AI (**OpenAI**).

## 🚀 One-Minute Setup (Docker)

The fastest way to get started is using Docker Compose:

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/yourusername/chatbot-ai.git
    cd chatbot-ai
    ```
2.  **Configure Environment**:
    ```bash
    cp .env.example .env
    # Edit .env and add your PINECONE_API_KEY
    ```
3.  **Launch**:
    ```bash
    docker-compose up --build
    ```
    - Dashboard: `http://localhost:3000`
    - API: `http://localhost:8000`

---

## 🏗️ Technical Architecture

- **Frontend**: Next.js 14 (Dashboard + Widget Script Creator)
- **Backend**: FastAPI (Async processing + Scraper + AI Orchestrator)
- **Database**: SQLite (Persistent metadata and chat history)
- **Vector DB**: Pinecone (Serverless)
- **AI Models**: 
    - **Ollama**: Default local model (phi3)
    - **OpenAI**: Optional GPT-4o integration

---

## 🎨 Embedding the Widget on Your Site

Once your chatbot is trained, simply add this snippet to your HTML:

```html
<script src="http://your-domain.com/widget.js"></script>
<script>
  window.addEventListener('load', function() {
    ChatbotWidget.init({
      chatbotId: "YOUR_CHATBOT_ID",
      apiUrl: "http://your-domain.com/api"
    });
  });
</script>
```

---

## 🛠️ Manual Development Setup

### Backend
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 server.py
```

### Frontend
```bash
cd chatinterface
npm install
npm run dev
```

---

## 📂 Project Structure

```text
├── chatinterface/       # Next.js Frontend
│   ├── app/             # Application UI & API Proxy
│   ├── public/          # widget.js (Embeddable script)
│   └── Dockerfile       # Frontend Docker image
├── scraper/             # Web crawling logic
├── server.py            # Main FastAPI server
├── database.py          # SQLite database schema
├── docker-compose.yml   # Full stack orchestration
└── README.md            # You are here!
```

---

## 🤝 Contributing

This project is built for the community. Feel free to open issues or submit PRs!

## 📄 License

MIT
