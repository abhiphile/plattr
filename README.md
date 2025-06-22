# Plattr
Everything on one platter – orders, deals & growth

A unified, AI-powered assistant that empowers merchants to manage all their aggregator platforms (Swiggy, Zomato, Magicpin, ONDC, and more) from a single conversational interface. The Merchant Assistant automates operational tasks, provides proactive alerts, and surfaces actionable insights—helping merchants save time, reduce errors, and maximize revenue.

---

## 🚀 Objective

**Merchant Assistant** solves the chaos of multi-platform management for merchants by:
- Providing a single conversational interface (WhatsApp, Claude, or Web Bot) for all merchant operations.
- Securely logging into partner portals and executing merchant commands (change offers, opt in/out of promotions, run campaigns, update timings, etc.).
- Using agentic AI to autonomously complete complex, multi-step tasks and proactively alert merchants about anomalies, opportunities, and trends.

---

## 🛠️ Features

- **Conversational Interface:** Interact via WhatsApp, Claude, or Web Bot.
- **Unified Platform Management:** Update offers, timings, and campaigns across Swiggy, Zomato, Magicpin, ONDC, and more.
- **Secure Portal Integration:** Securely log in and perform actions on partner portals.
- **Agentic AI:** 
  - Autonomously completes multi-step tasks (e.g., "Run a weekend discount similar to my last Diwali promo").
  - Proactively alerts merchants about anomalies (deductions, rating drops), seasonal opportunities, and competitor trends.
- **Proactive Monitoring:** Detects and notifies about operational issues before they impact revenue.

---

## 📦 Project Structure

```
/server
  ├── index.ts         # Server entry point
  ├── routes.ts        # API and bot routes
  ├── db.ts            # Database connection
  ├── seed.ts          # Seed data for development
  ├── storage.ts       # Storage and session management
  ├── vite.ts          # Vite server config
  └── services/        # Integrations and business logic

/client
  ├── index.html
  ├── assets/          # Static assets
  └── src/             # Frontend source code
```

---

## ⚙️ Tech Stack

### Frontend
- **React 18** (TypeScript)
- **Vite** (build tool)
- **Shadcn/ui** (Radix UI primitives)
- **Tailwind CSS** (custom merchant-themed variables)
- **TanStack Query** (server state management)
- **Wouter** (routing)
- **Chart.js** (analytics visualization)

### Backend
- **Node.js** (TypeScript)
- **Express.js** (REST API)
- **PostgreSQL** (Neon Database, serverless)
- **Drizzle ORM** (type-safe DB operations)
- **OpenAI GPT-4o** (AI assistant)
- **Connect-pg-simple** (session storage)

---

## 🗄️ Database Schema

- **Merchants:** Profile, contact, store timings, delivery settings
- **Platforms:** Connections, credentials, sync status
- **Offers:** Promotions, discount types, scheduling

---

## 🧠 AI Assistant

- Context-aware chat for offers, promotions, settings, and analytics
- OpenAI GPT-4o integration
- Conversation history and context persistence
- Action suggestions and workflow automation

---

## 📊 Analytics & Reporting

- Revenue, order tracking, and growth metrics
- Chart visualizations and platform comparisons
- PDF report generation
- Real-time data refresh

---

## 🚦 Alerting & Monitoring

- Real-time alert monitor (deductions, rating drops, anomalies)
- Notification system (email, Telegram)
- Emergency controls (shutdown, pause orders, holiday mode)
- Mobile-optimized dashboard

---

## 🤖 Browser Automation Setup

Some platform actions (such as logging into Swiggy, Zomato, or Magicpin portals) are performed using a Python-based browser automation agent.

### 1. Install Python Dependencies

Ensure you have Python 3 and pip installed. Then run:

```sh
pip3 install -r requirements.txt
```

### 2. Environment Variables

The `.env` file should include your OpenAI API key and database URL, which are used by both the Node.js and Python services.

### 3. Running Browser Automation

The browser automation agent is invoked automatically by the backend when required.  
You can also run it manually for testing:

```sh
python3 scripts/browser_agent.py '{"task": "login", "platform": "swiggy"}'
```

### 4. Automated Setup

You can use the provided setup script to automate the above steps:

```sh
bash setup-browser-automation.sh
```

This will:
- Install Python and Node.js dependencies
- Create a `.env` file if it doesn't exist
- Remind you to update your API keys and database URL

---

**Browser automation endpoints:**
- `POST /api/platforms/connect` (with browser automation)
- `POST /api/platforms/action` (with browser automation)
- `POST /api/browser/execute` (direct browser tasks)
- `GET /api/tasks/:taskId` (check task status)

---

## 🏁 Setup Instructions

### Prerequisites

- Node.js (v18+)
- npm (v9+)
- PostgreSQL database (Neon or local)
- [Optional] OpenAI API key for AI features

### 1. Clone the Repository

