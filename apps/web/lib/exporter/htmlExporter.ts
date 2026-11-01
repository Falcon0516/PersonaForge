import { BotConfig, compilePrompt } from "@personaforge/core";

export interface HtmlExportOptions {
  config: BotConfig;
  mode: "hosted" | "byok";
  baseUrl?: string;
}

export function generateStandaloneHtml({
  config,
  mode,
  baseUrl = "https://personaforge.dev",
}: HtmlExportOptions): string {
  const ui = config.ui || {};
  const primaryColor = ui.primaryColor || "#6366f1";
  const accentColor = ui.accentColor || "#06b6d4";
  const surfaceColor = ui.surfaceColor || "#0f172a";
  const backgroundColor = ui.backgroundColor || "#090d16";
  const fontFamily = ui.fontFamily || "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  const headerTitle = ui.headerTitle || config.name;
  const headerSubtitle = ui.headerSubtitle || "Online | Powered by PersonaForge";
  const greeting = ui.greeting || "Hello! How can I assist you today?";
  const avatarEmoji = ui.avatarEmoji || "🤖";
  const suggestedChips = ui.suggestedChips || [];
  const showTimestamps = ui.showTimestamps !== false;
  const showFeedback = ui.showFeedback !== false;
  const showCopyButton = ui.showCopyButton !== false;
  const showPoweredBy = ui.showPoweredBy !== false;

  const compiledPrompt = mode === "byok" ? compilePrompt(config, "web").prompt : "";
  const model = config.runtime?.model || "llama-3.3-70b-versatile";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(config.name)} | PersonaForge</title>
  <style>
    :root {
      --primary: ${primaryColor};
      --accent: ${accentColor};
      --surface: ${surfaceColor};
      --background: ${backgroundColor};
      --font-family: ${fontFamily};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: var(--font-family);
      background: var(--background);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      overflow-x: hidden;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.08) 0px, transparent 50%);
    }
    .chat-container {
      width: 100%;
      max-width: 520px;
      height: 88vh;
      max-height: 780px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15);
    }
    .chat-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.6);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.5);
    }
    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .subtitle {
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
      box-shadow: 0 0 8px #10b981;
    }
    .header-actions button {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .header-actions button:hover {
      color: #fff;
      background: rgba(51, 65, 85, 0.5);
    }
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }
    .messages-area::-webkit-scrollbar {
      width: 5px;
    }
    .messages-area::-webkit-scrollbar-thumb {
      background: rgba(51, 65, 85, 0.5);
      border-radius: 999px;
    }
    .message {
      display: flex;
      gap: 10px;
      max-width: 85%;
    }
    .message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    .message.assistant {
      align-self: flex-start;
    }
    .bubble {
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 13px;
      line-height: 1.55;
      position: relative;
      word-break: break-word;
    }
    .message.user .bubble {
      background: var(--primary);
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }
    .message.assistant .bubble {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(51, 65, 85, 0.5);
      color: #f1f5f9;
      border-bottom-left-radius: 4px;
    }
    .meta-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 10px;
      color: #64748b;
      gap: 8px;
    }
    .message.user .meta-footer {
      color: rgba(255, 255, 255, 0.7);
    }
    .feedback-btns {
      display: flex;
      gap: 4px;
    }
    .feedback-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
    }
    .feedback-btn:hover {
      opacity: 1;
    }
    .chips-container {
      display: flex;
      gap: 8px;
      padding: 0 20px 12px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .chip {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #c7d2fe;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 11px;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chip:hover {
      background: var(--primary);
      color: #fff;
    }
    .input-area {
      padding: 14px 20px;
      border-top: 1px solid rgba(51, 65, 85, 0.6);
      background: rgba(15, 23, 42, 0.6);
    }
    .input-wrapper {
      display: flex;
      align-items: center;
      background: rgba(9, 13, 22, 0.8);
      border: 1px solid rgba(51, 65, 85, 0.7);
      border-radius: 14px;
      padding: 4px 6px 4px 14px;
      transition: border-color 0.2s;
    }
    .input-wrapper:focus-within {
      border-color: var(--primary);
    }
    .input-wrapper input {
      flex: 1;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 13px;
      padding: 8px 0;
      outline: none;
      font-family: inherit;
    }
    .send-btn {
      background: var(--primary);
      border: none;
      color: #fff;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;
    }
    .send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .powered-by {
      text-align: center;
      padding: 8px;
      font-size: 10px;
      color: #64748b;
    }
    .powered-by a {
      color: #818cf8;
      text-decoration: none;
    }
    /* Modal for BYOK */
    .modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(4px);
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 100;
    }
    .modal.active {
      display: flex;
    }
    .modal-content {
      background: #0f172a;
      border: 1px solid #334155;
      padding: 24px;
      border-radius: 20px;
      max-width: 440px;
      width: 100%;
    }
  </style>
