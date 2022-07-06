import { IPaths, ITarget } from "../conf/targets";
import { exec } from "child_process";
import { join } from "path";
import { zip } from "zip-a-folder";
import { platform } from "os";
import * as fse from "fs-extra";

export default async function packageLove(
  paths: IPaths,
  target: ITarget,
  config: any
) {
  const unpackedDir = join(paths.tmp, "web-unpacked");
  fse.emptydirSync(unpackedDir);

  const nodeModulesPath = await new Promise<string>((res, rej) => {
    exec(`cd ${__dirname} && npm root`, (err, data) => {
      if (err) return rej(err);
      res(data.replace("\n", "").replace("\r", ""));
    });
  });

  const loveJsName = platform() == "win32" ? "love.js.cmd" : "love.js";
  const loveJsPath = join(nodeModulesPath, ".bin", loveJsName);

  await new Promise((res, rej) => {
    exec(
      `${loveJsPath} ${paths.tmpLove} ${unpackedDir} -t "${config.name}" -c`,
      (err) => {
        if (err) return rej(err);
        res(null);
      }
    );
  });

  if (config.icon) {
    fse.copySync(
      join(paths.tmp, "icon", "app.ico"),
      join(unpackedDir, "favicon.ico")
    );
  }

  fse.emptydirSync(join(unpackedDir, "theme"));
  fse.rmdirSync(join(unpackedDir, "theme"));

  const assetsPath = join(__dirname, "..", "..", "assets", "web");
  fse.copySync(assetsPath, unpackedDir);

  const zipPath = join(paths.tmp, `${target.alias}.zip`);
  await zip(unpackedDir, zipPath);
  return zipPath;
}
