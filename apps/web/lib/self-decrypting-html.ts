import type { EncryptedPayload } from "@protectedshare/crypto";

export function generateSelfDecryptingHtml(
  encryptedTitle: EncryptedPayload,
  encryptedBody: EncryptedPayload,
  noteTitlePlaceholder = "Encrypted Note"
): string {
  const titlePayloadJson = JSON.stringify(encryptedTitle);
  const bodyPayloadJson = JSON.stringify(encryptedBody);

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${noteTitlePlaceholder} - Decrypt</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    :root {
      --bg-color: #f4f4f5;
      --card-bg: #ffffff;
      --card-border: #e4e4e7;
      --text-color: #18181b;
      --text-muted: #71717a;
      --primary-color: #2563eb;
      --primary-hover: #1d4ed8;
      --error-bg: #fef2f2;
      --error-text: #ef4444;
      --error-border: #fee2e2;
      --input-bg: #ffffff;
      --input-border: #d4d4d8;
      --input-focus: #2563eb;
      --code-bg: #f4f4f5;
      --code-border: #e4e4e7;
      --accent-glow: rgba(37, 99, 235, 0.05);
      --success-color: #16a34a;
    }
    
    html.dark {
      --bg-color: #09090b;
      --card-bg: #09090b;
      --card-border: #27272a;
      --text-color: #f4f4f5;
      --text-muted: #a1a1aa;
      --primary-color: #10b981;
      --primary-hover: #059669;
      --error-bg: rgba(127, 29, 29, 0.15);
      --error-text: #f87171;
      --error-border: rgba(127, 29, 29, 0.3);
      --input-bg: #09090b;
      --input-border: #27272a;
      --input-focus: #10b981;
      --code-bg: #18181b;
      --code-border: #27272a;
      --accent-glow: rgba(16, 185, 129, 0.05);
      --success-color: #34d399;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
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
    
    body::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    
    .container {
      width: 100%;
      max-width: 650px;
      z-index: 10;
    }
    
    .card {
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 2.2rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }
    
    html.dark .card {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
    }
    
    .header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background-color: var(--code-bg);
      border: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      color: var(--primary-color);
    }
    
    h1 {
      font-size: 1.4rem;
      font-weight: 800;
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
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--text-muted);
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
      padding: 0.5rem 2.5rem 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--input-border);
      background-color: var(--input-bg);
      color: var(--text-color);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;
    }
    
    input:focus {
      border-color: var(--input-focus);
      box-shadow: 0 0 0 2px var(--accent-glow);
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
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    
    html.light button.btn-primary {
      color: #ffffff;
    }
    
    html.dark button.btn-primary {
      color: #09090b;
    }
    
    button.btn-primary:hover {
      background-color: var(--primary-hover);
      transform: translateY(-1px);
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
      border-radius: 8px;
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
      font-weight: 800;
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
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.75rem;
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
      border-color: var(--primary-color);
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
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      margin: 1.2rem 0;
    }
    
    .prose code {
      font-family: 'JetBrains Mono', monospace;
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
      font-weight: 800;
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
      border-left: 4px solid var(--primary-color);
      padding-left: 1rem;
      color: var(--text-muted);
      font-style: italic;
      margin: 1rem 0;
    }
    
    .prose a {
      color: var(--primary-color);
      text-decoration: none;
    }
    .prose a:hover {
      text-decoration: underline;
    }
    
    .footer-credits {
      text-align: center;
      margin-top: 2.2rem;
      font-size: 0.7rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    
    .footer-credits a {
      color: var(--primary-color);
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
  </style>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>

  <div class="container">
    <div id="auth-card" class="card">
      
      <!-- AUTHENTICATION VIEW -->
      <div id="auth-view">
        <div class="header">
          <div class="icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1>ProtectedShare Secure Archive</h1>
          <p class="subtitle">This archive is encrypted with client-side AES-256-GCM. Enter the decryption password to unlock the note contents offline.</p>
        </div>
        
        <div id="error-banner" class="error-banner"></div>
        
        <form onsubmit="handleDecrypt(event)">
          <div class="form-group">
            <label for="decrypt-password">Decryption Password</label>
            <div class="input-wrapper">
              <input 
                id="decrypt-password" 
                type="password" 
                placeholder="Enter password..." 
                required 
                autofocus
              />
              <button 
                id="btn-toggle-pass" 
                type="button" 
                class="toggle-visibility" 
                onclick="togglePasswordVisibility()"
                title="Toggle Password Visibility"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
          
          <button id="btn-decrypt" type="submit" class="btn-primary">
            Unlock Archive 🔓
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
              Light Mode ☀️
            </button>
          </div>
        </div>
        
        <div id="decrypted-body" class="prose"></div>
      </div>
      
    </div>
    
    <div class="footer-credits">
      Secured offline via <a href="https://protectedshare.me" target="_blank" rel="noopener noreferrer">ProtectedShare</a> zero-knowledge app
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
      button.innerHTML = "Decrypting note...";
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
        button.innerHTML = "Unlock Archive 🔓";
        showError("Incorrect password. Please verify the credentials.");
        
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
        bodyEl.innerHTML = window.marked.parse(text);
      } else {
        const escaped = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        bodyEl.innerHTML = '<pre style="white-space: pre-wrap; font-family: \\'JetBrains Mono\\', monospace; font-size: 0.85rem; line-height: 1.6; color: inherit; background-color: var(--code-bg); border: 1px solid var(--code-border); border-radius: 6px; padding: 1rem; overflow-x: auto;">' + escaped + '</pre>';
      }
    }

    function copyToClipboard() {
      navigator.clipboard.writeText(decryptedBodyText);
      const btn = document.getElementById("btn-copy");
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Copied! <span style="color: var(--success-color)">✓</span>';
      setTimeout(() => btn.innerHTML = originalText, 1500);
    }

    function printNote() {
      window.print();
    }

    function toggleTheme() {
      const html = document.documentElement;
      const toggleBtn = document.getElementById("btn-theme");
      if (html.classList.contains("dark")) {
        html.classList.remove("dark");
        toggleBtn.innerHTML = "Dark Mode 🌙";
      } else {
        html.classList.add("dark");
        toggleBtn.innerHTML = "Light Mode ☀️";
      }
    }

    function togglePasswordVisibility() {
      const input = document.getElementById("decrypt-password");
      const btn = document.getElementById("btn-toggle-pass");
      if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = \`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>\`;
      } else {
        input.type = "password";
        btn.innerHTML = \`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>\`;
      }
    }
  </script>
</body>
</html>`;
}
