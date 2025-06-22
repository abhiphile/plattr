# plattr
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
  - Autonomously completes multi-step tasks (e.g., “Run a weekend discount similar to my last Diwali promo”).
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
```

**How to use this README:**
- Replace `[Your Team/Collaborators Here]` and contact details as appropriate.
- Add or update the roadmap as features are built.
- Place this file at the root of your repository as `README.md`.

Let me know if you want a more detailed section for setup, API usage, or contribution examples!