export type SemanticVersion = { major: number; minor: number };

export function parseVersion(value: string): SemanticVersion {
  if (value.startsWith("v")) value = value.substring(1);

  const [major, minor] = value.split(".").map((it) => Number.parseInt(it)) as [
    number,
    number,
  ];
  if (Number.isNaN(major) || Number.isNaN(minor))
    throw new Error("invalid schema version format");
  return { major, minor };
}

export function isOudated(
  { major, minor }: SemanticVersion,
  reference: SemanticVersion,
) {
  if (major < reference.major) return true;
  if (major > reference.major) return false;
  return minor < reference.minor;
}
