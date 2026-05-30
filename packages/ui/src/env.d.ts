declare namespace App {
  interface Locals {
    origin: string;
    octokit: import("octokit").Octokit;
    api: import("./lib/api").ApiClient;
  }
}

type BeforeSwapEvent = Event & {
  detail: import("htmx.org").HtmxResponseInfo & {
    swapOverride?: string;
  };
};

type BeforeOnLoadEvent = Event & {
  detail: import("htmx.org").HtmxResponseInfo;
};

interface HTMLElementEventMap {
  "htmx:beforeSwap": BeforeSwapEvent;
  "htmx:beforeOnLoad": BeforeOnLoadEvent;
}

interface Window {
  mustache: import("mustache");
  htmx: import("htmx.org");
}
