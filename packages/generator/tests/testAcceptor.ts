import { expect, type Matchers } from "bun:test";
import { join } from "node:path";
import type { Acceptor } from "../src/generator";

interface TestAcceptor extends Acceptor {
  at(...path: string[]): string | undefined;
  expect(...path: string[]): Matchers<string | undefined>;
  count(): number;
  list(): string[];
  expectNothingElse(): void;
}

export default function createTestAcceptor(): TestAcceptor {
  const data = new Map<string, string>();

  const unchecked = new Set<string>();

  const acceptor = (async (path, content) => {
    data.set(path, content);
    unchecked.add(path);
  }) as TestAcceptor;

  acceptor.at = (...path) => data.get(join(...path));
  acceptor.expect = (...path) => {
    unchecked.delete(join(...path));
    return expect(acceptor.at(...path));
  };
  acceptor.count = () => data.size;
  acceptor.list = () => Array.from(data.keys());

  acceptor.expectNothingElse = () => expect(unchecked).toBeEmpty();

  return acceptor;
}
