# 🤖 GuíaOrbita (Naber Bot) — Stellar Testnet Chatbot Wallet Assistant

GuíaOrbita is an interactive, chatbot-style wallet assistant built on the Stellar Testnet. Instead of using a traditional, complex dashboard, GuíaOrbita turns blockchain operations into a conversational, human-centric interface. Users can connect their Freighter wallet, check balances, view transaction history, manage a personal contact list, and send XLM payments—all via a natural and engaging chatbot flow.

This project was built to complete the **Stellar Frontend Challenge**.

---

## 🌌 The Conversational Wallet Experience

Most Web3 interfaces are dry, complex dashboards filled with overwhelming numbers and forms. GuíaOrbita changes the paradigm by utilizing a conversational agent that guides users step-by-step:
- **Guided Onboarding**: The bot greets you, checks if you have the Freighter wallet extension installed, and guides you through the connection.
- **Contextual Actions**: The interface adapts to the conversation. Instead of displaying a static dashboard, the bot presents clear prompts and forms inside the action panel based on the current context (e.g., payment forms, transaction confirmations, address books).
- **Proactive Error Handling**: If something goes wrong, the bot explains what happened in plain language (e.g., Freighter timeout, wrong network configurations, or insufficient balances) rather than throwing cryptic blockchain tracebacks.

---

## 🛠️ Technical Stack

The application leverages a lightweight and modern tech stack designed for speed, security, and developer productivity.

| Technology | Purpose | Key Details / Role in Project |
| :--- | :--- | :--- |
| **React 19** | UI Library | Manages the application state, rendering, component lifecycle, and chat history updates. |
| **Vite** | Bundler & Dev Server | Provides instantaneous hot module reloading (HMR) and optimized build processes. |
| **Freighter API** | Secure Wallet Integration | Communicates with the browser wallet (`@stellar/freighter-api`) to handle connection requests and secure transaction signing. |
| **Stellar SDK** | Blockchain Operations | Interfaces with the Stellar network (`@stellar/stellar-sdk`). Prepares payments, creates new accounts, queries accounts, and submits transactions to the Horizon server. |
| **Horizon API** | Stellar Testnet API | Pulls account records, balance states, and transaction histories from the public test network endpoints. |
| **Vanilla CSS** | Styling System | Implements a sleek dark mode theme using custom CSS variables (tokens) for responsive layouts and animations. |

---

## 📂 Project Structure

Below is the directory tree of the project showing the separation of concerns between state management, React components, and Stellar SDK logic:

```text
naber-bot/
├── .cursor/                    # IDE editor configurations
├── .oxlintrc.json              # Oxlint linting configuration rules
├── index.html                  # Main HTML entrypoint template
├── package.json                # Project script commands and package dependencies
├── package-lock.json           # Exact versions lockfile for all packages
├── vite.config.js              # Vite configuration definitions
├── PROJECT_STATUS.md           # Log of project state, fixed bugs, and milestones
├── README.md                   # Project documentation (this file)
├── docs/                       # Project screenshots and documentation assets
│   ├── terminal-setup.png      # Development environment & server startup screenshot
│   ├── git-remote-setup.png    # Git repository origin configuration screenshot
│   └── git-push-result.png     # Git push operation outcome screenshot
├── public/                     # Static public assets directory
└── src/                        # Main React application source code
    ├── main.jsx                # React mount entrypoint
    ├── App.jsx                 # Central application shell, state machine & workflows
    ├── App.css                 # Layout layout styles, chat bubbles, forms, and keyframes
    ├── index.css               # Global typography, color variables, and basic reset styles
    ├── components/             # Reusable UI component modules
    │   ├── ActionPanel.jsx     # Dynamic user action area (buttons, payment form, contacts)
    │   ├── ChatBubble.jsx      # Conversational UI bubble (bot, user, or system info)
    │   ├── StatusBar.jsx       # Top navigation bar containing network status, balance, and settings
    │   └── TypingIndicator.jsx # Interactive bot typing feedback component
    └── lib/                    # Library extensions and core logic
        ├── stellar.js          # Encapsulated Freighter API & Horizon Stellar SDK helpers
        └── messages.js         # Unified conversation schemas & multilingual bot text templates
```

---

## ⚡ Core Features

### 🔌 1. Freighter Connection & Safe Guarding
- **Extension Discovery**: Auto-detects if Freighter is installed. Shows a customized message and a direct install link if missing.
- **Network Verification**: Checks if the user is connected to the **Stellar Testnet**. If the wallet is configured to Mainnet or another network, the bot refuses connection and explains how to change settings to protect the user.
- **Connection Timeout Handling**: To prevent the application from hanging when the Freighter extension fails to launch or is closed abruptly by the user, a **30-second timeout** is implemented via `Promise.race`. If Freighter does not respond in time, the connection flow resets and the bot prompts the user to check their browser extensions bar.

### 💰 2. Smart Balance Retrieval & Friendbot Funding
- **Horizon Account Query**: Fetches the native XLM balance using the Stellar SDK server queries.
- **Automatic Friendbot Activation**: If the public key is new (returns a `404 Not Found` error because it does not exist on the ledger yet), the application automatically makes a request to the **Stellar Friendbot API** to activate and fund the account with **10,000 Testnet XLM**. The bot informs the user of the progress and checks the balance again once complete.

### 💸 3. Seamless Transaction Workflows
- **Recipients Check**: When sending XLM, the SDK checks if the destination account already exists on the network.
- **Dynamic Operations**:
  - If the recipient exists, it executes an `Operation.payment` transaction.
  - If the recipient does not exist, it automatically switches to an `Operation.createAccount` operation to activate and fund the destination account in a single step.
