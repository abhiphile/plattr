The problem Plattr solves

Merchants today have to navigate across platforms like Swiggy, Zomato, Magicpin, and ONDC which leads to operational overload. Managing each one separately means constant logins, repeated updates, and missed opportunities — whether it's forgetting to run a promo or reacting too late to a rating drop.

Our web portal fixes this by becoming the one-stop assistant every merchant needs:

One place for everything: See orders, views, offers, and alerts across all platforms in a single dashboard.

We use Sarvam’s speech-to-text, merchants can speak in their native language to get things done.

Smart automation: With OpenAI’s LVMs, browser workflows like updating offers or running campaigns are handled automatically

Real-time alerts & insights: Get notified about issues or opportunities before they impact revenue.

And it's built to scale — lightweight, deployable via Kubernetes, and ready for thousands of merchants.
Challenges we ran into

Building this in a tight 24-hour window came with its fair share of hurdles:

Agentic workflows were tricky: Setting up LVMs (like OpenAI’s browser agents) to reliably navigate dynamic, login-protected portals like MagicPin wasn’t straightforward. Handling session management, unpredictable DOM changes, and ensuring consistent results took multiple retries.

UI under pressure: Designing a clean, responsive UI that could display dynamic analytics, real-time alerts, and control workflows — all while keeping it simple for merchants — was a challenge. Balancing functionality with speed in limited time meant prioritizing what really mattered.

Speech-to-text integration: Plugging in Sarvam’s speech model to accept voice input in multiple languages required handling edge cases like background noise, mixed-language inputs, and making sure the UI responded instantly after transcription.

Security & session handling: Logging into third-party portals on behalf of merchants introduced concerns around token storage, credential safety, and session expiry — solving this securely within a hackathon window took creative shortcuts.

Debugging under load: With multiple async components — speech, vision models, browser agents — debugging workflows in real-time across different machines and browsers became a race against the clock.
Progress made before hackathon
