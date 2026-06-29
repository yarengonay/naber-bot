# GuíaOrbita (Naber Bot) 🤖 — Stellar Testnet Assistant

GuíaOrbita is an interactive, chatbot-style wallet assistant built on the Stellar Testnet. Instead of using a traditional, complex dashboard, users can connect their Freighter wallet, check their balance, view their transaction history, manage a personal address book, and send XLM transactions—all through a natural, engaging conversation.

This project was built to complete **Level 1 (White Belt)** of the **Stellar Frontend Challenge**.

---

## 🌟 Key Features

### Core Requirements
- **Freighter Wallet Setup & Connection**: Clean wallet connect/disconnect flows with robust error handling and timeout prevention.
- **Stellar Testnet Integration**: Communicates with the Stellar Testnet via the Horizon server.
- **Balance Handling**: Fetches and displays the native XLM balance in the status bar and chat conversation, including automatic Friendbot funding if the account does not exist.
- **Optimistic Caching**: Custom `localStorage` caching logic to solve Horizon indexing delays, ensuring the correct balance is displayed immediately after sending a transaction.
- **Transaction Flows**: Send payments or fund accounts directly from the chat. Full success/failure status and transaction hashes are presented as links.

### Added Custom Enhancements
1. **Transaction History Viewer**: Pushes the last 5 transactions of the account to the chat bubble, complete with direct links to the transaction hashes on the StellarExpert Explorer.
2. **Address Book (Contacts)**: Save frequently used addresses in a local address book (`localStorage` based). Instantly select contacts in the payment form to autofill addresses.
3. **Bot Personalities**: Select between three different chat modes via the status bar select dropdown:
   - 😊 **Friendly (Dost Canlısı)**: Warm, polite, and supportive assistant language.
   - 🔬 **Technical (Ciddi/Teknik)**: Serious, terminal-like system log format.
   - 😎 **Cool (Havalı/Sokak)**: Casual, slang-inclusive street talk.

---

## 🛠️ Setup & Local Running Instructions

### Prerequisites
1. Install [Node.js](https://nodejs.org/) (LTS recommended).
2. Install the [Freighter Browser Extension](https://www.freighter.app/).
3. In the Freighter settings, make sure to change your network to **Stellar Testnet** and fund/setup your account.

### Installation
1. Clone this repository to your local machine.
2. Navigate to the project folder (`naber-bot` subfolder):
   ```bash
   cd naber-bot
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open the local address in your browser (usually `http://localhost:5173`).

---

## 📸 Screenshots

Please capture and place your project screenshots in the `./docs/` folder or upload them directly to your repository:

### 1. Wallet Connected State & Balance Displayed
![Wallet Connected and Balance](./docs/wallet-connected.png)
*Alternative placeholder: Capture the screen showing the Freighter address and the balance displayed in the upper bar.*

### 2. Transaction Feedback & Result
![Successful Transaction](./docs/transaction-result.png)
*Alternative placeholder: Capture the screen displaying the success message bubble with the XLM amount, Ledger number, and the StellarExpert transaction link.*

---

## ⚙️ Development & Standards
- Built with **React 19** and **Vite**.
- Styled using vanilla CSS variables for clean themes.
- Leverages `@stellar/freighter-api` for wallet queries and transaction signing.
- Leverages `@stellar/stellar-sdk` for Horizon server connectivity.
