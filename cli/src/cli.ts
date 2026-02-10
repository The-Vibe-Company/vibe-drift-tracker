import { init, installClaudeCodeHooks } from "./init";

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`Usage: vibedrift <command>

Commands:
  init [options]         Install hooks in the current repo
    --api-url URL        Dashboard API URL (default: http://localhost:3000)
    --api-key KEY        API key for authentication (from dashboard settings)
    --global             Install Claude Code hooks globally
  uninstall [--global]   Remove all VibeDrift hooks
`);
}

async function main() {
  const hasGlobal = args.includes("--global");

  switch (command) {
    case "init": {
      let apiUrl: string | undefined;
      const apiUrlIndex = args.indexOf("--api-url");
      if (apiUrlIndex !== -1 && args[apiUrlIndex + 1]) {
        apiUrl = args[apiUrlIndex + 1];
      }
      let apiKey: string | undefined;
      const apiKeyIndex = args.indexOf("--api-key");
      if (apiKeyIndex !== -1 && args[apiKeyIndex + 1]) {
        apiKey = args[apiKeyIndex + 1];
      }
      await init(apiUrl, apiKey);
      await installClaudeCodeHooks({ global: hasGlobal });
      break;
    }
    case "uninstall": {
      const { uninstall, uninstallClaudeCodeHooks } = await import("./init");
      await uninstall();
      await uninstallClaudeCodeHooks({ global: hasGlobal });
      break;
    }
    default:
      printUsage();
      process.exit(command ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
