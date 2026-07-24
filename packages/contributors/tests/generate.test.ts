import { expect, it } from "bun:test";
import { Octokit } from "octokit";
import { generateContributorsTable, type ContributorsConfig } from "../src";

const octokit = {} as Octokit;

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

  const generated = await generateContributorsTable(config, octokit);

  expect(generated).toMatchSnapshot();
});
