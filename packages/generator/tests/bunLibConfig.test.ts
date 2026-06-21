import { describe, it } from "bun:test";
import { generateWithConfig } from "../src";
import { loadConfigFixture } from "./fixtures";
import mockContext from "./providers/context";
import createTestAcceptor from "./testAcceptor";

describe("bun-lib workflow generation", () => {
  it("generates everything", async () => {
    const config = await loadConfigFixture("bun-library", "config.json");

    const acceptor = createTestAcceptor();

    await generateWithConfig(mockContext(config), acceptor);

    acceptor.expect(".github/workflows/test.yml").toMatchSnapshot("test.yml");
    acceptor
      .expect(".github/workflows/release.yml")
      .toMatchSnapshot("release.yml");
    acceptor
      .expect(".github/workflows/pre-release.yml")
      .toMatchSnapshot("pre-release.yml");
    acceptor
      .expect(".github/workflows/semantic-release.yml")
      .toMatchSnapshot("semantic-release.yml");

    acceptor.expect("tsconfig.json").toMatchSnapshot("tsconfig.json");
    acceptor.expect("tsconfig.test.json").toMatchSnapshot("tsconfig.test.json");

    acceptor.expectNothingElse();
  });

  it("generates no workflows", async () => {
    const config = await loadConfigFixture(
      "bun-library",
      "configWithoutWorkflows.json",
    );

    const acceptor = createTestAcceptor();

    await generateWithConfig(mockContext(config), acceptor);

    acceptor.expect(".github/workflows/test.yml").toBeUndefined();
    acceptor.expect(".github/workflows/release.yml").toBeUndefined();
    acceptor.expect(".github/workflows/pre-release.yml").toBeUndefined();
    acceptor.expect(".github/workflows/semantic-release.yml").toBeUndefined();
  });

  it("generates no tsconfig", async () => {
    const config = await loadConfigFixture(
      "bun-library",
      "configWithoutTsConfig.json",
    );

    const acceptor = createTestAcceptor();

    await generateWithConfig(mockContext(config), acceptor);

    acceptor.expect("tsconfig.json").toBeUndefined();
  });

  it("generates prettier config", async () => {
    const config = await loadConfigFixture(
      "bun-library",
      "configWithPrettier.json",
    );

    const acceptor = createTestAcceptor();

    await generateWithConfig(mockContext(config), acceptor);

    acceptor.expect(".prettierrc.yaml").toMatchSnapshot(".prettierrc");
  });
});
