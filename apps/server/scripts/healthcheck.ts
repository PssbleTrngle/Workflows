const port = Number.parseInt(process.env.PORT || "8080");

if (Number.isNaN(port)) throw new Error(`invalid port '${port}'`);

const response = await fetch(`http://localhost:${port}/status`);

if (!response.ok) throw new Error(response.statusText);

type Status = {
  running: boolean;
};

const status = (await response.json()) as Status;

if (status.running !== true) throw new Error("server is not running");
