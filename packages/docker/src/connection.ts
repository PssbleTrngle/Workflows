import Dockerode from "dockerode";
import config from "./config";

const docker = new Dockerode(config);

console.log(`connecting to docker at ${config.socketPath}`);

export default docker;
