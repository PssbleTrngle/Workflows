import refresh from "./refresh";
import setup from "./setup";

const command = process.argv[2];

try {
  if (command === "setup") await setup();
  else if (command === "refresh") await refresh();
  else throw new Error(`unknown command '${command}'`);
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
  }
  process.exit(1);
}
