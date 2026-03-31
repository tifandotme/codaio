import { join } from "node:path";
import { homedir } from "node:os";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";

interface CodaConfig {
  token?: string;
}

const CONFIG_DIR_NAME = "codaio";

function getConfigDir(dirName = CONFIG_DIR_NAME): string {
  return join(homedir(), ".config", dirName);
}

function getConfigPath(dirName = CONFIG_DIR_NAME): string {
  return join(getConfigDir(dirName), "config.json");
}

async function readConfig(): Promise<CodaConfig> {
  const path = getConfigPath();
  if (!(await pathExists(path))) return {};

  try {
    return JSON.parse(await readFile(path, "utf8")) as CodaConfig;
  } catch {
    return {};
  }
}

async function writeConfig(config: CodaConfig): Promise<void> {
  await mkdir(getConfigDir(), { recursive: true });
  await writeFile(getConfigPath(), JSON.stringify(config, null, 2), "utf8");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function getToken(): Promise<string | undefined> {
  // Env var takes priority
  if (process.env.CODA_API_TOKEN) {
    return process.env.CODA_API_TOKEN;
  }
  const config = await readConfig();
  return config.token;
}

export async function saveToken(token: string): Promise<void> {
  const config = await readConfig();
  config.token = token;
  await writeConfig(config);
}

export async function removeToken(): Promise<void> {
  const config = await readConfig();
  delete config.token;
  await writeConfig(config);
}

export async function requireToken(): Promise<string> {
  const token = await getToken();
  if (!token) {
    console.error(
      "No API token found. Run 'codaio login' or set the CODA_API_TOKEN environment variable."
    );
    process.exit(1);
  }
  return token;
}
