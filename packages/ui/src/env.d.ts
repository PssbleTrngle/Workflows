declare namespace App {
  interface Locals {
    origin: string;
    octokit: import("octokit").Octokit;
    api: import("./lib/api").ApiClient;
  }
}

type BeforeSwapEvent = Event & {
  detail: HtmxResponseInfo & {
    swapOverride?: string;
  };
};

interface HTMLElementEventMap {
  "htmx:beforeSwap": BeforeSwapEvent;
}
