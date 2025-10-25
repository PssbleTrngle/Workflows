import { createServer } from "node:http";
import githubMiddleware from "./github";

const server = createServer(githubMiddleware);

server.listen(3000, undefined, () => {
  console.log("server online");
});
