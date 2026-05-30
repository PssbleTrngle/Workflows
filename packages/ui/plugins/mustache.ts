import type { AstroIntegration } from "astro";
import "htmx.org/dist/htmx";

const script = /* typescript */ `
import mustache from 'mustache'

window.mustache = mustache
`;

export default <AstroIntegration>{
  name: "mustache",
  hooks: {
    "astro:config:setup": ({ injectScript }) => {
      injectScript("page", script);
    },
  },
};
