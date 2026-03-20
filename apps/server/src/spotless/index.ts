import type { components } from "@octokit/openapi-types";
import type { WebhookEventDefinition } from "@octokit/webhooks/types";
import type { App, Octokit } from "octokit";
import type { GitUser } from "../git";
import logger from "../logger";
import { createGitUser } from "../user";
import runSpotless from "./execute";

function matchesCommand(content: string) {
  return content.trim() === "/spotless";
}

type IssueCommentEvent =
  | WebhookEventDefinition<"issue-comment-created">
  | WebhookEventDefinition<"issue-comment-edited">;

type AuthorAssociation = IssueCommentEvent["comment"]["author_association"];

type PullRequest = components["schemas"]["pull-request"];

const CAN_RUN_COMMAND: AuthorAssociation[] = [
  "COLLABORATOR",
  "MEMBER",
  "OWNER",
];

const enum Reaction {
  THUMBS_UP = "+1",
  THUMBS_DOWN = "-1",
  HOORAY = "hooray",
  EYES = "eyes",
  CONFUSED = "confused",
}

async function react(
  octokit: Octokit,
  user: GitUser,
  { comment, repository }: Pick<IssueCommentEvent, "comment" | "repository">,
  reaction: Reaction,
) {
  const search = {
    repo: repository.name,
    owner: repository.owner.login,
    comment_id: comment.id,
  };
  const { data: existing } =
    await octokit.rest.reactions.listForIssueComment(search);

  await Promise.all(
    existing
      .filter((it) => it.user?.login === user.name)
      .map((it) =>
        octokit.rest.reactions.deleteForIssueComment({
          ...search,
          reaction_id: it.id,
        }),
      ),
  );

  await octokit.rest.reactions.createForIssueComment({
    ...search,
    content: reaction,
  });
}

async function handleEvent(
  { issue, comment, repository, installation }: IssueCommentEvent,
  octokit: Octokit,
) {
  if (!installation) return;
  if (!issue.pull_request) return;
  if (issue.state !== "open") return;
  if (!matchesCommand(comment.body)) return;
  if (!CAN_RUN_COMMAND.includes(comment.author_association)) return;

  const user = await createGitUser({ repository, installation, octokit });

  const { data: pullRequest } = (await octokit.request(
    `GET ${issue.pull_request.url}`,
  )) as { data: PullRequest };

  if (
    !pullRequest.maintainer_can_modify &&
    pullRequest.head.repo.id !== pullRequest.base.repo.id
  ) {
    await react(octokit, user, { comment, repository }, Reaction.CONFUSED);
    return;
  }

  await react(octokit, user, { comment, repository }, Reaction.EYES);

  try {
    const commited = await runSpotless(repository, pullRequest.head.ref, user);

    if (commited) {
      await react(octokit, user, { comment, repository }, Reaction.THUMBS_UP);
      logger.info("<- fixed code with spotless apply");
    } else {
      await react(octokit, user, { comment, repository }, Reaction.THUMBS_DOWN);
      logger.info("<- no changes to be fixed by spotless");
    }
  } catch (e) {
    logger.error("<- error occured when running spotless");
    await react(octokit, user, { comment, repository }, Reaction.CONFUSED);
    throw e;
  }
}

export function registerSpotlessHooks(hooks: App["webhooks"]) {
  hooks.on("issue_comment.created", ({ payload, octokit }) =>
    handleEvent(payload, octokit),
  );

  hooks.on("issue_comment.edited", async ({ payload, octokit }) => {
    if (payload.changes.body?.from === payload.comment.body) return;
    await handleEvent(payload, octokit);
  });
}
