import type { AstroIntegration } from "astro";

const libs = ["htmx.org", "htmx-ext-json-enc", "htmx-ext-sse"];

const imports = libs.map((it) => `import '${it}'`);

const hooks = /* typescript */ `
document.body.addEventListener("htmx:beforeSwap", ({ detail }) => {
  const override =
    detail.requestConfig.elt.getAttribute("hx-target-override");

  if (override && document.querySelector(override)) {
    detail.swapOverride = override;
  }
});

console.log('HTMX', htmx_0)
`;

export default <AstroIntegration>{
  name: "htmx",
  hooks: {
    "astro:config:setup": ({ injectScript }) => {
      injectScript("page", [...imports, hooks].join("\n"));
    },
  },
};
