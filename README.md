# mitrAI: Interactive AI ChatBot

mitrAI is an aesthetic, modern, full-stack AI chatbot powered by the **Google Gemini API** (`gemini-2.5-flash`). Built with a beautiful glassmorphic UI, it features a safe backend proxy designed to securely stream and handle your private API key without exposing it to the client side.

## ✨ Features

- **Conversational AI:** Engaging chat experience with smooth streaming responses handled securely through a Node.js backend.
- **Persistent Sessions (Login):** Includes a sleek login overlay that demands a user's name on first load, securely storing session details in the browser's `localStorage` so they are remembered during return visits.
- **Multimodal Support:** Supports image attachments for powerful vision-based AI queries.
- **Voice Interactions:** 
  - Speak your messages directly using the built-in browser Speech-to-Text Recognition interface.
  - MitrAI can audibly read out its responses to you effortlessly via Text-to-Speech synthesis.
- **Rich Formatting:** Instantly parses Markdown elements like bold text and tables in the server stream. Includes beautifully rendered Code Blocks with automatic one-click "Copy" functionality.
- **Chat History:** Visual sidebar organizing previous interactions so you can reference older messages contextually.
- **Secure Backend Integration:** The Gemini API interacts strictly with a `server.js` Express proxy. Your API Key stays safely locked within your `.env` file instead of being leaked on the frontend. 

---

## 🚀 Getting Started

Follow these instructions to get mitrAI running locally on your machine.

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended for native Fetch API support)
- A valid Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Swaim-Sahay/Interactive-ChatBot.git
   cd Interactive-ChatBot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Create a file named `.env` in the root directory.
   - Add your Gemini API Key safely to this file:
     ```env
     GEMINI_API_KEY=your_google_gemini_api_key_here
     PORT=3000
     ```

### Running the Application

Start the backend Node server which will securely serve the UI and connect to Gemini:
```bash
node server.js
```

Once running across your terminal, open your favorite web browser and navigate to:
**`http://localhost:3000`**

Enjoy conversing with your digital *mitra*!

---

## 🛠 Tech Stack

- **Frontend:** Vanilla HTML5, advanced CSS3 (Glassmorphism & Flexbox), and modular JavaScript.
- **Backend:** Node.js with the Express framework.
- **Libraries/APIs:**
  - `marked.js` and `highlight.js` (for rendering Markdown text & code syntax respectively).
  - `dotenv` (for API key security).
  - Web Speech APi (`SpeechRecognition` & `SpeechSynthesis`).
  - Google Gemini API (`gemini-2.5-flash`).