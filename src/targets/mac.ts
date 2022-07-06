import { replaceInFile } from "../util/package";
import { ITarget, IPaths } from "../conf/targets";
import { exec, spawn } from "child_process";
import { zip } from "zip-a-folder";
import { join } from "path";
import * as fse from "fs-extra";

export default async function packageMac(
  paths: IPaths,
  target: ITarget,
  config: any
) {
  const resourcePath = join(paths.tmpDir, "Contents", "Resources");
  const macPath = join(paths.tmpDir, "Contents", "MacOS");

  fse.copySync(paths.tmpLove, join(resourcePath, `${config.shortname}.love`));
  fse.moveSync(join(macPath, "love"), join(macPath, config.shortname));

  fse.rmSync(join(resourcePath, "Assets.car"));

  if (config.icon) {
    const gameIcon = join(resourcePath, "GameIcon.icns");
    const appIcon = join(resourcePath, "OS X AppIcon.icns");

    fse.rmSync(gameIcon);
    fse.rmSync(appIcon);

    fse.copyFileSync(join(paths.tmp, "icon", "app.icns"), appIcon);
    fse.copyFileSync(join(paths.tmp, "icon", "app.icns"), gameIcon);
  }

  replaceInFile(join(paths.tmpDir, "Contents", "Info.plist"), [
    [">LÖVE<", `>${config.name}<`],
    [">org.love2d.love<", `>com.example.${config.shortname}<`],
    [">LÖVE Project<", `>${config.description}<`],
    [/<key>UTExportedTypeDeclarations(.*)<\/array>/s, ""],
    [
      /(?<=CFBundleExecutable<\/key>)(.*?)(?=<\/string>)/s,
      `\n\t<string>${config.shortname}`,
    ],
  ]);

  await new Promise((res, rej) => {
    exec(
      `cd ${paths.tmpDir} && chmod +x ./Contents/MacOS/${config.shortname}`,
      (err) => {
        if (err) return rej(err);
        res(null);
      }
    );
  });

  const appPath = join(paths.tmp, `${target.alias}.app`);
  fse.moveSync(paths.tmpDir, appPath);

  const unpackedPath = join(paths.tmp, `${target.alias}-unpacked`);
  fse.emptyDirSync(unpackedPath);
  fse.copySync(appPath, join(unpackedPath, `${config.name}.app`));

  const zipPath = join(paths.tmp, `${target.alias}.zip`);
  await zip(unpackedPath, zipPath);

  fse.removeSync(appPath);
  fse.removeSync(unpackedPath);

  return zipPath;
}
