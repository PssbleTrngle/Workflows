import Dockerode from "dockerode";
import config from "./config";

const docker = new Dockerode(config);

export default docker;
