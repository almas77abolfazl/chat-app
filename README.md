# ChatApp

An open-source, real-time messaging application inspired by Telegram, built with NestJS 11 and Angular 22.

---

## Screenshots

| Desktop Chat View | Wallpaper & Blur Settings |
| :---: | :---: |
| ![Desktop Chat View](docs/screenshots/02-main-chat.png) | ![Wallpaper Settings](docs/screenshots/03-wallpaper-panel.png) |

| Mobile Responsive View (PWA) | OTP Phone Login |
| :---: | :---: |
| ![Mobile View](docs/screenshots/04-mobile-view.png) | ![Login Screen](docs/screenshots/01-login.png) |

---

## Tech Stack

### Backend
- **Framework**: NestJS 11 (TypeScript) with modular architecture
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Communication**: WebSockets powered by Socket.io
- **Security & Auth**: JWT (Access Token + Refresh Token) and rate-limiting with Throttle Guard
- **AI Agent**: Agentic module compatible with OpenAI-compatible APIs and Google Gemini (tool-calling for summarization, task extraction, smart replies)
- **Testing**: Jest (unit tests) + Supertest (E2E)

### Frontend
- **Framework**: Angular 22.2 (Standalone Components, Signals & Reactive Architecture)
- **UI & Styling**: Angular Material + FontAwesome + SCSS (CSS custom properties design tokens)
- **Virtual Scrolling**: CDK Virtual Scroll Viewport for rendering large chat histories without frame drops
- **Internationalization (i18n)**: English (LTR), Persian (RTL), Arabic (RTL)
- **Testing**: Playwright E2E Testing

---

## Features

### Messaging & Chat
- **Real-Time Messaging**: Instant message delivery with Socket.io and status tracking (sent, delivered, read)
- **Rich Media**: Support for text, images, videos, voice messages, files, and stickers
- **Message Deletion**: Delete for everyone or delete only for yourself
- **Clipboard Paste**: Paste images directly with `Ctrl+V` or right-click context menu into the chat input
- **Inline Editing**: Edit sent messages inline with an `(edited)` tag
- **Reactions**: Add and toggle emoji reactions on messages
- **Link Previews**: Automatic metadata extraction (title, description, image) for links

### Chat Management & Organization
- **Chat Folders & Tabs**: Categorization for Personal, Groups, Channels, and Bots
- **Saved Messages**: Private cloud storage for personal notes and forwarded messages
- **Channels & Groups**: Create groups/channels with admin roles and customizable member permissions
- **In-Chat Search**: Real-time text search inside chat history with match highlighting and counter navigation

### Profile, Privacy & Contacts
- **Phone Number Login**: International phone number authentication with 6-digit OTP verification
- **Phone Number Privacy**: Unknown senders only reveal their phone number if they saved you as a contact
- **Unknown Sender Banner**: Sticky action bar with Add to Contacts, Block, and Dismiss options
- **Custom Contact Aliases**: Save custom first and last names for contacts
- **Avatar Management**: Upload, square crop (500x500), delete, and instant real-time avatar sync across clients

### Customization & Interface
- **SVG Wallpaper Patterns**: Telegram-inspired vector patterns (Doodle, Stars, Hexagon, Cyber Grid) in subtle pastel tones
- **Live Background Controls**: Interactive sliders for Blur (0–20px) and Dimming/brightness (0–80%)
- **Custom Wallpaper Upload**: Upload custom images as chat background
- **Floating Date Separator**: Glassmorphism pill with blur backdrop indicating message dates
- **Responsive Layout**: Optimized for desktop browsers, tablets, and mobile screens (PWA)

---

## Getting Started

### 1. Run with Docker Compose (Recommended)

```bash
# Copy environment variables
cp chat-app-back/.env.example chat-app-back/.env

# Start full stack (MongoDB + API + Web)
docker compose up -d --build
```

- Web App: `http://localhost`
- Backend API: `http://localhost:3000/v1`
- MongoDB: `localhost:27017`

### 2. Manual Development Setup

**Backend (`chat-app-back`)**:
```bash
cd chat-app-back
npm install
npm run start:dev   # Runs on http://localhost:3000 (prefix: v1)
```

**Frontend (`chat-app-front`)**:
```bash
cd chat-app-front
npm install
npm start           # Runs on http://localhost:5500
```

---

## Tests & Code Quality

```bash
# Backend unit tests (Jest)
cd chat-app-back && npm test

# Backend code formatting & linting
cd chat-app-back && npm run lint

# Frontend production build
cd chat-app-front && npm run build
```

---

## License

This project is open-source and available under the [MIT License](LICENSE).
