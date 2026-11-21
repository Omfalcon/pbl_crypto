# Secure Communication Simulator (Alice ↔ Bob)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Cryptography](https://img.shields.io/badge/AES--256--GCM-AEAD%20Standard-06b6d4.svg)](https://cryptography.io)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

An interactive, educational cybersecurity web application demonstrating authentic, symmetric **AES-256-GCM** (Galois/Counter Mode) authenticated encryption between two entities: **Alice (Sender)** and **Bob (Receiver)**.

Designed as an academic Problem-Based Learning (PBL) project in **Cryptography and Network Security**, this simulator demonstrates the three fundamental pillars of modern communication security:

1. **Confidentiality:** Unauthorized observers cannot read the original message without the legitimate 256-bit symmetric key.
2. **Integrity:** Any bit or byte modification to the encrypted ciphertext, nonce, or payload in transit is mathematically detected.
3. **Authentication:** AES-256-GCM provides message integrity and authentication of the encrypted data using the shared secret key. It verifies that the payload has not been modified and that the party generating it possesses the correct key. It does not provide non-repudiation or independently establish the sender's identity (since both Alice and Bob share the symmetric key).

---

## Table of Contents

- [1. Technology Stack](#1-technology-stack)
- [2. System Architecture](#2-system-architecture)
- [3. Project Folder Structure](#3-project-folder-structure)
- [4. The 6 Core Modules](#4-the-6-core-modules)
  - [4.1 Overview Command Center](#41-overview-command-center)
  - [4.2 Module 1: Alice — Message Sender](#42-module-1-alice--message-sender)
  - [4.3 Module 2: Bob — Message Receiver](#43-module-2-bob--message-receiver)
  - [4.4 Module 3: Key Management](#44-module-3-key-management)
  - [4.5 Module 4: AES-256-GCM Cryptographic Engine](#45-module-4-aes-256-gcm-cryptographic-engine)
  - [4.6 Module 5: Attacker & Tampering Simulation Lab](#46-module-5-attacker--tampering-simulation-lab)
  - [4.7 Module 6: Communication History & Inspect Modal](#47-module-6-communication-history--inspect-modal)
- [5. Cryptographic Engine Deep-Dive](#5-cryptographic-engine-deep-dive)
- [6. Database Architecture & Zero Plaintext / Zero Secret-Key Persistence](#6-database-architecture--zero-plaintext--zero-secret-key-persistence)
- [7. Complete REST API Specification](#7-complete-rest-api-specification)
- [8. Installation & Local Startup Guide](#8-installation--local-startup-guide)
- [9. Academic Demonstration & Evaluation Walkthrough](#9-academic-demonstration--evaluation-walkthrough)
- [10. License](#10-license)

---

## 1. Technology Stack

### Frontend Layer
- **React 18:** Modern declarative component architecture with hooks.
- **Vite:** High-performance build tool with instant Hot Module Replacement (HMR).
- **Tailwind CSS:** Modern Cybersecurity Command Center styling (Charcoal/Navy, Cyan, Emerald, Amber, and Rose accents).
- **Lucide React:** High-contrast cybersecurity iconography.
- **Axios:** Asynchronous HTTP client configured for RESTful communication with the FastAPI backend.

### Backend Layer
- **Python 3 (3.10 - 3.13):** High-performance backend execution environment.
- **FastAPI:** Modern, asynchronous web framework with automated OpenAPI / Swagger documentation.
- **Uvicorn:** Lightning-fast ASGI server for local process handling.
- **Pydantic v2:** Strict request/response schema validation and data sanitization.

### Cryptography Layer
- **Python `cryptography` Library:** Industry-standard OpenSSL bindings (`cryptography.hazmat.primitives.ciphers.aead.AESGCM`).
- **AES-256-GCM:** Authenticated Encryption with Associated Data (AEAD).
- **`os.urandom(32)`:** Cryptographically secure pseudo-random number generator (CSPRNG) for 256-bit keys.
- **`os.urandom(12)`:** Fresh 96-bit cryptographically random nonce generated for every encryption operation, making accidental nonce reuse extremely unlikely.
- **128-bit GHASH Tag:** Galois field polynomial authentication MAC.

### Database Layer
- **SQLite 3:** Lightweight local relational database (`simulator.db`).
- **SQLAlchemy 2.0 ORM:** Object-Relational Mapping for schema definition, queries, and audit logging.
- *Strict Rule:* Never persists plaintext messages or secret keys.

---

## 2. System Architecture

The application strictly separates user interface concerns, network transport, cryptographic operations, and database persistence:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND PRESENTATION LAYER                           │
│  React 18 + Vite + Tailwind CSS (Cyber Command Center Interface)                │
│                                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐  │
│  │   Overview   │ │ Alice Sender │ │ Bob Receiver │ │     Key Management     │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────────────┘  │
│  ┌───────────────────────────────┐ ┌─────────────────────────────────────────┐  │
│  │   Attacker Simulation Lab     │ │ Communication History & Inspect Modal   │  │
│  └───────────────────────────────┘ └─────────────────────────────────────────┘  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ JSON via HTTP (Axios)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FASTAPI BACKEND LAYER                              │
│                                                                                 │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐  │
│  │    /api/keys/*        │ │     /api/encrypt      │ │     /api/decrypt      │  │
│  │  Generate & Validate  │ │  AES-256-GCM Encrypt  │ │  Tag-Verified Decrypt │  │
│  └───────────────────────┘ └───────────────────────┘ └───────────────────────┘  │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐  │
│  │   /api/messages/*     │ │   /api/tamper & verify│ │     /api/history/*    │  │
│  │  Transfer & Bob Inbox │ │ Real Byte-Flip Engine │ │ Metadata & Event Logs │  │
│  └───────────────────────┘ └───────────────────────┘ └───────────────────────┘  │
└───────────────────────┬─────────────────────────────────┬───────────────────────┘
                        │                                 │
                        ▼                                 ▼
┌────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│       CRYPTOGRAPHIC AEAD ENGINE        │ │            DATABASE LAYER            │
│  Python `cryptography` Library         │ │  SQLite + SQLAlchemy ORM             │
│  - 256-bit Key Validation (32 Bytes)   │ │  - `messages` table (encrypted payload & metadata)    │
│  - Fresh 96-bit Random Nonces (12 B)   │ │  - `activity_logs` table (audit)     │
│  - 128-bit GHASH Auth Tag (16 B)       │ │  * NO PLAINTEXT COLUMNS              │
│  - InvalidTag Authentication Gate      │ │  * NO SECRET KEY COLUMNS             │
└────────────────────────────────────────┘ └──────────────────────────────────────┘
```

---

## 3. Project Folder Structure

A clean, modular directory structure keeping cryptographic utilities, database models, schemas, and UI components isolated:

```text
pbl_crypto/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py        # Router aggregations
│   │   │   ├── keys.py            # Key generation & validation endpoints
│   │   │   ├── encryption.py      # AES-GCM encryption endpoint
│   │   │   ├── decryption.py      # Authenticated decryption endpoint
│   │   │   ├── messages.py        # Message transfer & Bob inbox endpoints
│   │   │   ├── tampering.py       # Payload tampering & verification endpoints
│   │   │   └── history.py         # History listing & message details endpoints
│   │   ├── core/
│   │   │   ├── config.py          # Application settings & CORS configuration
│   │   │   └── security.py        # Base64 validation & 32-byte key checks
│   │   ├── crypto/
│   │   │   ├── key_manager.py     # 256-bit CSPRNG key generation
│   │   │   └── aes_gcm.py         # Core AES-256-GCM AEAD encryption/decryption
│   │   ├── models/
│   │   │   ├── message.py         # SQLAlchemy message metadata model
│   │   │   └── activity_log.py    # SQLAlchemy security audit log model
│   │   ├── schemas/
│   │   │   ├── key.py             # Pydantic key schemas
│   │   │   ├── encryption.py      # Pydantic encrypt/decrypt/tamper schemas
│   │   │   └── message.py         # Pydantic history & inbox schemas
│   │   ├── services/
│   │   │   ├── message_service.py # Message persistence & delivery logic
│   │   │   └── history_service.py # Audit logging & history query service
│   │   ├── database.py            # SQLite connection engine & sessionmaker
│   │   └── main.py                # FastAPI entry point
│   ├── requirements.txt           # Python backend dependencies
│   └── .env.example               # Environment variable templates
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── StatusBadge.jsx # Verified/Failed/Pending badge indicator
│   │   │   │   └── Toast.jsx       # Floating notifications
│   │   │   └── layout/
│   │   │       ├── Header.jsx      # Top header with health & reset buttons
│   │   │       └── Sidebar.jsx     # Persistent navigation sidebar
│   │   ├── pages/
│   │   │   ├── Overview.jsx        # System telemetry & module launcher
│   │   │   ├── Sender.jsx          # Module 1: Alice Sender interface
│   │   │   ├── Receiver.jsx        # Module 2: Bob Receiver inbox & decryption
│   │   │   ├── KeyManagement.jsx   # Module 3: Key generation & validation
│   │   │   ├── AttackerSimulation.jsx # Module 5: 5 attack scenarios lab
│   │   │   └── History.jsx         # Module 6: Communication history & inspector
│   │   ├── services/
│   │   │   └── api.js              # Centralized Axios API client
│   │   ├── App.jsx                 # Top-level state (tabs, ephemeral session key)
│   │   ├── index.css               # Cyber grid styling & scrollbars
│   │   └── main.jsx                # React root mount
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.js              # Vite server & port configuration
│   ├── tailwind.config.js          # Custom cybersecurity color palette
│   └── postcss.config.js           # PostCSS configuration
│
├── README.md                       # Comprehensive project documentation
├── LICENSE                         # MIT License
├── run_backend.bat                 # 1-click launcher for FastAPI backend
└── run_frontend.bat                # 1-click launcher for React frontend
```

---

## 4. The 6 Core Modules

### 4.1 Overview Command Center
* **Operational Metrics:** Real-time counters showing total messages recorded, Bob's pending inbox count, verified decryptions, and blocked attacks.
* **Security Principles Breakdown:** Explains Confidentiality (CTR keystream), Integrity (GHASH evaluation), and Authenticity (symmetric key proof).
* **Module Quick Launchers:** Interactive cards providing 1-click navigation into any of the operational modules.

### 4.2 Module 1: Alice — Message Sender
* **Message Composition:** Text area accommodating multiline messages up to 10,000 characters with a live character counter and clear button. Prevents empty message encryption.
* **Sender Identity:** Clearly designates Alice as the Sender transmitting to Bob as the intended receiver.
* **Key Selection Options:**
  * **Option A (Generate Key):** Calls CSPRNG to produce a fresh 256-bit AES key displayed in Base64 with a copy control.
  * **Option B (Paste Key):** Allows Alice to paste an existing Base64 key, validating that it decodes to exactly 32 bytes before allowing encryption.
* **Encryption Operation:** Converts plaintext to UTF-8 bytes, creates a 12-byte random nonce, initializes AES-256-GCM, produces ciphertext and a 16-byte authentication tag, and persists non-sensitive metadata in SQLite.
* **Payload Display & Actions:** Shows Base64 Ciphertext, Nonce, and Auth Tag. Provides **"Send to Bob"** (transfers the encrypted payload without plaintext), **"Download JSON"**, and **"Copy Payload"**.

### 4.3 Module 2: Bob — Message Receiver
* **Incoming Inbox:** Displays transmissions received from Alice with message IDs, timestamps, algorithm, and pending/verified statuses.
* **Payload Inspection:** Bob inspects the encrypted payload (Ciphertext, Nonce, Tag, Sender, Receiver). Plaintext remains completely locked and hidden.
* **Decryption Key Input:**
  * **Option A (Paste Key):** Allows Bob to paste the shared key.
  * **Option B (Use Session Key):** Automatically utilizes the in-memory shared key without reading from disk.
* **Authenticated Decryption:** Evaluates the 128-bit authentication tag before releasing any plaintext.
  * **Success:** Displays a vibrant green banner: `MESSAGE SUCCESSFULLY DECRYPTED — AUTHENTICATION VERIFIED`, unmasking the original plaintext.
  * **Failure:** Displays a red banner: `DECRYPTION FAILED — AUTHENTICATION VERIFICATION FAILED` with a safe error message, preventing any partial or corrupt plaintext from leaking.

### 4.4 Module 3: Key Management
* **Cryptographic 256-bit Key Generator:** Generates compliant 32-byte symmetric keys with 1-click generation and copy controls.
* **Key Inspector & Masking:** Allows showing or hiding the key with a visibility toggle (`••••••••`).
* **Format Validator:** Performs strict validation verifying Base64 structure and exact 256-bit length (rejects 128-bit or 192-bit keys with clear diagnostics).
* **Zero-Persistence Rule:** Highlights why secret keys exist strictly in ephemeral application memory and are never saved to SQLite or localStorage.

### 4.5 Module 4: AES-256-GCM Cryptographic Engine
* Technical core of the project implemented in `backend/app/crypto/aes_gcm.py`.
* Uses standard OpenSSL-backed AEAD cipher.
* Strict nonce freshness: a fresh 96-bit cryptographically random nonce is generated for every encryption operation, making accidental nonce reuse extremely unlikely.
* Authenticates before decrypting: if the calculated GHASH tag differs from the supplied tag by even a single bit, decryption is aborted and `cryptography.exceptions.InvalidTag` is caught safely.

### 4.6 Module 5: Attacker & Tampering Simulation Lab
Simulates an active eavesdropper intercepting the encrypted payload in transit:
1. **Scenario 1 — Modify Nonce:** Corrupts the initial byte of the 96-bit nonce vector. Result: `AUTHENTICATION FAILED — PAYLOAD MODIFIED`.
2. **Scenario 2 — Modify Auth Tag:** Corrupts the trailing byte of the 128-bit authentication tag. Result: `AUTHENTICATION FAILED — INVALID AUTHENTICATION TAG`.
3. **Scenario 3 — Modify Ciphertext:** Flips bits in byte 0 of the ciphertext (bit-flip attack). Result: `AUTHENTICATION FAILED — CIPHERTEXT TAMPERING DETECTED`.
4. **Scenario 4 — Test Incorrect Key:** Generates an unauthorized random 256-bit key and attempts decryption. Result: `DECRYPTION FAILED — AUTHENTICATION VERIFICATION FAILED`.
5. **Scenario 5 — Restore Original:** Reverts to the untampered original payload and verifies that legitimate communication succeeds.
* **Side-by-Side Comparison:** Displays the untampered original payload next to the attacked payload version.
* **Real Verification:** Executes `/api/verify` with Python's actual AES-GCM engine; no mocked responses.

### 4.7 Module 6: Communication History & Inspect Modal
* **SQLite Persistence:** Displays all historical transmissions recorded in `simulator.db`.
* **Status Filtering:** Filter records by `All`, `Successfully Encrypted`, `Successfully Decrypted`, `Failed Decryption`, or `Tampered Attacks`.
* **Detailed Inspect Pop-up Modal:** Clicking **"Inspect"** opens an interactive pop-up modal showing:
  * Verification status banner (Verified / Failed / Pending).
  * Transmission route (`Alice ➔ Bob`) and algorithm (`AES-256-GCM`).
  * Creation and Decryption timestamps.
  * Complete cryptographic payload: Nonce, Authentication Tag, and Ciphertext (with 1-click copy buttons).
* **Security Guarantee:** Proves that SQLite stores encrypted payloads (ciphertext, nonce, auth tag) and communication metadata, but never plaintext messages or secret keys.

---

## 5. Cryptographic Engine Deep-Dive

### AES-GCM (Galois/Counter Mode) Mechanics

AES-GCM combines two distinct cryptographic mechanisms into an Authenticated Encryption with Associated Data (AEAD) scheme:

1. **Initialization Vector & Counter Initialization ($J_0$ vs. Keystream CTR):**
   - For a standard 96-bit (12-byte) nonce, NIST SP 800-38D specifies the pre-counter block $J_0$ by appending 31 zero bits and a single 1 bit:
     $$J_0 = \text{Nonce} \parallel 0^{31}1$$
   - $J_0$ is reserved exclusively to encrypt the authentication tag mask:
     $$\text{Tag Mask} = \text{AES}_K(J_0)$$
   - The first encryption counter block is obtained by incrementing $J_0$ modulo $2^{32}$ ($\text{inc}_{32}$), so its 32-bit counter suffix ends in **2**:
     $$\text{CTR}_1 = \text{inc}_{32}(J_0) = \text{Nonce} \parallel 0^{31}2$$
   - For each subsequent 128-bit plaintext block $i$, the counter is incremented ($\text{CTR}_i = \text{Nonce} \parallel \text{bin}_{32}(i + 1)$) and encrypted under AES-256 to generate the keystream:
     $$\text{Keystream Block}_i = \text{AES}_K(\text{CTR}_i)$$
     $$C_i = P_i \oplus \text{Keystream Block}_i$$

2. **Galois Field Polynomial Hash (GHASH) Authentication:**
   - A hash subkey $H = \text{AES}_K(0^{128})$ is derived by encrypting a 128-bit block of zeros.
   - In the general GCM specification, GHASH processes:
     1. Additional Authenticated Data (AAD, if supplied), zero-padded to a 128-bit boundary.
     2. Ciphertext blocks $C_1, C_2, \dots, C_m$, with the final block zero-padded to 128 bits.
     3. A final 128-bit block encoding their respective bit lengths: $[\text{len}_{64}(\text{AAD}) \parallel \text{len}_{64}(C)]$.
   - **Application Note on Associated Data:** In this implementation, message encryption does not supply associated authenticated data ($\text{AAD} = \emptyset$, $\text{len}(\text{AAD}) = 0$). Therefore, the GHASH polynomial evaluates directly over the ciphertext blocks followed by the length block $[0^{64} \parallel \text{len}_{64}(C)]$ in $\text{GF}(2^{128})$:
     $$S = \text{GHASH}_H(C \parallel 0^{64} \parallel \text{len}_{64}(C))$$
   - The final 128-bit Authentication Tag is generated by XORing the GHASH authenticator $S$ with the pre-counter mask $\text{AES}_K(J_0)$:
     $$\text{Tag} = S \oplus \text{AES}_K(J_0)$$

3. **Decryption and Verification Rule:**
   - During decryption, the receiver recomputes the expected tag over the received ciphertext and nonce using the shared key.
   - The computed tag is compared with the received tag in constant time.
   - **Critical Security Invariant:** If the tags do not match identically, **zero plaintext is released**, and `cryptography.exceptions.InvalidTag` is raised.

---

## 6. Database Architecture & Zero Plaintext / Zero Secret-Key Persistence

The SQLite database maintains communication metadata and encrypted payload components, but **strictly enforces Zero Plaintext / Zero Secret-Key persistence**. Secret cryptographic keys exist solely in transient application memory and are never written to disk or logged. Plaintext is decrypted purely on-the-fly in volatile memory and is never committed to storage.

### Table 1: `messages`
Stores communication metadata and encrypted payload components.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal record index |
| `message_id` | VARCHAR(64) | UNIQUE, INDEXED, NOT NULL | Unique message identifier (e.g. `msg_...`) |
| `sender` | VARCHAR(50) | NOT NULL, DEFAULT 'Alice' | Sender entity identifier |
| `receiver` | VARCHAR(50) | NOT NULL, DEFAULT 'Bob' | Receiver entity identifier |
| `algorithm` | VARCHAR(50) | NOT NULL, DEFAULT 'AES-256-GCM' | Encryption algorithm used |
| `ciphertext` | TEXT | NOT NULL | Base64 encoded encrypted payload |
| `nonce` | VARCHAR(64) | NOT NULL | Base64 encoded 96-bit initialization vector |
| `auth_tag` | VARCHAR(64) | NOT NULL | Base64 encoded 128-bit authentication tag |
| `encryption_status`| VARCHAR(30) | NOT NULL, DEFAULT 'SUCCESS' | Initial encryption status |
| `decryption_status`| VARCHAR(30) | NOT NULL, DEFAULT 'PENDING' | Status: `PENDING`, `SUCCESS`, or `FAILED` |
| `authentication_status`| VARCHAR(30)| NOT NULL, DEFAULT 'PENDING'| Status: `PENDING`, `VERIFIED`, or `FAILED` |
| `created_at` | DATETIME | NOT NULL | Message creation timestamp (UTC) |
| `decrypted_at` | DATETIME | NULLABLE | Latest successful decryption timestamp (UTC) |

### Table 2: `activity_logs`
Chronological audit trail for security and operational events.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal log index |
| `message_id` | VARCHAR(64) | INDEXED, NOT NULL | Associated message identifier |
| `event_type` | VARCHAR(50) | NOT NULL | Event code (e.g. `MESSAGE_ENCRYPTED`, `TAMPER_NONCE`) |
| `event_status` | VARCHAR(30) | NOT NULL | Outcome: `SUCCESS`, `ALERT`, or `FAILURE` |
| `description` | TEXT | NOT NULL | Sanitized description of the activity |
| `created_at` | DATETIME | NOT NULL | Event timestamp (UTC) |

---

## 7. Complete REST API Specification

### 1. Key Management
* **`POST /api/keys/generate`**
  * *Response:* `{"key": "<Base64>", "algorithm": "AES-256-GCM", "key_size": 256, "encoding": "Base64", "status": "valid", "message": "..."}`
* **`POST /api/keys/validate`**
  * *Request:* `{"key": "<Base64 string>"}`
  * *Response:* `{"valid": true, "algorithm": "AES-256-GCM", "key_size": 256, "message": "..."}` *(Never echoes back secret keys)*

### 2. Encryption & Decryption
* **`POST /api/encrypt`**
  * *Request:* `{"plaintext": "Confidential message", "key": "<Base64 Key>", "sender": "Alice", "receiver": "Bob"}`
  * *Response:* `{"message_id": "msg_...", "ciphertext": "...", "nonce": "...", "auth_tag": "...", "algorithm": "AES-256-GCM", "encryption_timestamp": "...", "encryption_status": "SUCCESS"}`
* **`POST /api/decrypt`**
  * *Request:* `{"message_id": "msg_...", "ciphertext": "...", "nonce": "...", "auth_tag": "...", "key": "<Base64 Key>"}`
  * *Response (Success):* `{"success": true, "decrypted_plaintext": "...", "authentication_status": "VERIFIED", "decryption_timestamp": "...", "message": "MESSAGE SUCCESSFULLY DECRYPTED — AUTHENTICATION VERIFIED"}`
  * *Response (Failure):* `{"success": false, "decrypted_plaintext": null, "authentication_status": "FAILED", "message": "Decryption failed. The key may be incorrect or the encrypted message may have been modified."}`

### 3. Messaging & Inbox
* **`POST /api/messages/send`**
  * *Request:* `{"message_id": "msg_...", "ciphertext": "...", "nonce": "...", "auth_tag": "...", "sender": "Alice", "receiver": "Bob"}`
  * *Response:* `{"transfer_status": "SUCCESS", "message_id": "msg_...", "receiver": "Bob", "message": "..."}`
* **`GET /api/messages/inbox?receiver=Bob`**
  * *Response:* Array of pending and processed encrypted message items for Bob.

### 4. Attacker & Tampering Simulation
* **`POST /api/tamper`**
  * *Request:* `{"message_id": "msg_...", "ciphertext": "...", "nonce": "...", "auth_tag": "...", "attack_type": "nonce" | "tag" | "ciphertext"}`
  * *Response:* `{"attack_type": "...", "description": "...", "original_payload": {...}, "modified_payload": {...}}`
* **`POST /api/verify`**
  * *Request:* `{"message_id": "msg_...", "ciphertext": "...", "nonce": "...", "auth_tag": "...", "key": "<Base64 Key>"}`
  * *Response:* `{"verification_status": "VERIFIED" | "FAILED", "decryption_status": "SUCCESS" | "FAILED", "authenticated": bool, "reason": "..."}`

### 5. Communication History & Telemetry
* **`GET /api/history?filter=all&skip=0&limit=50`**
  * *Response:* Array of historical message metadata records (supports `all`, `encrypted`, `decrypted`, `failed_decryption`, `tampered`).
* **`GET /api/history/{message_id}`**
  * *Response:* Detailed metadata item and associated chronological activity events.
* **`GET /api/health`**
  * *Response:* `{"status": "online", "service": "...", "algorithm": "AES-256-GCM", "version": "1.0.0"}`

---

## 8. Installation & Local Startup Guide

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** & **npm**

---

### Step 1: Start the Backend (FastAPI)

1. Open your terminal in the project directory:
   ```powershell
   cd c:\Users\hp\PycharmProjects\pbl_crypto
   ```
2. (Optional) Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install backend dependencies:
   ```powershell
   pip install -r backend/requirements.txt
   ```
4. Launch the FastAPI server:
   ```powershell
   $env:PYTHONPATH="backend"; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The backend will be live at `http://127.0.0.1:8000` (Swagger interactive docs at `http://127.0.0.1:8000/docs`).*

---

### Step 2: Start the Frontend (React + Vite)

1. Open a second terminal window:
   ```powershell
   cd c:\Users\hp\PycharmProjects\pbl_crypto\frontend
   ```
2. Install frontend dependencies:
   ```powershell
   npm install
   ```
3. Launch the Vite development server:
   ```powershell
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://127.0.0.1:5173
   ```

---

### Convenient 1-Click Launchers (Windows)

Two batch files are included in the root folder for fast startup:
- **`run_backend.bat`**: Sets `PYTHONPATH=backend` and launches Uvicorn on port 8000.
- **`run_frontend.bat`**: Enters `frontend/` and starts the Vite development server on port 5173.

---

## 9. Academic Demonstration & Evaluation Walkthrough

Follow this 4-step sequence to demonstrate the three core cryptographic properties during a viva or project evaluation:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     STEP 1      │      │     STEP 2      │      │     STEP 3      │      │     STEP 4      │
│ Alice: Encrypt  │ ───► │ Bob: Authenticate│ ───► │ Attacker: Tamper│ ───► │ History: Inspect│
│ & Send Payload  │      │ & Recover Text  │      │ & Integrity Fail│      │ SQLite Audit    │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Step 1: Demonstrate Confidentiality (Alice)
1. Go to **Alice — Sender**.
2. Click **"Option A: Generate"** to produce a 256-bit AES key.
3. Enter a confidential message (e.g., `Classified Coordinates: 28.6139° N, 77.2090° E`).
4. Click **"Encrypt Message"**.
5. Observe the generated Base64 Ciphertext, 96-bit Nonce, and 128-bit Authentication Tag.
6. Click **"Send to Bob"** to transfer the encrypted payload into Bob's inbox.
   *Evaluation point:* Plaintext is not stored in SQLite and is not present in the transmitted payload.

### Step 2: Demonstrate Authenticated Decryption (Bob)
1. Navigate to **Bob — Receiver**.
2. Select the incoming transmission in Bob's inbox.
3. Click **"Option B: Use Session Key"** (or paste Alice's key).
4. Click **"Decrypt Message"**.
5. Notice the green success banner: `MESSAGE SUCCESSFULLY DECRYPTED — AUTHENTICATION VERIFIED`.
   *Evaluation point:* The original plaintext is recovered only after the 128-bit tag matches.

### Step 3: Demonstrate Integrity & Tampering Detection (Attacker)
1. Navigate to **Attacker Simulation**.
2. Select the message.
3. Click **"Scenario 1: Modify Nonce"** (or **"Scenario 2: Modify Auth Tag"** / **"Scenario 3: Modify Ciphertext"**).
4. Observe the side-by-side byte difference between the original and tampered payloads.
5. Click **"Run Cryptographic Verification"**.
6. Notice the red security banner: authentication verification fails, and **zero plaintext is leaked**.
7. Click **"Scenario 4: Test Incorrect Key"** to show that unauthorized keys are rejected.
8. Click **"Scenario 5: Restore Original"** and re-verify to prove that tampering on a copy left the original message decryptable.

### Step 4: Demonstrate Database Security & Inspection (History)
1. Navigate to **Communication History**.
2. Filter records by `All`, `Successfully Decrypted`, or `Tampered Attacks`.
3. Click the **"Inspect"** button on any record.
4. An interactive pop-up modal opens displaying the verification status, route, timestamps, and full cryptographic payload (Nonce, Tag, Ciphertext).
   *Evaluation point:* The SQLite schema stores encrypted payload components and metadata, but contains zero plaintext and zero secret key columns.

---

## 10. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.  
Developed as an academic PBL project for **Cryptography and Network Security**.
