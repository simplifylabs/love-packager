import { Command, Flags } from "@oclif/core";
import { configFilename } from "../conf/config";
import { createConfigFile, getConfigDir } from "../util/config";

export default class Init extends Command {
  static aliases = ["config"];
  static description = `Create a ${configFilename} file`;

  static examples = [
    "npx love-packager init",
    "npx love-packager init --full",
    "npx love-packager init ~/dev/project",
  ];

  static flags = {
    full: Flags.boolean(),
  };

  static args = [{ name: "path", required: false }];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Init);

    const path = getConfigDir(args.path);
    const full = flags.full ?? false;

    createConfigFile(path, full);
  }
}
