<script lang="ts">
  import { Copy, Check } from 'lucide-svelte'
  import { toast } from '$lib/stores/toast'

  let copiedIndex = -1

  function copyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text)
    copiedIndex = index
    toast.success('Copied to clipboard')
    setTimeout(() => copiedIndex = -1, 2000)
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>MCP Integration Guide</h1>
    <p class="page-subtitle">Install and configure PaperHub MCP server with your AI tools</p>
  </div>

  <section class="section">
    <h2>What is MCP?</h2>
    <p>
      Model Context Protocol (MCP) is a standard that allows AI applications to access external tools and data sources.
      PaperHub's MCP server gives Claude, ChatGPT, Copilot, and other AI tools access to your research library,
      notebooks, papers, and transcriptions.
    </p>
  </section>

  <section class="section">
    <h2>Available MCP Tools</h2>
    <div class="tools-grid">
      <div class="tool-card">
        <h3>Papers</h3>
        <ul>
          <li>Create and manage scientific papers</li>
          <li>Add and manage notes</li>
          <li>Share papers with other users</li>
          <li>Search and filter papers</li>
        </ul>
      </div>

      <div class="tool-card">
        <h3>Notebooks</h3>
        <ul>
          <li>Create and organize notebooks</li>
          <li>Write and edit posts in Markdown</li>
          <li>Attach files to posts</li>
          <li>Associate papers with posts</li>
        </ul>
      </div>

      <div class="tool-card">
        <h3>Transcriptions</h3>
        <ul>
          <li>Create transcription groups</li>
          <li>Trigger audio transcription via Deepgram</li>
          <li>Generate AI-powered notes from transcriptions</li>
          <li>Store structured notes in Markdown</li>
        </ul>
      </div>

      <div class="tool-card">
        <h3>Attachments</h3>
        <ul>
          <li>Upload files to papers and posts</li>
          <li>Get presigned download URLs</li>
          <li>Manage file lifecycle</li>
          <li>Support for PDFs, images, and more</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <h2>Installation Instructions</h2>

    <div class="setup-guide">
      <div class="setup-step">
        <h3>Step 1: Get Your API Key</h3>
        <p>
          Go to <a href="/mcp/keys">API Keys</a> and create a new API key with the "Owner" privilege.
          Save this key in a safe place—you'll need it to configure your MCP client.
        </p>
      </div>

      <div class="setup-step">
        <h3>Step 2: Set Environment Variable</h3>
        <p>Store your API key as an environment variable for secure access:</p>
        <div class="code-snippet">
          <code>export PAPERHUB_MCP_APIKEY="your_api_key_here"</code>
          <button class="copy-code-btn" onclick={() => copyToClipboard('export PAPERHUB_MCP_APIKEY="your_api_key_here"', 10)}>
            {#if copiedIndex === 10}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>
        <p><strong>Or on Windows (PowerShell):</strong></p>
        <div class="code-snippet">
          <code>$env:PAPERHUB_MCP_APIKEY="your_api_key_here"</code>
          <button class="copy-code-btn" onclick={() => copyToClipboard('$env:PAPERHUB_MCP_APIKEY="your_api_key_here"', 11)}>
            {#if copiedIndex === 11}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>
      </div>

      <div class="setup-step">
        <h3>Step 3: Configure Your AI Tool</h3>
        <p>Follow the setup instructions below for your preferred AI tool.</p>
      </div>
    </div>
  </section>

  <section class="section">
    <h2>Setup Guides by Tool</h2>

    <!-- Claude Desktop -->
    <div class="tool-setup">
      <h3>Claude Desktop</h3>
      <div class="setup-content">
        <p><strong>Option 1: Using Claude CLI</strong></p>
        <p>If you have the Claude CLI installed:</p>
        <div class="code-snippet">
          <code>claude mcp add paperhub https://mcp-paperhub.tferrer.dev/mcp --scope user --transport http --header "X-Api-Key: ${"{PAPERHUB_MCP_APIKEY}"}"</code>
          <button class="copy-code-btn" onclick={() => copyToClipboard('claude mcp add paperhub https://mcp-paperhub.tferrer.dev/mcp --scope user --transport http --header "X-Api-Key: ${PAPERHUB_MCP_APIKEY}"', 0)}>
            {#if copiedIndex === 0}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>

        <p><strong>Option 2: Manual Configuration</strong></p>
        <p>Edit the Claude config file:</p>

        <div class="code-block windows">
          <div class="os-label">Windows</div>
          <div class="code-path">%AppData%\Claude\claude_desktop_config.json</div>
        </div>

        <div class="code-block mac">
          <div class="os-label">macOS</div>
          <div class="code-path">~/Library/Application Support/Claude/claude_desktop_config.json</div>
        </div>

        <div class="code-snippet">
          <code>{`{
  "mcpServers": {
    "paperhub": {
      "url": "https://mcp-paperhub.tferrer.dev/mcp",
      "transport": "http",
      "headers": {
        "X-Api-Key": "${"${PAPERHUB_MCP_APIKEY}"}"
      }
    }
  }
}`}</code>
          <button class="copy-code-btn" onclick={() => copyToClipboard(`{
  "mcpServers": {
    "paperhub": {
      "url": "https://mcp-paperhub.tferrer.dev/mcp",
      "transport": "http",
      "headers": {
        "X-Api-Key": "\${PAPERHUB_MCP_APIKEY}"
      }
    }
  }
}`, 0)}
          >
            {#if copiedIndex === 0}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>

        <p><strong>Then restart Claude Desktop.</strong></p>
      </div>
    </div>

    <!-- GitHub Copilot -->
    <div class="tool-setup">
      <h3>GitHub Copilot CLI</h3>
      <div class="setup-content">
        <p><strong>Add the MCP server with a single command:</strong></p>

        <div class="code-snippet">
          <code>copilot config set mcp_server.paperhub.url https://mcp-paperhub.tferrer.dev/mcp</code>
          <button
            class="copy-code-btn"
            onclick={() => copyToClipboard('copilot config set mcp_server.paperhub.url https://mcp-paperhub.tferrer.dev/mcp', 1)}
          >
            {#if copiedIndex === 1}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>

        <div class="code-snippet">
          <code>copilot config set mcp_server.paperhub.transport http</code>
          <button
            class="copy-code-btn"
            onclick={() => copyToClipboard('copilot config set mcp_server.paperhub.transport http', 12)}
          >
            {#if copiedIndex === 12}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>

        <div class="code-snippet">
          <code>copilot config set mcp_server.paperhub.headers.X-Api-Key ${"{PAPERHUB_MCP_APIKEY}"}</code>
          <button
            class="copy-code-btn"
            onclick={() => copyToClipboard('copilot config set mcp_server.paperhub.headers.X-Api-Key ${PAPERHUB_MCP_APIKEY}', 2)}
          >
            {#if copiedIndex === 2}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>

        <p><strong>Or edit manually:</strong></p>
        <div class="code-block">
          <div class="code-path">~/.config/github-copilot/copilot-config.yaml</div>
        </div>

        <div class="code-snippet">
          <code>{`mcp_servers:
  paperhub:
    url: https://mcp-paperhub.tferrer.dev/mcp
    transport: http
    headers:
      X-Api-Key: \${PAPERHUB_MCP_APIKEY}`}</code>
          <button
            class="copy-code-btn"
            onclick={() => copyToClipboard(`mcp_servers:
  paperhub:
    url: https://mcp-paperhub.tferrer.dev/mcp
    transport: http
    headers:
      X-Api-Key: \${PAPERHUB_MCP_APIKEY}`, 13)}
          >
            {#if copiedIndex === 13}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>

        <p><strong>Then reload Copilot:</strong></p>
        <div class="code-snippet">
          <code>copilot config reload</code>
          <button class="copy-code-btn" onclick={() => copyToClipboard('copilot config reload', 3)}>
            {#if copiedIndex === 3}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Cursor -->
    <div class="tool-setup">
      <h3>Cursor</h3>
      <div class="setup-content">
        <p><strong>Edit the Cursor config file:</strong></p>

        <div class="code-block">
          <div class="code-path">~/.cursor/cursor_settings.json</div>
        </div>

        <p><strong>Add this configuration:</strong></p>
        <div class="code-snippet">
          <code>{`{
  "mcpServers": {
    "paperhub": {
      "url": "https://mcp-paperhub.tferrer.dev/mcp",
      "transport": "http",
      "headers": {
        "X-Api-Key": "\${PAPERHUB_MCP_APIKEY}"
      }
    }
  }
}`}</code>
          <button
            class="copy-code-btn"
            onclick={() => copyToClipboard(`{
  "mcpServers": {
    "paperhub": {
      "url": "https://mcp-paperhub.tferrer.dev/mcp",
      "transport": "http",
      "headers": {
        "X-Api-Key": "\${PAPERHUB_MCP_APIKEY}"
      }
    }
  }
}`, 4)}
          >
            {#if copiedIndex === 4}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>

        <p><strong>Restart Cursor and enable MCP in settings.</strong></p>
      </div>
    </div>

    <!-- Windsurf -->
    <div class="tool-setup">
      <h3>Windsurf</h3>
      <div class="setup-content">
        <p><strong>Edit the Windsurf config:</strong></p>

        <div class="code-block">
          <div class="code-path">~/.windsurf/windsurf.conf</div>
        </div>

        <p><strong>Add this configuration:</strong></p>
        <div class="code-snippet">
          <code>{`[mcp_servers.paperhub]
url = "https://mcp-paperhub.tferrer.dev/mcp"
transport = "http"

[mcp_servers.paperhub.headers]
X-Api-Key = "\${PAPERHUB_MCP_APIKEY}"`}</code>
          <button
            class="copy-code-btn"
            onclick={() => copyToClipboard(`[mcp_servers.paperhub]
url = "https://mcp-paperhub.tferrer.dev/mcp"
transport = "http"

[mcp_servers.paperhub.headers]
X-Api-Key = "\${PAPERHUB_MCP_APIKEY}"`, 5)}
          >
            {#if copiedIndex === 5}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>

        <p><strong>Restart Windsurf to enable MCP.</strong></p>
      </div>
    </div>

    <!-- ChatGPT -->
    <div class="tool-setup">
      <h3>ChatGPT (with GPTs Custom Actions)</h3>
      <div class="setup-content">
        <p><strong>Create a GPT Custom Action:</strong></p>

        <ol>
          <li>Go to <a href="https://chat.openai.com" target="_blank">chat.openai.com</a> and create a new GPT</li>
          <li>Click "Configure" → "Actions"</li>
          <li>Click "Create new action"</li>
          <li>Set Authentication to "Bearer Token" and use your API key</li>
        </ol>

        <p><strong>OpenAPI Schema:</strong></p>
        <div class="code-snippet">
          <code>{`openapi: 3.1.0
info:
  title: PaperHub MCP
  version: 1.0.0
servers:
  - url: https://mcp-paperhub.tferrer.dev/mcp

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-Api-Key

security:
  - ApiKeyAuth: []

paths:
  /papers:
    get:
      summary: List scientific papers
      responses:
        '200':
          description: List of papers
  
  /notebooks:
    get:
      summary: List notebooks
      responses:
        '200':
          description: List of notebooks
  
  /transcriptions:
    get:
      summary: List transcription groups
      responses:
        '200':
          description: List of transcription groups`}</code>
          <button
            class="copy-code-btn"
            onclick={() => copyToClipboard(`openapi: 3.1.0
info:
  title: PaperHub MCP
  version: 1.0.0
servers:
  - url: https://mcp-paperhub.tferrer.dev/mcp

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-Api-Key

security:
  - ApiKeyAuth: []

paths:
  /papers:
    get:
      summary: List scientific papers
      responses:
        '200':
          description: List of papers
  
  /notebooks:
    get:
      summary: List notebooks
      responses:
        '200':
          description: List of notebooks
  
  /transcriptions:
    get:
      summary: List transcription groups
      responses:
        '200':
          description: List of transcription groups`, 6)}
          >
            {#if copiedIndex === 6}
              <Check size={16} />
            {:else}
              <Copy size={16} />
            {/if}
          </button>
        </div>

        <p><strong>In the Authentication section:</strong></p>
        <ul>
          <li>Choose "Bearer Token" authentication</li>
          <li>Paste your API key in the token field</li>
          <li>Header: <code>X-Api-Key</code></li>
        </ul>

        <p>Your GPT can now access PaperHub tools and manage your research library!</p>
      </div>
    </div>
  </section>

  <section class="section">
    <h2>MCP Server Details</h2>
    <div class="server-info">
      <p><strong>URL:</strong> <code>https://mcp-paperhub.tferrer.dev/mcp</code></p>
      <p><strong>Transport:</strong> HTTP</p>
      <p><strong>Authentication:</strong> <code>X-Api-Key</code> header</p>
      <p><strong>Environment Variable:</strong> <code>PAPERHUB_MCP_APIKEY</code></p>
    </div>
  </section>

  <section class="section">
    <h2>Testing Your Setup</h2>
    <p>
      Once configured, try asking your AI tool a question like:
    </p>
    <div class="code-snippet">
      <code>"Create a notebook called 'Research Notes' and a post about AI safety"</code>
      <button class="copy-code-btn" onclick={() => copyToClipboard("Create a notebook called 'Research Notes' and a post about AI safety", 7)}>
        {#if copiedIndex === 7}
          <Check size={16} />
        {:else}
          <Copy size={16} />
        {/if}
      </button>
    </div>
    <p>The MCP server will execute the appropriate commands and return the results.</p>

    <p><strong>Troubleshooting:</strong></p>
    <ul>
      <li>Ensure your API key is stored in the <code>PAPERHUB_MCP_APIKEY</code> environment variable</li>
      <li>Verify the header <code>X-Api-Key</code> is set correctly in your configuration</li>
      <li>Check that your API key has "Owner" privilege for full functionality</li>
      <li>Make sure you've restarted your AI tool after configuration changes</li>
    </ul>
  </section>

  <section class="section faq">
    <h2>Frequently Asked Questions</h2>

    <div class="faq-item">
      <h3>Do I need to regenerate my API key for each tool?</h3>
      <p>No! You can use the same API key across all tools. Each key has a name for your reference.</p>
    </div>

    <div class="faq-item">
      <h3>Can I limit what each AI tool can do?</h3>
      <p>
        Yes. When creating an API key, you can choose between "Owner" (full access) and "Viewer" (read-only) privileges.
      </p>
    </div>

    <div class="faq-item">
      <h3>What if I lose my API key?</h3>
      <p>
        Create a new key and delete the old one. Keys are displayed once when created, so save them securely.
      </p>
    </div>

    <div class="faq-item">
      <h3>Is there a Docker setup?</h3>
      <p>
        Yes. Use the official PaperHub MCP server Docker image and pass environment variables for API credentials.
      </p>
    </div>

    <div class="faq-item">
      <h3>Can I restrict MCP access by IP address?</h3>
      <p>Not at the MCP level, but you should run your MCP server behind a firewall or VPN.</p>
    </div>
  </section>
</div>

<style>
  .page {
    max-width: 900px;
    margin: 0 auto;
    padding: 0;
  }

  .page-header {
    margin-bottom: 40px;
  }

  .page-header h1 {
    font-size: 2rem;
    margin: 0 0 8px 0;
    font-weight: 400;
  }

  .page-subtitle {
    color: var(--color-text-secondary);
    font-size: 1.05rem;
    margin: 0;
  }

  section {
    margin-bottom: 40px;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 16px;
    margin-top: 0;
  }

  h3 {
    font-size: 1.1rem;
    font-weight: 500;
    margin: 16px 0 8px 0;
  }

  p {
    line-height: 1.6;
    color: var(--color-text-primary);
    margin: 0 0 12px 0;
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  ul, ol {
    margin: 0;
    padding-left: 24px;
    line-height: 1.8;
  }

  li {
    margin-bottom: 6px;
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin: 20px 0;
  }

  .tool-card {
    background: var(--color-surface-1);
    border: 1px solid var(--color-surface-3);
    border-radius: 8px;
    padding: 16px;
  }

  .tool-card h3 {
    margin-top: 0;
    color: var(--color-primary);
    font-size: 1rem;
  }

  .tool-card ul {
    font-size: 0.9rem;
    padding-left: 20px;
  }

  .tool-card li {
    margin-bottom: 4px;
    color: var(--color-text-secondary);
  }

  .setup-guide {
    background: var(--color-surface-1);
    border-left: 3px solid var(--color-primary);
    padding: 20px;
    border-radius: 6px;
    margin: 20px 0;
  }

  .setup-step {
    margin-bottom: 24px;
  }

  .setup-step:last-child {
    margin-bottom: 0;
  }

  .setup-step h3 {
    margin-top: 0;
    color: var(--color-primary);
  }

  .tool-setup {
    background: var(--color-surface-0);
    border: 1px solid var(--color-surface-3);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .tool-setup h3 {
    margin-top: 0;
    color: var(--color-text-primary);
  }

  .setup-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .code-block {
    background: var(--color-surface-2);
    border: 1px solid var(--color-surface-3);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 0.8125rem;
    font-family: monospace;
    word-break: break-all;
    position: relative;
    margin: 8px 0;
  }

  .code-block.windows::before,
  .code-block.mac::before {
    content: attr(data-os);
    position: absolute;
    top: -20px;
    left: 0;
  }

  .os-label {
    font-size: 0.7rem;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  .code-path {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
  }

  .code-snippet {
    position: relative;
    background: var(--color-surface-2);
    border: 1px solid var(--color-surface-3);
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    margin: 8px 0;
  }

  .code-snippet code {
    display: block;
    font-family: monospace;
    font-size: 0.8125rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: var(--color-text-primary);
  }

  .copy-code-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--color-surface-3);
    border: 1px solid var(--color-surface-3);
    border-radius: 4px;
    padding: 4px;
    cursor: pointer;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-standard);
  }

  .copy-code-btn:hover {
    background: var(--color-primary);
    color: white;
  }

  .faq {
    background: var(--color-surface-1);
    border-left: 3px solid var(--color-primary);
    padding: 24px;
    border-radius: 6px;
  }

  .faq-item {
    margin-bottom: 20px;
  }

  .faq-item:last-child {
    margin-bottom: 0;
  }

  .faq-item h3 {
    margin-top: 0;
    color: var(--color-primary);
    font-size: 1rem;
  }

  .faq-item p {
    margin-bottom: 0;
    font-size: 0.95rem;
  }

  .server-info {
    background: var(--color-surface-1);
    border: 1px solid var(--color-primary);
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
  }

  .server-info p {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .server-info p:last-child {
    margin-bottom: 0;
  }

  .server-info strong {
    color: var(--color-primary);
    min-width: 140px;
  }

  .server-info code {
    background: var(--color-surface-2);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.85rem;
  }

  @media (max-width: 640px) {
    .page-header h1 {
      font-size: 1.5rem;
    }

    h2 {
      font-size: 1.25rem;
    }

    h3 {
      font-size: 1rem;
    }

    .tools-grid {
      grid-template-columns: 1fr;
    }

    .code-snippet {
      font-size: 0.75rem;
    }

    .copy-code-btn {
      width: 28px;
      height: 28px;
    }
  }
</style>
