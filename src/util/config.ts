import {
  configFilename,
  defaultConfig,
  fullConfig,
  configSchema,
  possibleAssets,
} from "../conf/config";
import * as fse from "fs-extra";
import * as path from "path";
import * as yaml from "yaml";
import * as chalk from "chalk";
import * as glob from "glob";
import * as slugify from "slugify";

export async function createConfigFile(dir: string, full: boolean) {
  if (!fse.existsSync(dir)) return console.error(`"${dir}" does not exist!`);
  if (!fse.statSync(dir).isDirectory())
    return console.error(`"${dir}" is not a directory!`);

  let config = defaultConfig;
  if (full) config = fullConfig;

  config.name = path.basename(dir);
  config.assets = await autoGenerateAssets(dir);

  if (full)
    // @ts-ignore
    config.shortname = path.basename(dir);

  const raw = yaml.stringify(config);
  fse.writeFileSync(path.join(dir, configFilename), raw, "utf8");

  console.log(
    `✔️ Created LÖVE Packager config file: ${chalk.gray(configFilename)}`
  );
}

async function autoGenerateAssets(root: string) {
  const assets: string[] = [];
  for (let i = 0; i < possibleAssets.length; i++) {
    const pattern = possibleAssets[i];
    if (await globHasMatches(root, pattern)) assets.push(pattern);
  }
  return assets;
}

function globHasMatches(root: string, pattern: string) {
  return new Promise<boolean>((res, rej) => {
    glob(pattern, { root }, (err, matches) => {
      if (err) return rej(err);
      res(matches.length > 0);
    });
  });
}

export function getConfigDir(input: string) {
  if (!input) return process.cwd();
  else if (path.isAbsolute(input)) return input;
  return path.join(process.cwd(), input);
}

function getConfigPath() {
  return path.join(process.cwd(), configFilename);
}

export function checkConfig() {
  if (!fse.existsSync(getConfigPath())) {
    console.error(
      `${configFilename} does not exists! Use ${chalk.gray(
        "love-packager init"
      )} to create it.`
    );
    process.exit(1);
  }
}

export function readConfig(checked = false) {
  if (!checked) checkConfig();
  const raw = fse.readFileSync(getConfigPath(), "utf8");
  const config = yaml.parse(raw);
  const validation = configSchema.validate(config);

  if (validation.error) {
    console.error(
      `Error in ${configFilename}:`,
      validation.error.details[0].message
    );
    process.exit(1);
  } else if (validation.warning) {
    console.warn(
      `Warning in ${configFilename}:`,
      validation.warning.details[0].message
    );
  }

  if (!validation.value.shortname)
    validation.value.shortname = slugify.default(validation.value.name);
  return validation.value;
}
