import type { AbstractModrinthClient } from "@modrinth/api-client";
import type { Octokit } from "octokit";
import { format } from "prettier";
import { template } from "../dist/template";
import type { Contributor, ContributorsConfig } from "./config";

export type Apis = {
  octokit?: Octokit;
  modrinth?: AbstractModrinthClient;
};

type Link = {
  icon: string;
  name: string;
  url: string;
};

type PopulatedContributor = {
  name: string;
  description?: string;
  avatar?: string;
  links: Link[];
};

function platformName(
  name: string,
  platformName: string | boolean | undefined,
) {
  if (!platformName) return undefined;

  if (typeof platformName === "string") {
    return platformName;
  }

  return name;
}

function badgeIcon(type: string) {
  return `https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3/assets/cozy-minimal/available/${type}_vector.svg`;
}

async function populateContributor(
  { name, description, ...contributor }: Contributor,
  { octokit, modrinth }: Apis,
): Promise<PopulatedContributor> {
  let avatar = contributor.avatar;
  const githubUser = platformName(name, contributor.github);
  const modrinthUser = platformName(name, contributor.modrinth);
  const curseforgeUser = platformName(name, contributor.curseforge);

  const links: Link[] = [];

  if (modrinthUser) {
    if (modrinth && !avatar) {
      const data = await modrinth.labrinth.users_v3.get(modrinthUser);
      avatar = data.avatar_url;
    }

    links.push({
      icon: badgeIcon("modrinth"),
      name: "Modrinth",
      url: `https://modrinth.com/user/${modrinthUser}`,
    });
  }

  if (githubUser) {
    if (!avatar && octokit) {
      const { data } = await octokit.rest.users.getByUsername({
        username: githubUser,
      });

      avatar = data.avatar_url;
    }

    links.push({
      icon: badgeIcon("github"),
      name: "GitHub",
      url: `https://github.com/${githubUser}`,
    });
  }

  if (curseforgeUser) {
    links.push({
      icon: badgeIcon("curseforge"),
      name: "CurseForge",
      url: `https://www.curseforge.com/members/${curseforgeUser}`,
    });
  }

  return { avatar, name, links, description };
}

export async function generateContributorsTable(
  { perRow, contributors }: ContributorsConfig,
  apis: Apis = {},
) {
  const rows: Contributor[][] = [[]];

  for (let i = 0; i < contributors.length; i++) {
    let lastRow = rows.at(-1)!;
    if (lastRow.length === perRow) {
      lastRow = [];
      rows.push(lastRow);
    }

    const populated = await populateContributor(contributors[i]!, apis);
    lastRow.push(populated);
  }

  return await format(template({ rows }), { parser: "html" });
}
