# Email Verification Module (MERN)

> **Made by Ansh**

A full-stack email verification module built with the MERN stack. It validates email addresses through syntax checking, common typo detection, DNS MX record lookup, and SMTP mailbox verification.

---

## Features

### Backend (Node.js / Express)
- **Syntax Validation** — RFC-compliant regex checks
- **Typo Detection** — Catches common domain typos (e.g., `gmail.co` → `gmail.com`)
- **DNS MX Lookup** — Resolves mail exchange records for the domain
- **SMTP Verification** — Connects to the mail server and checks mailbox existence via `RCPT TO`
- **Structured JSON Response** — Returns detailed result with status codes, MX records, and timing

### Frontend (React / Tailwind CSS)
- **Clean, modern UI** with dark theme and glassmorphism
- **Email input** with real-time verification
- **Loading states** with spinner animation
- **"Did you mean?"** clickable typo suggestions
- **Toast notifications** for success, error, and warning feedback
- **Collapsible JSON response** viewer with syntax highlighting
- **Fully responsive** design

### Unit Tests (Jest)
- **28 comprehensive test cases** covering:
  - Syntax validation (valid/invalid formats)
  - Typo detection (common domain misspellings)
  - SMTP error codes (550, 450, timeouts)
  - Edge cases (empty, null, undefined, very long emails, multiple @)

---

## Project Structure

```
├── server/                    # Backend
│   ├── package.json
│   ├── server.js              # Express entry point
│   ├── src/
│   │   ├── verifyEmail.js     # Core verification logic
│   │   └── typoMap.js         # Domain typo mappings
│   └── __tests__/
│       └── verifyEmail.test.js  # 28 Jest test cases
│
├── client/                    # Frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       └── components/
│           ├── EmailVerifier.jsx
│           └── Toast.jsx
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Install Frontend Dependencies
```bash
cd client
npm install
```

### 3. Run the Backend
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

### 4. Run the Frontend
```bash
cd client
npm run dev
# App opens on http://localhost:3000
```

### 5. Run Unit Tests
```bash
cd server
npm test
```

---

## API Endpoint

### `POST /api/verify`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "email": "user@example.com",
  "result": "valid",
  "resultcode": 1,
  "subresult": "mailbox_exists",
  "domain": "example.com",
  "mxRecords": ["mx1.example.com"],
  "executiontime": 1.23,
  "error": null,
  "timestamp": "2026-03-24T11:00:00.000Z"
}
```

**Result Codes:**
| Code | Result   | Description |
|------|----------|-------------|
| 1    | valid    | Email address is verified |
| 3    | unknown  | Could not determine validity |
| 6    | invalid  | Email is definitely invalid |

---

## Author

**Ansh** — MERN Stack Email Verification Module
