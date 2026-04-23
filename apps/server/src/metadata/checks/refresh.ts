import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import { createGitUser } from "../../user";
import type { InstallationContext } from "../auth";
import generateMetadata from "../generator";

export default async function refresh(
  subject: RepoSearchWithBranch,
  context: InstallationContext,
) {
  const user = await createGitUser(context);

  return await generateMetadata(
    subject,
    context.repository.clone_url,
    context.octokit,
    user,
  );
}
