import { ITarget, IPaths } from "../conf/targets";
import { exec } from "child_process";
import { zip } from "zip-a-folder";
import { join } from "path";
import * as os from "os";
import * as fse from "fs-extra";
import * as rcedit from "rcedit";

export default async function packageWindows(
  paths: IPaths,
  target: ITarget,
  config: any
) {
  const exeName = `${config.name}.exe`;
  fse.copySync(paths.tmpLove, join(paths.tmpDir, "app.love"));

  fse.removeSync(join(paths.tmpDir, "readme.txt"));
  fse.removeSync(join(paths.tmpDir, "changes.txt"));
  fse.removeSync(join(paths.tmpDir, "love.ico"));
  fse.removeSync(join(paths.tmpDir, "game.ico"));

  const command =
    os.platform() == "win32"
      ? `cd ${paths.tmpDir} && copy /b love.exe+app.love "${exeName}"`
      : `cd ${paths.tmpDir} && cat love.exe app.love > "${exeName}"`;

  await new Promise((res, rej) => {
    exec(command, (err) => {
      if (err) return rej(err);
      res(null);
    });
  });

  let isWineInstalled = false;
  if (os.platform() != "win32") {
    await new Promise((res) => {
      exec("wine --version", (err) => {
        if (err) {
          console.warn(
            "Wine must be installed to set an icon or metadata for Windows from Linux or MacOS."
          );
          return res(null);
        }

        isWineInstalled = true;
        res(null);
      });
    });
  }

  if (os.platform() == "win32" || isWineInstalled) {
    await rcedit(join(paths.tmpDir, exeName), {
      ...(config.icon ? { icon: join(paths.tmp, "icon", "app.ico") } : {}),
      "version-string": config.version,
      "requested-execution-level": "asInvoker",
    });
  }

  fse.removeSync(join(paths.tmpDir, "love.exe"));
  fse.removeSync(join(paths.tmpDir, "lovec.exe"));
  fse.removeSync(join(paths.tmpDir, "app.love"));

  const zipPath = join(paths.tmp, `${target.alias}.zip`);
  await zip(paths.tmpDir, zipPath);
  return zipPath;
}
