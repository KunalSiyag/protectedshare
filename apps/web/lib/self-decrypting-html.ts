import type { EncryptedPayload } from "@protectedshare/crypto";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateSelfDecryptingHtml(
  encryptedTitle: EncryptedPayload,
  encryptedBody: EncryptedPayload,
  noteTitlePlaceholder = "Encrypted note"
): string {
  const titlePayloadJson = JSON.stringify(encryptedTitle);
  const bodyPayloadJson = JSON.stringify(encryptedBody);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(noteTitlePlaceholder)} - Decrypt</title>
  <script>
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.classList.add("dark");
  </script>
  <style>
    :root {
      color-scheme: light;
      --bg-color: #F6F7F7;
      --card-bg: #FFFFFF;
      --card-border: #DFE3E3;
      --text-color: #0A0F0F;
      --text-muted: #6C7777;
      --primary-color: #0A0F0F;
      --primary-hover: #262C2C;
      --on-primary: #FFFFFF;
      --seal: #E8470F;
      --error-bg: rgba(196, 43, 28, 0.08);
      --error-text: #C42B1C;
      --error-border: rgba(196, 43, 28, 0.2);
      --input-bg: #FFFFFF;
      --input-border: #C6CDCD;
      --input-focus: #6C7777;
      --focus-ring: rgba(232, 71, 15, 0.2);
      --code-bg: #EEF0F0;
      --code-border: #DFE3E3;
      --success-color: #11804C;
    }

    html.dark {
      color-scheme: dark;
      --bg-color: #0B0D0D;
      --card-bg: #121515;
      --card-border: #252A2A;
      --text-color: #F2F4F4;
      --text-muted: #7D8888;
      --primary-color: #F2F4F4;
      --primary-hover: #D5DADA;
      --on-primary: #0A0F0F;
      --seal: #FF6B36;
      --error-bg: rgba(255, 122, 107, 0.12);
      --error-text: #FF7A6B;
      --error-border: rgba(255, 122, 107, 0.25);
      --input-bg: #121515;
      --input-border: #343B3B;
      --input-focus: #7D8888;
      --focus-ring: rgba(255, 107, 54, 0.25);
      --code-bg: #191D1D;
      --code-border: #252A2A;
      --success-color: #3CCB7F;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: background-color 0.3s, color 0.3s;
      position: relative;
      overflow-x: hidden;
      padding: 2rem 1rem;
    }
    
    .container {
      width: 100%;
      max-width: 650px;
      z-index: 10;
    }
    
    .card {
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 2rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px -8px rgba(0, 0, 0, 0.12);
      transition: all 0.3s ease;
    }
    
    html.dark .card {
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 12px 32px -8px rgba(0, 0, 0, 0.6);
    }
    
    .header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      background-color: var(--code-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      color: var(--seal);
    }
    
    h1 {
      font-size: 1.375rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }
    
    .subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    .form-group label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-color);
      margin-bottom: 0.5rem;
    }
    
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    input[type="password"], input[type="text"] {
      width: 100%;
      height: 44px;
      padding: 0.5rem 2.5rem 0.5rem 0.875rem;
      border-radius: 10px;
      border: 1px solid var(--input-border);
      background-color: var(--input-bg);
      color: var(--text-color);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 1rem;
      outline: none;
      transition: all 0.2s;
    }
    
    input:focus {
      border-color: var(--input-focus);
      box-shadow: 0 0 0 3px var(--focus-ring);
    }
    
    .toggle-visibility {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 4px;
    }
    
    .toggle-visibility:hover {
      color: var(--text-color);
      background-color: var(--code-bg);
    }
    
    button.btn-primary {
      width: 100%;
      height: 44px;
      background-color: var(--primary-color);
      color: var(--on-primary);
      border: none;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    
    button.btn-primary:hover {
      background-color: var(--primary-hover);
    }
    
    button.btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .error-banner {
      display: none;
      align-items: center;
      gap: 10px;
      padding: 0.75rem 1rem;
      background-color: var(--error-bg);
      border: 1px solid var(--error-border);
      border-radius: 10px;
      color: var(--error-text);
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
      animation: fadeIn 0.2s ease-in-out;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    
    .shake {
      animation: shake 0.4s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Decrypted View Container */
    .decrypted-view {
      display: none;
      animation: fadeIn 0.4s ease-in-out;
    }
    
    .viewer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .viewer-title {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--text-color);
      flex: 1;
      min-width: 200px;
    }
    
    .actions-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .btn-action {
      background: none;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    
    .btn-action:hover {
      color: var(--text-color);
      border-color: var(--input-border);
      background-color: var(--code-bg);
    }
    
    /* Prose styling */
    .prose {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text-color);
    }
    
    .prose pre {
      background-color: var(--code-bg);
      border: 1px solid var(--code-border);
      border-radius: 6px;
      padding: 1rem;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
      margin: 1.2rem 0;
    }
    
    .prose code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
      background-color: var(--code-bg);
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid var(--code-border);
    }
    
    .prose pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      border: none;
    }
    
    .prose h1, .prose h2, .prose h3 {
      font-weight: 600;
      letter-spacing: -0.015em;
      margin-top: 1.5rem;
      margin-bottom: 0.8rem;
      color: var(--text-color);
    }
    .prose h1 { font-size: 1.4rem; border-bottom: 1px solid var(--card-border); padding-bottom: 4px; }
    .prose h2 { font-size: 1.2rem; }
    .prose h3 { font-size: 1.05rem; }
    
    .prose p { margin-bottom: 1rem; }
    .prose ul, .prose ol { margin-left: 1.5rem; margin-bottom: 1rem; }
    .prose li { margin-bottom: 0.4rem; }
    
    .prose blockquote {
      border-left: 2px solid var(--input-border);
      padding-left: 1rem;
      color: var(--text-muted);
      margin: 1rem 0;
    }
    
    .prose a {
      color: var(--text-color);
      text-decoration: underline;
      text-decoration-color: var(--input-border);
      text-underline-offset: 3px;
    }
    .prose a:hover {
      text-decoration-color: var(--text-color);
    }
    
    .footer-credits {
      text-align: center;
      margin-top: 2.2rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    .footer-credits a {
      color: var(--text-color);
      text-decoration: none;
    }
    
    @media print {
      body {
        background-color: #ffffff !important;
        color: #000000 !important;
        padding: 0;
      }
      .card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .btn-action, .footer-credits, .viewer-header button {
        display: none !important;
      }
      .viewer-title {
        border-bottom: 2px solid #000000;
        padding-bottom: 8px;
        margin-bottom: 20px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      body,
      .card,
      input,
      button,
      .error-banner,
      .decrypted-view,
      .shake {
        transition: none;
        animation: none;
      }
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js" integrity="sha384-/TQbtLCAerC3jgaim+N78RZSDYV7ryeoBCVqTuzRrFec2akfBkHS7ACQ3PQhvMVi" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</head>
<body>

  <div class="container">
    <div id="auth-card" class="card">
      
      <!-- AUTHENTICATION VIEW -->
      <div id="auth-view">
        <div class="header">
          <div class="icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1>Encrypted note</h1>
          <p class="subtitle">Encrypted with AES-256-GCM. Enter the password to open it. Decryption happens in this browser.</p>
        </div>
        
        <div id="error-banner" class="error-banner" role="alert"></div>
        
        <form onsubmit="handleDecrypt(event)">
          <div class="form-group">
            <label for="decrypt-password">Password</label>
            <div class="input-wrapper">
              <input 
                id="decrypt-password" 
                type="password" 
                
                required 
                autofocus
              />
              <button 
                id="btn-toggle-pass" 
                type="button" 
                class="toggle-visibility" 
                onclick="togglePasswordVisibility()"
                aria-label="Show password"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
          
          <button id="btn-decrypt" type="submit" class="btn-primary">
            Open note
          </button>
        </form>
      </div>

      <!-- DECRYPTED CONTENT VIEW -->
      <div id="decrypted-view" class="decrypted-view">
        <div class="viewer-header">
          <h2 id="viewer-title" class="viewer-title">Decrypted Note</h2>
          <div class="actions-row">
            <button id="btn-copy" class="btn-action" onclick="copyToClipboard()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
            <button class="btn-action" onclick="printNote()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print
            </button>
            <button id="btn-theme" class="btn-action" onclick="toggleTheme()">
              Theme
            </button>
          </div>
        </div>
        
        <div id="decrypted-body" class="prose"></div>
      </div>
      
    </div>
    
    <div class="footer-credits">
      Exported from <a href="https://protectedshare.me" target="_blank" rel="noopener noreferrer">ProtectedShare</a> Notepad
    </div>
  </div>

  <script>
    const encryptedTitle = ${titlePayloadJson};
    const encryptedBody = ${bodyPayloadJson};

    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    function base64UrlToBytes(value) {
      const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const binary = atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let idx = 0; idx < binary.length; idx++) {
        bytes[idx] = binary.charCodeAt(idx);
      }
      return bytes;
    }

    async function deriveAesKey(password, saltBytes) {
      const passwordKey = await crypto.subtle.importKey(
        "raw",
        textEncoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
      );
      return crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: saltBytes,
          iterations: 210000,
          hash: "SHA-256"
        },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
    }

    async function decryptPayload(payload, password) {
      const decodedIv = base64UrlToBytes(payload.iv);
      const decodedSalt = base64UrlToBytes(payload.salt);
      const key = await deriveAesKey(password, decodedSalt);
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: decodedIv },
        key,
        base64UrlToBytes(payload.encryptedBlob)
      );
      return textDecoder.decode(decrypted);
    }

    let decryptedBodyText = "";

    async function handleDecrypt(event) {
      if (event) event.preventDefault();
      const passwordInput = document.getElementById("decrypt-password").value;
      const button = document.getElementById("btn-decrypt");
      const errorBanner = document.getElementById("error-banner");
      const card = document.getElementById("auth-card");
      
      if (!passwordInput.trim()) {
        showError("Password is required.");
        return;
      }
      
      button.disabled = true;
      button.innerHTML = "Opening…";
      errorBanner.style.display = "none";
      
      try {
        const title = await decryptPayload(encryptedTitle, passwordInput);
        const body = await decryptPayload(encryptedBody, passwordInput);
        
        decryptedBodyText = body;
        
        document.getElementById("auth-view").style.display = "none";
        document.getElementById("decrypted-view").style.display = "block";
        document.getElementById("viewer-title").innerText = title || "Untitled note";
        document.title = title + " - Decrypted Archive";
        
        renderContent(body);
      } catch (err) {
        console.error(err);
        button.disabled = false;
        button.innerHTML = "Open note";
        showError("That password doesn't open this note.");
        
        card.classList.add("shake");
        setTimeout(() => card.classList.remove("shake"), 400);
      }
    }

    function showError(msg) {
      const errorBanner = document.getElementById("error-banner");
      errorBanner.innerText = msg;
      errorBanner.style.display = "flex";
    }

    function renderContent(text) {
      const bodyEl = document.getElementById("decrypted-body");
      if (window.marked && typeof window.marked.parse === "function") {
        // Raw HTML in the note is shown as text, and only http(s)/mailto links survive.
        const esc = (value) => String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        const safeUrl = (href) => /^(https?:|mailto:)/i.test(String(href || "").trim()) ? String(href).trim() : "";
        window.marked.use({
          renderer: {
            html(html) { return esc(html); },
            link(href, title, text) {
              const url = safeUrl(href);
              if (!url) return text;
              return '<a href="' + esc(url) + '" rel="noopener noreferrer nofollow" target="_blank"' + (title ? ' title="' + esc(title) + '"' : "") + ">" + text + "</a>";
            },
            image(href, title, text) {
              return esc(text || "");
            }
          }
        });
        bodyEl.innerHTML = window.marked.parse(text);
      } else {
        const escaped = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        bodyEl.innerHTML = '<pre style="white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.85rem; line-height: 1.6; color: inherit; background-color: var(--code-bg); border: 1px solid var(--code-border); border-radius: 6px; padding: 1rem; overflow-x: auto;">' + escaped + '</pre>';
      }
    }

    function copyToClipboard() {
      navigator.clipboard.writeText(decryptedBodyText);
      const btn = document.getElementById("btn-copy");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span style="color: var(--success-color)">Copied</span>';
      setTimeout(() => btn.innerHTML = originalText, 1500);
    }

    function printNote() {
      window.print();
    }

    function toggleTheme() {
      const html = document.documentElement;
      const toggleBtn = document.getElementById("btn-theme");
      html.classList.toggle("dark");
      toggleBtn.innerHTML = "Theme";
    }

    function togglePasswordVisibility() {
      const input = document.getElementById("decrypt-password");
      const btn = document.getElementById("btn-toggle-pass");
      if (input.type === "password") {
        input.type = "text";
        btn.setAttribute("aria-label", "Hide password");
        btn.innerHTML = \`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>\`;
      } else {
        input.type = "password";
        btn.setAttribute("aria-label", "Show password");
        btn.innerHTML = \`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>\`;
      }
    }
  </script>
</body>
</html>`;
}
