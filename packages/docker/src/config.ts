const socketPath = process.env.SOCKET_PATH || "/var/run/docker.sock";
const failingStreak = Number.parseInt(process.env.FAILING_STREAK ?? "10");

export default {
  failingStreak,
  socketPath,
};
