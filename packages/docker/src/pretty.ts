import type { ContainerInfo } from "dockerode";

export type ContainerDisplay = {
  name: string;
  link: string;
  url?: string;
};

export function prettyInfo({ Labels, Names }: ContainerInfo): ContainerDisplay {
  const name =
    Labels["display_name"] || Labels["homepage.name"] || Names[0]!.substring(1);
  const url = Labels["display_url"] || Labels["homepage.href"];
  const link = url ? `[${name}](${url})` : name;

  return { name, url, link };
}
