# 🌍 Wanderlust

A server‑side rendered Node.js application inspired by Airbnb, enabling users to list, browse, and manage properties—complete with interactive Mapbox maps and an OpenAI Agents–powered chat bot for hands‑free CRUD operations.

---

## 🔥 Features

- **User Authentication**  
  Sign up, log in, log out (Passport.js + MongoDB sessions).

- **Listings CRUD**  
  Create, read, update, and delete property listings.

- **Interactive Maps**  
  Each listing displays its location via Mapbox (see `map.js`).

- **Conversational Chat Bot**  
  A multi‑agent system (built with `@openai/agents`) that lets you log in/out or manage listings simply by talking—no clicks required (see `chatAgents.mjs`).

- **Server‑Side Rendering**  
  Clean EJS templates styled in the `views/` folder.

---

## 🚀 Live Demo

> [🔗 View the live demo here](<LIVE_DEMO_URL>)

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** ≥ 20.18.1  
- **npm**  
- **MongoDB** (Atlas or local)  
- **Mapbox** API token  
- **OpenAI** API key  
- _(Optional)_ Cloudinary account for image uploads  

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/<your‑username>/wanderlust.git
cd wanderlust

# 2. Install dependencies
npm install
