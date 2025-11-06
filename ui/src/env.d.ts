declare namespace App {
  interface Locals {
    origin: string;
    octokit: import("octokit").Octokit;
    api: import("./lib/api").ApiClient;
  }
}
