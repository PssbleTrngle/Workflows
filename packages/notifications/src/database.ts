import { NotifierRepository } from "@pssbletrngle/workflows-persistance";

// TODO use logger
const repository = new NotifierRepository(console);

export async function readFromDatabase(types: string[]): Promise<string[]> {
  const notifiers = await repository.findAll();
  console.log(notifiers);

  return [];
}