```sh
git clone https://github.com/your-org/plattr.git
cd plattr
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and set the following variables:

```env
DATABASE_URL=your_postgres_connection_string
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret
PORT=8080
```

### 4. Database Setup

Run migrations and seed data:

```sh
npm run db:push
npm run db:seed
```

### 5. Start the Development Servers

#### Backend

```sh
npm run dev:server
```

#### Frontend

```sh
npm run dev:client
```

The app will be available at [http://localhost:8080](http://localhost:8080).

---

## 🚀 Running in Production

1. Build the client and server:

    ```sh
    npm run build
    ```

2. Start the production server:

    ```sh
    npm start
    ```

---

## 🐳 Running with Docker

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB of available RAM

### Quick Start with Docker

1. **Clone the Repository**

    ```sh
    git clone https://github.com/your-org/plattr.git
    cd plattr
    ```

2. **Set Environment Variables**

    Create a `.env` file in the root directory:

    ```env
    DATABASE_URL=your_postgres_connection_string
    OPENAI_API_KEY=your_openai_api_key
    SESSION_SECRET=your_session_secret
    PORT=8080
    ```

3. **Run with Docker Compose**

    **Production Mode:**
    ```sh
    # Build and start the application
    docker-compose up -d

    # View logs
    docker-compose logs -f app

    # Stop the application
    docker-compose down
    ```

    **Development Mode (with hot reloading):**
    ```sh
    # Build and start with hot reloading
    docker-compose -f docker-compose.dev.yml up -d

    # View logs
    docker-compose -f docker-compose.dev.yml logs -f app

    # Stop the application
    docker-compose -f docker-compose.dev.yml down
    ```

4. **Database Setup**

    Run migrations after the container is up:

    ```sh
    # For production
    docker-compose exec app npm run db:push

    # For development
    docker-compose -f docker-compose.dev.yml exec app npm run db:push
    ```

### Manual Docker Build

**Build the Image:**
```sh
# Production build
docker build -t plattr:latest .

# Development build
docker build -t plattr:dev --target base .
```

**Run the Container:**
```sh
# Production
docker run -d \
  --name plattr \
  -p 8080:8080 \
  -e DATABASE_URL="your_database_url" \
  -e OPENAI_API_KEY="your_openai_key" \
  -e SESSION_SECRET="your_session_secret" \
  plattr:latest

# Development with volume mounting
docker run -d \
  --name plattr-dev \
  -p 8080:8080 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e DATABASE_URL="your_database_url" \
  -e OPENAI_API_KEY="your_openai_key" \
  -e SESSION_SECRET="your_session_secret" \
  plattr:dev
```

### Docker Features

- **Multi-stage builds** for optimized production images
- **Browser automation support** with Chromium and Python
- **Security best practices** (non-root user, minimal attack surface)
- **Health checks** for monitoring
- **Development and production** configurations

### Troubleshooting Docker

**Common Issues:**

1. **Port Already in Use**
   ```sh
   # Check what's using port 8080
   lsof -i :8080
   
   # Use a different port
   docker run -p 3000:8080 plattr:latest
   ```

2. **Database Connection Issues**
   ```sh
   # Check database connectivity
   docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"
   ```

3. **Browser Automation Fails**
   ```sh
   # Check Chromium installation
   docker-compose exec app which chromium-browser
   
   # Check Python dependencies
   docker-compose exec app pip3 list
   ```

**View Logs:**
```sh
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# Access container shell
docker-compose exec app sh
```

For detailed Docker documentation, see [DOCKER.md](DOCKER.md).

---

## 👥 Contributors

- [Akshat](https://github.com/akkigupta97)
- [Abinash](https://github.com/abinashsena)

---

## 📝 Maintenance Guidelines

- **Security:** Never store or log merchant credentials in plaintext. Use environment variables and secure vaults for secrets.
- **Dependencies:** Keep all dependencies up to date. Run `npm audit` regularly.
- **Testing:** All new features must include tests. Use integration tests for platform actions.
- **Documentation:** Update this README and inline code comments with every major change.
- **Monitoring:** Set up error and performance monitoring for both server and client.

---

## 🤝 Contribution Guidelines

We welcome contributions! To contribute:

1. **Fork the repository** and create your branch from `main`.
2. **Describe your changes** clearly in your pull request.
3. **Write tests** for new features or bug fixes.
4. **Adhere to the code style** and linting rules.
5. **Sign the CLA** if prompted.

**Areas to contribute:**
- New platform integrations (e.g., ONDC, new aggregators)
- UI/UX improvements for the conversational interface
- Agentic AI workflows and prompt engineering
- Proactive alerting and anomaly detection modules
- Documentation and developer experience

---

## 🧭 Roadmap

- [X] WhatsApp and Web Bot conversational interface
- [X] Secure login and action execution for Swiggy, Zomato, Magicpin
- [X] Agentic AI for multi-step task automation
- [X] Proactive anomaly and opportunity alerts
- [X] Insights dashboard for merchants

---

## 📄 License

[MIT License](LICENSE)

---

## 📬 Contact

For questions, suggestions, or support, open an issue or contact [Abinash](mailto:abinashsena@gmail.com) or [Akshat](mailto:akshat28101997@gmail.com).

---

*Empowering merchants to focus on growth, not grunt work!*
