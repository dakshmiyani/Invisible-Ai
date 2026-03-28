# Invisible AI: The Seamless Writing Assistant

Invisible AI is a high-fidelity, Google Docs-style Chrome extension that integrates a powerful, "invisible" AI writing assistant. It provides a seamless, professional writing experience where AI-generated content blends directly into your document without distracting popups or labels.

![DocsMind Header](DocsMind/icons/icon128.png)

## ✨ Key Features

- **Pixel-Perfect UI**: A professional-grade clone of the Google Docs interface, including menus, toolbars, and a "paper" editing space.
- **Full WYSIWYG Editor**:
  - Formatting: Bold, Italic, Underline, and Text Color.
  - Typography: Adjustable Font Sizes and a curated list of professional Font Families.
  - History: Functional Undo and Redo commands.
  - Alignment: Professional layout constraints to prevent text overflow.
- **Invisible AI Integration**:
  - Powered by **Groq API** (`llama-3.3-70b-versatile`).
  - **No Branding**: AI content streams directly into the editor as if you typed it.
  - **Context Memory**: Remembers the last 3 blocks of your document for coherent continuations.
  - **Smart Intent**: Detects whether you are writing prose or code and adjusts its style automatically.
- **Professional Export**: Download your documents as **Microsoft Word (.doc)** files with formatting preserved.
- **Auto-Save & Persistence**: Automatically saves your work every 30 seconds to browser storage.
- **Stats**: Real-time word and character counts in the status bar.

## 🚀 Getting Started

### 1. Prerequisites
- You will need a **Groq API Key**. You can get one for free at [console.groq.com](https://console.groq.com/keys).

### 2. Installation
1. Clone this repository or download the source code.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked** and select the `DocsMind` folder from this project.

### 3. Setup
1. Click the Invisible AI icon in your Chrome toolbar to open the extension.
2. When prompted, enter your **Groq API Key**.
3. You're ready to write!

## 📝 How to Use

- **Writing**: Simply type in the white paper area as you would in Google Docs.
- **Ask AI**: 
  - Click the **✨ Ask** button to have the assistant continue your writing.
  - **Better results**: Highlight a specific sentence or paragraph and click **Ask** to "Improve and Polish" that selection.
  - **Shortcut**: Press `Ctrl + Enter` (or `Cmd + Enter`) to trigger the AI instantly.
- **Formatting**: Use the toolbar at the top to style your text.
- **Exporting**: Use the **File > Download** menu or the **Export** button at the bottom to save your work as a Word document.

## 🛠️ Project Structure

- `manifest.json`: Extension configuration.
- `popup.html`: The main interface structure.
- `styles.css`: Custom "Google Docs" styling and layout rules.
- `script.js`: Core editor logic, AI streaming, and formatting commands.
- `marked.min.js`: Local markdown parser for AI content rendering.


