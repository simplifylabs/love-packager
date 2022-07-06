import { luaConf as defaultLuaConf } from "../conf/config";
import { getAITool, getLoveVersion } from "../util/binary";
import { replaceInFile } from "../util/package";
import { ITarget, IPaths } from "../conf/targets";
import { exec } from "child_process";
import { join } from "path";
import * as fse from "fs-extra";
import * as chalk from "chalk";

export default async function packageLinux(
  paths: IPaths,
  _: ITarget,
  config: any
) {
  const luaConfPath = join(process.cwd(), "config.lua");
  if (!fse.existsSync(luaConfPath)) {
    console.warn(
      `\n ${chalk.yellow(
        "WARNING:"
      )} config.lua doesn't exist. Creating minimum configuration automatically.`
    );

    let luaConf = defaultLuaConf;
    luaConf = luaConf.replace("%NAME%", config.name);
    luaConf = luaConf.replace("%VERSION%", await getLoveVersion());
    fse.writeFileSync(luaConfPath, luaConf);
  }

  const ai = await getAITool();
  fse.copySync(paths.tmpLove, join(paths.tmpDir, "app.love"));

  await new Promise((res, rej) => {
    exec(
      `cd ${paths.tmpDir} && cat ./bin/love app.love > ./bin/${config.shortname} && chmod +x ./bin/${config.shortname}`,
      (err) => {
        if (err) return rej("Failed to fuse linux binary\n\t" + err);
        fse.rmSync(join(paths.tmpDir, "bin", "love"));
        fse.rmSync(join(paths.tmpDir, "app.love"));
        res(null);
      }
    );
  });

  replaceInFile(join(paths.tmpDir, "love.desktop"), [
    ["Name=LÖVE", `Name=${config.name}`],
    [/Comment=(.*)/, `Comment=${config.description}`],
    [/Exec=(.*)/, `Exec=${config.shortname} %f`],
    [/Icon=(.*)/, `Icon=${config.shortname}`],
  ]);

  fse.moveSync(
    join(paths.tmpDir, "love.desktop"),
    join(paths.tmpDir, `${config.shortname}.desktop`)
  );

  if (config.icon) {
    fse.rmSync(join(paths.tmpDir, "love.svg"));
    fse.cpSync(
      join(process.cwd(), config.icon),
      join(paths.tmpDir, `${config.shortname}.png`)
    );
  } else {
    fse.moveSync(
      join(paths.tmpDir, "love.svg"),
      join(paths.tmpDir, `${config.shortname}.svg`)
    );
  }

  const outPath = join(paths.tmp, `linux.AppImage`);
  await new Promise((res, rej) => {
    exec(`${ai} ${paths.tmpDir} ${outPath}`, (err) => {
      if (err) return rej(err);
      res(null);
    });
  });
  return outPath;
}
