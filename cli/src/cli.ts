import { init } from "./init";

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`Usage: vibedrift <command>

Commands:
  init [--api-url URL]   Install the post-commit hook in the current repo
  uninstall              Remove the VibeDrift post-commit hook
`);
}

async function main() {
  switch (command) {
    case "init": {
      let apiUrl: string | undefined;
      const apiUrlIndex = args.indexOf("--api-url");
      if (apiUrlIndex !== -1 && args[apiUrlIndex + 1]) {
        apiUrl = args[apiUrlIndex + 1];
      }
      await init(apiUrl);
      break;
    }
    case "uninstall": {
      const { uninstall } = await import("./init");
      await uninstall();
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
