import { generateInFolder } from "@pssbletrngle/github-meta-generator";
import type { ActionResult } from "../git";
import type { MetadataContext } from "./branches";
import detectProperties from "./detection";

export async function updateMetadataFiles(
  repositoryPath: string,
  context: MetadataContext
): Promise<ActionResult> {
  const config = await detectProperties(repositoryPath, context);

  await generateInFolder(repositoryPath, config);

  return {
    message: "regenerated metadata files",
  };
}
