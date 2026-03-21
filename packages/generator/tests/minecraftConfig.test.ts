import { describe, it } from "bun:test";
import { generateWithConfig } from "../src";
import { loadConfigFixture } from "./fixtures";
import mockContext from "./providers/context";
import createTestAcceptor from "./testAcceptor";

describe("minecraft workflow generation", () => {
  it("generates workflows without sonar", async () => {
    const config = await loadConfigFixture(
      "minecraft",
      "configWithLoaders.json",
    );

    const acceptor = createTestAcceptor();

    await generateWithConfig(mockContext(config), acceptor);

    acceptor.expect(".github/labeler.yml").not.toBeUndefined();
    acceptor.expect(".github/workflows/release.yml").not.toBeUndefined();
    acceptor.expect(".github/workflows/test.yml").not.toBeUndefined();
    acceptor.expect(".github/workflows/labeler.yml").not.toBeUndefined();

    acceptor
      .expect(".github/ISSUE_TEMPLATE/bug_report.yml")
      .not.toBeUndefined();
    acceptor
      .expect(".github/ISSUE_TEMPLATE/feature_request.yml")
      .not.toBeUndefined();

    acceptor.expect(".github/ISSUE_TEMPLATE/config.yml").not.toBeUndefined();
    acceptor.expect("LICENSE.md").not.toBeUndefined();

    acceptor.expectNothingElse();
  });

  it("generates workflows with sonar", async () => {
    const config = await loadConfigFixture("minecraft", "configWithSonar.json");

    const acceptor = createTestAcceptor();

    await generateWithConfig(mockContext(config), acceptor);

    acceptor.expect(".github/labeler.yml").not.toBeUndefined();
    acceptor.expect(".github/workflows/release.yml").not.toBeUndefined();
    acceptor.expect(".github/workflows/test.yml").not.toBeUndefined();
    acceptor.expect(".github/workflows/labeler.yml").not.toBeUndefined();
    acceptor.expect("LICENSE.md").not.toBeUndefined();

    acceptor.expectNothingElse();
  });

  it("generates workflows with uploads", async () => {
    const config = await loadConfigFixture(
      "minecraft",
      "configWithUploads.json",
    );

    const acceptor = createTestAcceptor();

    await generateWithConfig(mockContext(config), acceptor);

    acceptor
      .expect(".github/workflows/release.yml")
      .toMatchSnapshot("release workflow with all uploads");
  });
});
