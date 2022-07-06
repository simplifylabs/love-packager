import availableTargets, { ITarget } from "../conf/targets";
import { readConfig } from "./config";
import * as os from "os";
import * as chalk from "chalk";

export function getTargets(input: string[], all?: boolean) {
  validateAliases(input);
  const config = readConfig();
  let targets: ITarget[] = [];

  if (all || input.includes("all")) targets = availableTargets;
  else if (input.length > 0) {
    targets = getTargetsByAlias(input);
  } else {
    if (config.targets) targets = getTargetsByAlias(config.targets);
    else targets = availableTargets;
  }

  targets = targets.filter(({ alias, name }) => {
    const match = availableTargets.find(
      (available) => available.alias == alias
    );

    if (!match) {
      console.error(`${alias} is not a valid target!`);
      process.exit(1);
    }

    if (!isSupported(match)) {
      console.warn(
        `${chalk.yellow(
          "[Warn]"
        )} ${name} can not be built from ${getPlatformName()}`
      );
      return false;
    }

    return true;
  });

  return targets;
}

function getPlatformName() {
  switch (os.platform()) {
    case "win32":
      return "Windows";
    case "darwin":
      return "MacOS";
    case "android":
      return "Android";
    default:
      return "Linux";
  }
}

function getTargetsByAlias(aliases: string[]) {
  return availableTargets.filter((t) => aliases.includes(t.alias));
}

function validateAliases(aliases: string[]) {
  aliases.forEach((alias) => {
    if (alias == "all") return;
    const found = availableTargets.find((entry) => entry.alias == alias);
    if (!found) {
      console.error(`${alias} is not a valid target!`);
      process.exit(1);
    }
  });
}

function isSupported(target: ITarget | string) {
  if (typeof target == "string") {
    const found = availableTargets.find((entry) => entry.alias == target);
    if (!found) {
      console.error(`${target} is not a valid target!`);
      process.exit(1);
    }
    target = found;
  }

  if (!target.supported) return true;
  return target.supported.includes(os.platform());
}
