import { describe, expect, it } from "bun:test";
import { createLock, type LockOptions, type Release } from "../src/lock";

const options: LockOptions = { timeout: 200 };

describe("locking mechanism", () => {
  it("locks and unlocks", async () => {
    const lock = createLock(options);

    const release = await lock.aquire();
    release();

    await lock.aquire();
  });

  it("notifies next in queue when unlocking", async () => {
    const lock = createLock(options);

    const release = await lock.aquire();
    setTimeout(release, 100);

    await lock.aquire();
  });

  it("resolves in parallel", async () => {
    const lock = createLock(options);

    function handle(release: Release) {
      setTimeout(release, 20);
    }

    await Promise.all([
      lock.aquire().then(handle),
      lock.aquire().then(handle),
      lock.aquire().then(handle),
    ]);
  });

  it("runs into timeout", async () => {
    const lock = createLock(options);

    expect(async () => {
      const release = await lock.aquire();
      setTimeout(release, 500);

      await lock.aquire();
    }).toThrow("timeout reached");
  });
});
