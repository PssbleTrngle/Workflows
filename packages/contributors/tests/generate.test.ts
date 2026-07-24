import { expect, it } from "bun:test";
import { generateContributorsTable, type ContributorsConfig } from "../src";

it("generated wrappes table rows", async () => {
  const config: ContributorsConfig = {
    perRow: 5,
    contributors: [
      {
        name: "PssbleTrngle",
        description: "Author",
        avatar: "https://example/image.png",
      },
    ],
  };

  const generated = await generateContributorsTable(config);

  expect(generated).toMatchSnapshot();
});
