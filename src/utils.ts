import { readdir } from "node:fs/promises";

export const readEnvFiles = async () => {
  const items = await readdir(process.cwd(), { withFileTypes: true });
  const files = items
    .filter((item) => !item.isDirectory())
    .map((file) => file.name);

  return files.filter((fileName) => fileName.startsWith(".env"));
};