</head>
<body>

  <div class="chat-container">
    <div class="chat-header">
      <div class="header-info">
        <div class="avatar">${avatarEmoji}</div>
        <div>
          <div class="title">${escapeHtml(headerTitle)}</div>
          <div class="subtitle"><span class="status-dot"></span> ${escapeHtml(headerSubtitle)}</div>
        </div>
      </div>
      <div class="header-actions">
        ${mode === "byok" ? '<button id="btnSettings" title="API Key Settings">⚙️</button>' : ""}
        <button id="btnReset" title="Reset Chat">🔄</button>
      </div>
    </div>

    <div class="messages-area" id="messagesArea">
      <div class="message assistant">
        <div class="bubble">
          ${escapeHtml(greeting)}
          ${showTimestamps ? '<div class="meta-footer"><span>Just now</span></div>' : ""}
        </div>
      </div>
    </div>

    ${
      suggestedChips.length > 0
        ? `<div class="chips-container" id="chipsContainer">
            ${suggestedChips.map((c) => `<button class="chip" onclick="handleChipClick('${escapeJs(c)}')">${escapeHtml(c)}</button>`).join("")}
          </div>`
        : ""
    }

    <div class="input-area">
      <div class="input-wrapper">
        <input type="text" id="userInput" placeholder="Type a message..." autocomplete="off" />
        <button class="send-btn" id="sendBtn" title="Send message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      ${showPoweredBy ? `<div class="powered-by">Created with <a href="${baseUrl}" target="_blank">PersonaForge Studio</a></div>` : ""}
    </div>
  </div>

  ${
    mode === "byok"
      ? `
  <div class="modal" id="byokModal">
    <div class="modal-content">
      <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">🔑 Groq API Key Required</h3>
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">
        This bot operates in BYOK (Bring Your Own Key) mode. Your key is stored exclusively in your browser's localStorage and communicates directly with Groq.
      </p>
      <input type="password" id="groqKeyInput" placeholder="Enter your Groq key (starts with gsk_)" style="width: 100%; background: #090d16; border: 1px solid #334155; padding: 10px; border-radius: 8px; color: #fff; font-size: 12px; margin-bottom: 16px; outline: none;" />
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button id="cancelKeyBtn" style="padding: 8px 14px; background: transparent; border: 1px solid #334155; color: #cbd5e1; border-radius: 8px; font-size: 12px; cursor: pointer;">Cancel</button>
        <button id="saveKeyBtn" style="padding: 8px 14px; background: #6366f1; border: none; color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">Save Key</button>
      </div>
    </div>
  </div>`
      : ""
  }

  <script>
    (function() {
      const mode = "${mode}";
      const botId = "${config.id}";
      const apiEndpoint = "${mode === "hosted" ? `${baseUrl}/api/public/bots/${config.id}/chat` : "https://api.groq.com/openai/v1/chat/completions"}";
      const compiledSystemPrompt = ${mode === "byok" ? JSON.stringify(compiledPrompt) : "null"};
      const targetModel = "${model}";

      const messagesArea = document.getElementById("messagesArea");
      const userInput = document.getElementById("userInput");
      const sendBtn = document.getElementById("sendBtn");
      const btnReset = document.getElementById("btnReset");

      let messageHistory = [];
      let isStreaming = false;
      let isComposing = false;

      // BYOK modal logic
      const byokModal = document.getElementById("byokModal");
      const groqKeyInput = document.getElementById("groqKeyInput");
      const saveKeyBtn = document.getElementById("saveKeyBtn");
      const cancelKeyBtn = document.getElementById("cancelKeyBtn");
      const btnSettings = document.getElementById("btnSettings");

      function getStoredKey() {
        return localStorage.getItem("pf_groq_key") || "";
      }

      if (btnSettings && byokModal) {
        btnSettings.addEventListener("click", () => {
          groqKeyInput.value = getStoredKey();
          byokModal.classList.add("active");
        });
      }
      if (cancelKeyBtn && byokModal) {
        cancelKeyBtn.addEventListener("click", () => byokModal.classList.remove("active"));
      }
      if (saveKeyBtn && byokModal) {
        saveKeyBtn.addEventListener("click", () => {
          const val = groqKeyInput.value.trim();
          if (val) {
            localStorage.setItem("pf_groq_key", val);
          } else {
            localStorage.removeItem("pf_groq_key");
          }
          byokModal.classList.remove("active");
        });
      }

      // IME composition handling (Modern Web Guidance)
      userInput.addEventListener("compositionstart", () => { isComposing = true; });
      userInput.addEventListener("compositionend", () => { isComposing = false; });
      userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          if (isComposing || e.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          sendMessage();
        }
      });

      sendBtn.addEventListener("click", sendMessage);
      btnReset.addEventListener("click", () => {
        messagesArea.innerHTML = \`
          <div class="message assistant">
            <div class="bubble">
              ${escapeJs(greeting)}
              ${showTimestamps ? '<div class="meta-footer"><span>Just now</span></div>' : ""}
            </div>
          </div>
        \`;
        messageHistory = [];
      });

      window.handleChipClick = function(text) {
        userInput.value = text;
        sendMessage();
      };

      async function sendMessage() {
        const text = userInput.value.trim();
        if (!text || isStreaming) return;

        if (mode === "byok" && !getStoredKey()) {
          byokModal.classList.add("active");
          return;
        }

        // Append user bubble
        appendMessage("user", text);
        userInput.value = "";
        messageHistory.push({ role: "user", content: text });

        // Append assistant placeholder
        const assistantBubble = appendMessage("assistant", "");
        isStreaming = true;
        sendBtn.disabled = true;

        try {
          let response;
          if (mode === "hosted") {
            response = await fetch(apiEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: messageHistory,
              }),
            });
          } else {
            // Direct client BYOK Groq fetch
            response = await fetch(apiEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + getStoredKey(),
              },
              body: JSON.stringify({
                model: targetModel,
                messages: [
                  { role: "system", content: compiledSystemPrompt },
                  ...messageHistory,
                ],
                stream: true,
              }),
            });
          }

          if (!response.ok) {
            const errText = await response.text();
            assistantBubble.textContent = "Error: " + (errText.slice(0, 100) || "Failed to fetch response");
            isStreaming = false;
            sendBtn.disabled = false;
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let accumulated = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;
              const dataStr = trimmed.slice(5).trim();
              if (dataStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataStr);
                // Handle Groq native chunk or PersonaForge SSE token
                const delta = parsed.choices?.[0]?.delta?.content || parsed.text;
                if (delta) {
                  accumulated += delta;
                  assistantBubble.textContent = accumulated;
                  messagesArea.scrollTop = messagesArea.scrollHeight;
                }
              } catch {}
            }
          }

          messageHistory.push({ role: "assistant", content: accumulated });
        } catch (err) {
          assistantBubble.textContent = "Error: " + String(err);
        } finally {
          isStreaming = false;
          sendBtn.disabled = false;
          messagesArea.scrollTop = messagesArea.scrollHeight;
        }
      }

      function appendMessage(role, content) {
        const msgDiv = document.createElement("div");
        msgDiv.className = "message " + role;

        const bubbleDiv = document.createElement("div");
        bubbleDiv.className = "bubble";
        bubbleDiv.textContent = content;

        if (role === "assistant" && ${showFeedback ? "true" : "false"}) {
          const footer = document.createElement("div");
          footer.className = "meta-footer";
          footer.innerHTML = '<span>Just now</span><div class="feedback-btns"><button class="feedback-btn" onclick="this.textContent=\\'✓\\'">👍</button><button class="feedback-btn" onclick="this.textContent=\\'✓\\'">👎</button></div>';
          bubbleDiv.appendChild(footer);
        }

        msgDiv.appendChild(bubbleDiv);
        messagesArea.appendChild(msgDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        return bubbleDiv;
      }
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"');
}
