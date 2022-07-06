import { getAITool, getBinary } from "./binary";
import { readConfig } from "./config";
import { ITarget, IPaths } from "../conf/targets";
import { zip } from "zip-a-folder";
import { join } from "path";
import * as fse from "fs-extra";
import * as os from "os";
import * as icongen from "icon-gen";

import packageLove from "../targets/love";
import packageWeb from "../targets/web";
import packageWin from "../targets/windows";
import packageLinux from "../targets/linux";
import packageMac from "../targets/mac";

const copy = require("copy");
const Spinnies = require("spinnies");

export async function packageAll(targets: ITarget[]) {
  const spinnies = new Spinnies({
    succeedColor: "white",
    color: "gray",
  });

  try {
    const config = readConfig();
    const paths: IPaths = {
      out: join(process.cwd(), config.output, config.version),
      tmp: join(os.tmpdir(), "love-packager"),
      tmpLove: "",
      tmpDir: "",
      binary: "",
    };

    fse.emptydirSync(paths.tmp);
    fse.emptydirSync(paths.out);

    if (config.icon) {
      if (!fse.existsSync(join(process.cwd(), config.icon || "")))
        throw `Specified icon "${config.icon}" doesn't exist!`;

      const inputPath = join(process.cwd(), config.icon || "");
      const outputPath = join(paths.tmp, "icon");
      fse.emptydirSync(outputPath);

      // @ts-ignore
      await icongen(inputPath, outputPath, {
        report: false,
        icns: {},
        ico: {},
      });
    }

    for (let i = 0; i < targets.length; i++) {
      await getBinary(targets[i]);

      if (targets[i].alias == "linux") await getAITool();
    }

    paths.tmpLove = await createLoveFile(config, paths);

    await Promise.all([
      ...targets.map((target) =>
        packageSingle(spinnies, config, paths, target)
      ),
    ]).then(() => {
      fse.removeSync(paths.tmp);
    });
  } catch (e) {
    spinnies.stopAll("fail");
    console.error(e);
    process.exit(1);
  }
}

async function packageSingle(
  spinnies: any,
  config: any,
  paths: IPaths,
  target: ITarget
) {
  spinnies.add(target.alias, {
    text: `Packaging ${target.name}...`,
  });

  try {
    paths = { ...paths };
    paths.binary = await getBinary(target);

    if (target.binary) {
      paths.tmpDir = join(paths.tmp, target.alias);
      fse.emptydirSync(paths.tmpDir);
    }

    if (target.binary) fse.copySync(paths.binary, paths.tmpDir);

    let packagePath = "";
    let outName = target.outputFormat;

    switch (target.alias) {
      case "love":
        packagePath = await packageLove(paths);
        break;
      case "web":
        packagePath = await packageWeb(paths, target, config);
        break;
      case "mac":
        packagePath = await packageMac(paths, target, config);
        break;
      case "linux":
        packagePath = await packageLinux(paths, target, config);
        break;
      default:
        packagePath = await packageWin(paths, target, config);
        break;
    }

    outName = outName.replace("{NAME}", config.name);
    outName = outName.replace("{VERSION}", config.version);

    const outPath = join(paths.out, outName);
    fse.copySync(packagePath, outPath);

    spinnies.succeed(target.alias, {
      text: `Packaged ${target.name}`,
    });
  } catch (e) {
    if (spinnies.spinners[target.alias])
      spinnies.fail(target.alias, {
        text: `Failed to package ${target.name}:\n\t${String(e)}`,
      });
  }
}

async function createLoveFile(config: any, paths: IPaths) {
  return new Promise<string>((res, rej) => {
    const tmpLoveDir = join(paths.tmp, "love-unpacked");
    fse.emptydirSync(tmpLoveDir);

    copy(config.assets, tmpLoveDir, async (err: any) => {
      if (err) return rej(err);

      const tmpZipPath = join(paths.tmp, "love-unpacked.zip");
      const error = await zip(tmpLoveDir, tmpZipPath);
      if (error) return rej(error);

      const loveFilePath = join(paths.tmp, "app.love");
      fse.moveSync(tmpZipPath, loveFilePath);

      fse.removeSync(tmpLoveDir);
      res(loveFilePath);
    });
  });
}

export function replaceInFile(
  path: string,
  replacements: [string | RegExp, string][]
) {
  let text = fse.readFileSync(path, "utf8");
  replacements.forEach((replacement) => {
    text = text.replace(replacement[0], replacement[1]);
  });
  fse.writeFileSync(path, text);
}
