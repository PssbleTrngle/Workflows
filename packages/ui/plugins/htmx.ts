import type { AstroIntegration } from "astro";
import "htmx.org/dist/htmx";

const script = /* javascript */ `
// TODO waiting for https://github.com/bigskysoftware/htmx-extensions/issues/128
// import 'htmx.org';
// import 'htmx-ext-sse';
// import 'htmx-ext-form-json';

document.body.addEventListener("htmx:beforeSwap", ({ detail }) => {
  const override =
    detail.requestConfig.elt.getAttribute("hx-target-override");

  if (override && document.querySelector(override)) {
    detail.swapOverride = override;
  }
});

document.body.addEventListener("htmx:beforeOnLoad", ({ detail }) => {
  const method =
    detail.requestConfig.elt.getAttribute("method");

    if(method === "dialog") {
       const dialog = detail.requestConfig.elt.closest('dialog');
       if(dialog) {
        dialog.close();
       }
    }
  });
`;

export default <AstroIntegration>{
  name: "htmx",
  hooks: {
    "astro:config:setup": ({ injectScript }) => {
      injectScript("page", script);
    },
  },
};