- **Validation**: Enforces strict format validation for public keys (`^G[A-Z0-9]{55}$`) and amounts (must be positive and less than the sender's current balance, taking transaction fees into account).
- **Freighter Signing**: Prepares the transaction XDR payload, prompts Freighter to pop up for user signature, and sends the signed payload to the Horizon Network.

### ⏳ 4. Optimistic Balance Cache (Horizon Index Delay Solver)
- **The Issue**: Once Stellar ledger transaction submissions succeed, it can take up to several seconds for the Horizon indexer to reflect the updated balance. If a user queries their balance immediately, they would see the old balance, leading to confusion.
- **The Solution**: GuíaOrbita uses an **optimistic caching** strategy. Upon transaction success, it computes the expected balance (`balance - paymentAmount - networkFee`) and stores it inside `localStorage` for **30 seconds**.
- **Self-Healing Logic**: During this 30-second window, any balance check or refresh will display the optimistic balance alongside a `(Sync Pending)` warning. Once the Horizon server updates its records and returns a balance equal to or lower than the optimistic balance, the cache is automatically purged and the real Horizon value is displayed.

---

## 🎁 New Enhancements & Custom Features

### 🎭 1. Bot Personalities
Users can switch between three bot personas via a dropdown menu in the Status Bar. The selected persona is cached in `localStorage` and changes the bot's messaging tone instantly:
*   😊 **Friendly (Dost Canlısı)**: A polite, encouraging assistant using warm language.
*   🔬 **Technical (Ciddi/Teknik)**: Outputs formatted like terminal logs, diagnostic metrics, and system status indicators.
*   😎 **Cool (Havalı/Sokak)**: A casual, friendly assistant that uses street slang and laid-back language.

### 📜 2. Transaction History with Explorer Integration
Clicking the "Show Recent Transactions" button fetches the last 5 payment operations for the active public key from Horizon. The bot displays each event in a card-like list bubble:
*   Parses transaction direction (Sent vs. Received).
*   Displays transaction amount, destination/source public key snippets, and timestamp.
*   Includes clickable **StellarExpert Explorer** links for each transaction hash so users can review the ledger details.

### 📖 3. Local Address Book
An integrated contact manager that helps users save addresses:
*   Add contacts directly using their Stellar Public Key and a custom nickname.
*   Address book entries are securely synced to `localStorage` per wallet address.
*   Delete contacts at any time.
*   Select from the address book dropdown inside the Payment Form to immediately autofill recipient addresses, reducing typing mistakes.

---

## 🚀 Setup & Local Installation

Follow these steps to configure your environment and run the project locally.

### Prerequisites
1.  **Node.js**: Install the latest Node.js LTS version from the [official website](https://nodejs.org/).
2.  **Freighter Wallet**: Download the Freighter extension for your browser from the [Freighter App store](https://www.freighter.app/).
3.  **Testnet Configuration**:
    *   Open the Freighter extension.
    *   Click the gear icon (Settings) -> **Preferences**.
    *   Navigate to **Network** (or **Experimental Features** in older versions) and switch the active network from `Public` to **Testnet**.
    *   Setup or import an account. You can fund this account via the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=testnet) or let the bot automatically fund it during first connection.

### Installation Instructions
1.  **Clone the Project**: Download the code repository to your computer.
2.  **Navigate to the Subfolder**: Move into the `naber-bot` directory:
    ```bash
    cd naber-bot
    ```
3.  **Install Dependencies**: Use npm to fetch packages:
    ```bash
    npm install
    ```
4.  **Run Development Server**: Start the Vite development server:
    ```bash
    npm run dev
    ```
5.  **Interact**: Open the address provided in your terminal (usually `http://localhost:5173`) in your web browser.

---

## 📸 Screenshots & Documentation Links
## 📸 Screenshots & Application Gallery

Here is a visual tour of GuíaOrbita (Naber Bot) in action, showcasing the full transactional and conversational flow:

### 1. Wallet Connection & Main Dashboard
When Freighter is connected, the bot retrieves the testnet balance, updates the upper status bar, and presents standard action triggers:
![Wallet Connection Dashboard](./docs/chat-view.png)

### 2. Conversational Balance Verification
Querying the current ledger balance returns natural language confirmations (shown here in friendly mode):
![Balance Checking](./docs/balance-view.png)

### 3. Account Transaction History
Clicking "Son İşlemler" queries Horizon for the account's recent payments and renders them inside custom cards with links to StellarExpert:
![Recent Transactions](./docs/history-view.png)

### 4. Dynamic Payment Inputs & Confirmations
Initiating a payment switches the status bar to "Ciddi/Teknik" mode and presents input forms followed by structured confirmation prompts:
![Technical Mode & Payment Inputs](./docs/technical-mode.png)
![Payment Confirmation Prompt](./docs/confirm-modal.png)

### 5. Secure Freighter Signing Popup
The application prepares the transaction envelope and prompts Freighter to launch for the user's signature:
![Freighter Extension Popup](./docs/freighter-popup.png)

### 6. Optimistic Balance Cache & Transaction Success
When the transaction succeeds, the bot reports the Ledger ID and explorer link. The balance updates instantly to `9754.00 XLM` thanks to our optimistic caching:
![Successful Payment Transaction](./docs/success-notification.png)

### 7. Custom Address Book & Personality Swapping
Users can save frequent contacts and swap personas (shown here with "Eymen" saved, and "Havalı/Sokak" personality active):
![Address Book Manager](./docs/address-book-saved.png)
