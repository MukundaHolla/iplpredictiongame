"use server";

import { revalidatePath } from "next/cache";

import { APP_PATHS_TO_REVALIDATE } from "@/lib/constants";

export async function revalidateAppPaths(extraPaths: string[] = []) {
  const paths = new Set([...APP_PATHS_TO_REVALIDATE, ...extraPaths]);

  for (const path of paths) {
    revalidatePath(path);
  }
}
