import type { AstroIntegration } from "astro";
import "htmx.org/dist/htmx";

const script = /* javascript */ `
import mustache from 'mustache'

window.htmx.defineExtension("mustache", {
    init: (htmxApi) => {
      function resolveOperation(input) {
        if (typeof input !== "string") return input;
        const operation = input.slice(0, 2);
        const value = Number.parseInt(input.slice(2));

        switch (operation) {
          case "++":
            return value + 1;
          case "--":
            return value - 1;
          default:
            return input;
        }
      }

      function getData(element) {
        const encoded = element.getAttribute("hx-data");
        if (!encoded) return {};
        return JSON.parse(encoded);
      }

      function initialize(element) {
        const templateId = element.getAttribute("hx-template");
        const templateElement = document.getElementById(templateId);

        if (!templateElement) {
          console.warn('unable to find template with ID', templateId);
          return;
        }

        element.addEventListener("click", (event) => {
          event.preventDefault();

          const target = htmxApi.getTarget(element);
          const template = templateElement.innerHTML;
          const data = getData(element);
          const resolvedData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
              key,
              resolveOperation(value),
            ]),
          );

          const rendered = mustache.render(template, resolvedData);

          const parentNode = target.parentNode;

          const swapSpec = htmxApi.getSwapSpecification(element);
          htmxApi.swap(target, rendered, swapSpec);
          if (parentNode) check(parentNode);
        });
      }

      function check(element) {
        element.querySelectorAll("[hx-template]").forEach(initialize);
      }

      check(document);
    },
  });
`;

export default <AstroIntegration>{
  name: "mustache",
  hooks: {
    "astro:config:setup": ({ injectScript }) => {
      injectScript("page", script);
    },
  },
};
