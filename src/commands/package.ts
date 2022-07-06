import { Command, Flags } from "@oclif/core";
import { getTargets } from "../util/target";
import { packageAll } from "../util/package";
import { aliases } from "../conf/targets";

export default class Init extends Command {
  static strict = false;
  static aliases = ["build", "dist"];
  static description = "Package the project";

  static examples = [
    "npx love-packager package",
    "npx love-packager package all",
    `npx love-packager package ${aliases[0]} ${aliases[1]}`,
  ];

  static flags = {
    all: Flags.boolean(),
  };

  static args = [
    {
      name: "targets...",
      optional: true,
      options: [...aliases, "all"],
    },
  ];

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init);
    const targets = getTargets(this.argv, flags.all);
    packageAll(targets);
  }
}
