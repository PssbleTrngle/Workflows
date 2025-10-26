import { describe, expect, it } from "bun:test";
import { generateWithConfig } from "../src";
import { loadConfigFixture } from "./fixtures";
import createTestAcceptor from "./testAcceptor";

describe("minecraft workflow generation", () => {
  it("generates workflows without sonar", async () => {
    const config = await loadConfigFixture(
      "minecraft",
      "configWithLoaders.json"
    );

    const acceptor = createTestAcceptor();

    await generateWithConfig(config, acceptor);

    expect(acceptor.count()).toBe(5);
    acceptor.expect(".github/workflows/sonar.yml").toBeUndefined();
    acceptor.expect(".github/workflows/release.yml").not.toBeUndefined();
    acceptor.expect(".github/workflows/test.yml").not.toBeUndefined();

    acceptor
      .expect(".github/ISSUE_TEMPLATE/bug_report.yml")
      .not.toBeUndefined();
    acceptor
      .expect(".github/ISSUE_TEMPLATE/feature_request.yml")
      .not.toBeUndefined();

    acceptor.expect(".github/ISSUE_TEMPLATE/config.yml").not.toBeUndefined();
  });

  it("generates workflows with sonar", async () => {
    const config = await loadConfigFixture("minecraft", "configWithSonar.json");

    const acceptor = createTestAcceptor();

    await generateWithConfig(config, acceptor);

    expect(acceptor.count()).toBe(3);
    acceptor.expect(".github/workflows/sonar.yml").not.toBeUndefined();
    acceptor.expect(".github/workflows/release.yml").not.toBeUndefined();
    acceptor.expect(".github/workflows/test.yml").not.toBeUndefined();
  });

  it("generates workflows with uploads", async () => {
    const config = await loadConfigFixture(
      "minecraft",
      "configWithUploads.json"
    );

    const acceptor = createTestAcceptor();

    await generateWithConfig(config, acceptor);

    acceptor
      .expect(".github/workflows/release.yml")
      .toMatchSnapshot("release workflow with all uploads");
  });
});
