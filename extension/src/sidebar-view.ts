import * as os from "os";
import * as vscode from "vscode";
import { getApiUrl } from "./config";

type CommitSummary = {
  commitHash: string;
  message: string;
  projectName: string;
  committedAt: string;
  vibeDriftScore: number;
  vibeDriftLevel: string;
  userPrompts: number;
};

type SidebarState = {
  apiUrl: string;
  apiKeyConfigured: boolean;
  recentCommits: CommitSummary[];
  loading: boolean;
  error?: string;
};

type SidebarMessage =
  | { type: "connect" }
  | { type: "refresh" }
  | { type: "openDashboard" }
  | { type: "openSettings" };

export class VibeDriftSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "vibedrift.sidebarView";

  private webviewView: vscode.WebviewView | undefined;
  private pendingConnect = false;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly log: (message: string) => void,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.webviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message: SidebarMessage) => {
      switch (message.type) {
        case "connect":
          await this.startConnectFlow();
          break;
        case "refresh":
          await this.refresh();
          break;
        case "openDashboard":
          await vscode.env.openExternal(this.getDashboardUri());
          break;
        case "openSettings":
          await vscode.env.openExternal(this.getSettingsUri());
          break;
      }
    });

    void this.refresh();
  }

  async handleAuthCallback(uri: vscode.Uri): Promise<void> {
    const params = new URLSearchParams(uri.query);
    const apiKey = params.get("apiKey");
    const error = params.get("error");

    if (error) {
      const message = error;
      this.log(`Authentication callback returned error: ${message}`);
      vscode.window.showErrorMessage(`VibeDrift: ${message}`);
      this.pendingConnect = false;
      await this.refresh();
      return;
    }

    if (!apiKey) {
      this.log("Authentication callback did not include apiKey");
      vscode.window.showErrorMessage("VibeDrift: no API key returned from login.");
      this.pendingConnect = false;
      await this.refresh();
      return;
    }

    const config = vscode.workspace.getConfiguration("vibedrift");
    await config.update("apiKey", apiKey, vscode.ConfigurationTarget.Global);
    this.log("API key configured from auth callback");

    this.pendingConnect = false;
    vscode.window.showInformationMessage("VibeDrift connected successfully.");
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const state = await this.buildState();
    this.postState(state);
  }

  async onConfigurationChanged(): Promise<void> {
    await this.refresh();
  }

  private async startConnectFlow(): Promise<void> {
    try {
      const apiUrl = getApiUrl();
      const extensionId = this.context.extension.id;
      const callbackUri = await vscode.env.asExternalUri(
        vscode.Uri.parse(`vscode://${extensionId}/auth-callback`),
      );

      const connectUrl = new URL("/vscode/connect", this.normalizeBaseUrl(apiUrl));
      connectUrl.searchParams.set("redirect", callbackUri.toString());
      connectUrl.searchParams.set("name", `VS Code · ${os.hostname()}`);

      this.pendingConnect = true;
      this.log("Opening browser for VibeDrift authentication...");
      await vscode.env.openExternal(vscode.Uri.parse(connectUrl.toString()));
      await this.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open login flow";
      this.log(`Connect flow failed: ${message}`);
      vscode.window.showErrorMessage(`VibeDrift: ${message}`);
      this.pendingConnect = false;
      await this.refresh();
    }
  }

  private async buildState(): Promise<SidebarState> {
    const config = vscode.workspace.getConfiguration("vibedrift");
    const apiUrl = getApiUrl();
    const apiKey = config.get<string>("apiKey", "");

    if (!apiKey) {
      return {
        apiUrl,
        apiKeyConfigured: false,
        recentCommits: [],
        loading: this.pendingConnect,
      };
    }

    try {
      const recentCommits = await this.fetchRecentCommits(apiUrl, apiKey);
      return {
        apiUrl,
        apiKeyConfigured: true,
        recentCommits,
        loading: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        apiUrl,
        apiKeyConfigured: true,
        recentCommits: [],
        loading: false,
        error: message,
      };
    }
  }

  private async fetchRecentCommits(apiUrl: string, apiKey: string): Promise<CommitSummary[]> {
    const url = new URL("/api/commits?limit=8", this.normalizeBaseUrl(apiUrl));
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("API key invalid or expired. Reconnect your account.");
      }
      throw new Error(`Unable to load recent vibes (${response.status})`);
    }

    const rows = (await response.json()) as CommitSummary[];
    return rows;
  }

  private normalizeBaseUrl(apiUrl: string): string {
    return apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;
  }

  private getDashboardUri(): vscode.Uri {
    const apiUrl = getApiUrl();
    return vscode.Uri.parse(new URL("/dashboard", this.normalizeBaseUrl(apiUrl)).toString());
  }

  private getSettingsUri(): vscode.Uri {
    const apiUrl = getApiUrl();
    return vscode.Uri.parse(new URL("/dashboard/settings", this.normalizeBaseUrl(apiUrl)).toString());
  }

  private postState(state: SidebarState): void {
    this.webviewView?.webview.postMessage({
      type: "state",
      payload: state,
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VibeDrift</title>
  <style>
    :root {
      --background: #0a0a0a;
      --foreground: #ededed;
      --card: #141414;
      --card-foreground: #ededed;
      --border: #262626;
      --muted: #1a1a1a;
      --muted-foreground: #a1a1a1;
      --primary: #facc15;
      --primary-foreground: #0a0a0a;
      --accent: #1a1a1a;
      --accent-foreground: #facc15;
      --high: #f59e0b;
      --drift: #ef4444;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(80% 80% at 20% 0%, rgba(250,204,21,0.08) 0%, transparent 60%),
        linear-gradient(180deg, #090909 0%, #0a0a0a 100%);
      color: var(--foreground);
      font-family: system-ui, -apple-system, sans-serif;
      padding: 14px;
    }

    .frame {
      border: 1px solid var(--border);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(20,20,20,0.95), rgba(16,16,16,0.95));
      box-shadow: 0 12px 32px rgba(0,0,0,0.35);
      overflow: hidden;
    }

    .head {
      padding: 14px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .brand {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .brand h1 {
      margin: 0;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--primary);
    }

    .brand p {
      margin: 0;
      font-size: 11px;
      color: var(--muted-foreground);
    }

    .actions {
      display: flex;
      gap: 6px;
    }

    button {
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.02);
      color: var(--foreground);
      border-radius: 6px;
      font-size: 11px;
      padding: 6px 9px;
      cursor: pointer;
      transition: all 120ms ease;
    }
    button:hover { border-color: var(--primary); color: var(--primary); }

    .content {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px;
      background: rgba(255,255,255,0.02);
    }

    .card h2 {
      margin: 0 0 6px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--foreground);
    }

    .card p {
      margin: 0;
      font-size: 12px;
      line-height: 1.45;
      color: var(--muted-foreground);
    }

    .primary {
      width: 100%;
      margin-top: 10px;
      border-color: rgba(250,204,21,0.45);
      background: linear-gradient(180deg, rgba(250,204,21,0.24), rgba(250,204,21,0.14));
      color: var(--primary-foreground);
      font-weight: 600;
    }

    .commit {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px;
      display: grid;
      gap: 6px;
      background: rgba(0,0,0,0.14);
    }

    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .project {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      color: #d4d4d4;
      max-width: 65%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .badge {
      border-radius: 999px;
      font-size: 10px;
      padding: 3px 8px;
      border: 1px solid transparent;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }

    .score-very-low, .score-low {
      background: rgba(250,204,21,0.12);
      border-color: rgba(250,204,21,0.35);
      color: #fde68a;
    }
    .score-moderate {
      background: rgba(245,158,11,0.15);
      border-color: rgba(245,158,11,0.35);
      color: var(--high);
    }
    .score-high {
      background: rgba(255,140,105,0.15);
      border-color: rgba(255,140,105,0.35);
      color: var(--high);
    }
    .score-vibe-drift {
      background: rgba(255,95,142,0.15);
      border-color: rgba(255,95,142,0.35);
      color: var(--drift);
    }

    .msg {
      font-size: 12px;
      color: var(--text);
      line-height: 1.4;
    }

    .meta {
      font-size: 11px;
      color: var(--muted-foreground);
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .error {
      border-color: rgba(255,95,142,0.4);
      background: rgba(239,68,68,0.12);
      color: #fca5a5;
      font-size: 12px;
      padding: 9px;
      border-radius: 9px;
    }
  </style>
</head>
<body>
  <div class="frame">
    <header class="head">
      <div class="brand">
        <h1>VibeDriftTracker
          <svg width="16" height="10" viewBox="0 0 20 12" fill="none" style="display:inline-block; opacity:0.7; margin-left:4px; vertical-align:middle;">
            <path d="M1 6 C4 1, 7 1, 10 6 S16 11, 19 6" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" fill="none"></path>
          </svg>
        </h1>
        <p id="subtitle">For vibecoders</p>
      </div>
      <div class="actions">
        <button id="refreshBtn">Refresh</button>
      </div>
    </header>
    <main class="content" id="content"></main>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const content = document.getElementById("content");
    const subtitle = document.getElementById("subtitle");
    const refreshBtn = document.getElementById("refreshBtn");
    refreshBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "refresh" });
    });

    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message?.type === "state") {
        render(message.payload);
      }
    });

    function render(state) {
      const url = safe(state.apiUrl || "");
      subtitle.textContent = state.apiKeyConfigured ? "Connected" : "Not Connected";
      if (!state.apiKeyConfigured) {
        content.innerHTML = \`
          <section class="card">
            <h2>Connect Account</h2>
            <p>Log in from your browser and VibeDrift will create + configure your API key automatically in VS Code.</p>
            <button class="primary" id="connectBtn">\${state.loading ? "Waiting for login..." : "Login and Connect"}</button>
            <p style="margin-top:8px;">Instance: \${url}</p>
          </section>
        \`;
        const connectBtn = document.getElementById("connectBtn");
        connectBtn?.addEventListener("click", () => vscode.postMessage({ type: "connect" }));
        return;
      }

      const header = \`
        <section class="card">
          <h2>Recent Vibes</h2>
          <p>Your latest commits scored by drift level.</p>
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button id="dashboardBtn">Dashboard</button>
            <button id="settingsBtn">API Keys</button>
          </div>
        </section>
      \`;

      const error = state.error ? \`<div class="error">\${safe(state.error)}</div>\` : "";
      const commits = state.recentCommits || [];
      const commitsHtml = commits.length
        ? commits.map((c) => commitCard(c)).join("")
        : \`<section class="card"><p>No commits yet. Make a commit and it will appear here.</p></section>\`;

      content.innerHTML = header + error + commitsHtml;
      document.getElementById("dashboardBtn")?.addEventListener("click", () => vscode.postMessage({ type: "openDashboard" }));
      document.getElementById("settingsBtn")?.addEventListener("click", () => vscode.postMessage({ type: "openSettings" }));
    }

    function commitCard(commit) {
      const level = safe((commit.vibeDriftLevel || "low").toLowerCase());
      const score = Number(commit.vibeDriftScore || 0).toFixed(1);
      const project = safe(commit.projectName || "Unknown project");
      const message = safe(commit.message || "(no message)");
      const prompts = Number(commit.userPrompts || 0);
      const date = safe(new Date(commit.committedAt).toLocaleString());
      return \`
        <article class="commit">
          <div class="top">
            <span class="project">\${project}</span>
            <span class="badge score-\${level}">\${level} · \${score}</span>
          </div>
          <div class="msg">\${message}</div>
          <div class="meta">
            <span>\${prompts} prompts</span>
            <span>\${date}</span>
          </div>
        </article>
      \`;
    }

    function safe(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    }
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
