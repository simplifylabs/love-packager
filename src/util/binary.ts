import { ITarget } from "../conf/targets";
import { exec } from "child_process";
import * as Progress from "cli-progress";
import * as unzipper from "unzipper";
import * as request from "request";
import * as fse from "fs-extra";
import * as path from "path";
import * as os from "os";
import * as chalk from "chalk";
import * as mv from "mv";

export async function getBinary({ name, binary }: ITarget) {
  if (!binary) return "";

  try {
    const version = await getLoveVersion();
    const binaryName = binary.name.replace("{VERSION}", version);
    const binaryPath = getAppPath(binaryName);

    if (!fse.existsSync(binaryPath)) {
      const url = await getBinaryURL(version, binary.regex);
      const tmpPackPath = path.join(
        os.tmpdir(),
        `${binaryName}.${binary.format}`
      );

      fse.removeSync(tmpPackPath);
      await downloadBinary(name, url, tmpPackPath);

      switch (binary.format) {
        case "zip":
          await unzipFile(tmpPackPath, binaryPath);
          break;
        case "AppImage":
          await extractAppImage(tmpPackPath, binaryPath);
          break;
      }

      fse.removeSync(tmpPackPath);
    }

    return binaryPath;
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

let binaries: any | null = null;
async function getBinaryURL(version: string, regex: RegExp) {
  if (!binaries) binaries = await fetchBinaryURL(version);

  for (let i = 0; i < binaries.length; i++) {
    const binary = binaries[i];
    if (binary.name.match(regex)) return binary.browser_download_url;
  }
}

async function fetchBinaryURL(version: string) {
  return new Promise((resolve, rej) => {
    request.get(
      `https://api.github.com/repos/love2d/love/releases/tags/${version}`,
      { headers: { "User-Agent": "Love-Packager" } },
      (err, res) => {
        if (err) return rej(err);

        const body = JSON.parse(res.body);
        if (!body || !body.assets)
          return rej("Failed to load binary information from github");

        resolve(body.assets);
      }
    );
  });
}

let loveVersion: string | null = null;
export async function getLoveVersion() {
  if (loveVersion) return loveVersion;
  const errorMsg = `Failed to parse LÖVE version. Make sure you it is added to PATH.
    \tFor more information see: https://love2d.org/wiki/PATH`;

  if (os.platform() == "win32") {
    return new Promise<string>(async (res, rej) => {
      const loveExePath = await new Promise<string>((res, rej) => {
        exec(
          "(get-command love.exe).Path",
          { shell: "powershell" },
          (err, out) => {
            if (err) return rej(errorMsg);
            res(String(out)?.replace("\n", "").replace("\r", ""));
          }
        );
      });

      if (!loveExePath) rej(errorMsg);

      const lovePath = path.dirname(loveExePath);
      if (!fse.existsSync(lovePath)) rej(errorMsg);

      const loveChangesPath = path.join(lovePath, "changes.txt");
      if (!fse.existsSync(loveChangesPath)) rej(errorMsg);

      const loveChanges = fse.readFileSync(loveChangesPath, "utf8");
      const versionString = loveChanges.split("\n")[0];

      const version = versionString.match(/(\d+)((\.{1}\d+)*)(\.{0})/g);
      if (!version) return rej(errorMsg);

      res(version[0]);
    }).catch(() => {
      throw errorMsg;
    });
  } else {
    return new Promise<string>((res, rej) => {
      exec("love --version", (err, out) => {
        if (err) return rej(errorMsg);

        const version = out.match(/(\d+)((\.{1}\d+)*)(\.{0})/g);
        if (!version) return rej(errorMsg);

        loveVersion = version[0];
        res(version[0]);
      });
    }).catch((e) => {
      throw e;
    });
  }
}

function extractAppImage(file: string, to: string) {
  return new Promise(async (res, rej) => {
    const extractedPath = path.join(os.tmpdir(), "squashfs-root");
    fse.emptyDirSync(extractedPath);
    fse.removeSync(extractedPath);

    exec(
      `cd ${os.tmpdir()} && chmod +x ${file} && sleep 1 && ${file} --appimage-extract`,
      (err) => {
        if (err) return rej("Failed to extract LÖVE AppImage");

        mv(extractedPath, to, { mkdirp: true }, (e) => {
          if (e) return rej(e);
          res(null);
        });
      }
    );
  });
}

export async function getAITool() {
  const appImageTool = getAppPath("appimagetool");

  if (!fse.existsSync(appImageTool)) {
    await downloadBinary(
      "AppImageTool",
      "https://github.com/AppImage/AppImageKit/releases/download/13/appimagetool-x86_64.AppImage",
      appImageTool
    );
    exec(`chmod +x ${appImageTool}`);
  }

  return appImageTool;
}

function unzipFile(file: string, to: string) {
  const name = path.basename(file).replace(".zip", "");
  const tmpDirPath = path.join(os.tmpdir(), name);

  fse.emptyDirSync(tmpDirPath);

  return new Promise<void>((res, rej) => {
    fse
      .createReadStream(file)
      .pipe(unzipper.Extract({ path: tmpDirPath }))
      .on("finish", () => {
        const files = fse.readdirSync(tmpDirPath);

        mv(path.join(tmpDirPath, files[0]), to, { mkdirp: true }, (e) => {
          if (e) return rej(e);
          res();
        });
      })
      .on("error", (e: any) => rej(e));
  });
}

export function getAppPath(file?: string) {
  const appData =
    process.env.APPDATA ||
    (process.platform == "darwin"
      ? process.env.HOME + "/Library/Preferences"
      : process.env.HOME + "/.local/share");
  const dir = path.join(appData, "love-packager");

  fse.mkdirpSync(dir);
  if (file) return path.join(dir, file);
  return dir;
}

export async function downloadBinary(name: string, url: string, path: string) {
  const file = fse.createWriteStream(path);
  const bar = new Progress.SingleBar(
    {
      format: `${chalk.gray("Downloading")} ${name} Binaries ${chalk.gray(
        "|"
      )} {bar} ${chalk.gray("|")} {percentage}%`,
    },
    Progress.Presets.shades_classic
  );

  bar.start(100, 0);

  return new Promise<void>((resolve, reject) => {
    request.get(url).on("response", (res: any) => {
      const len = parseInt(res.headers["content-length"] || "", 10);
      let downloaded = 0;

      res
        .on("data", (chunk: any) => {
          file.write(chunk);
          downloaded += chunk.length;
          bar.update((100 * downloaded) / len);
        })
        .on("end", () => {
          file.end();
          bar.stop();
          resolve();
        })
        .on("error", (err: any) => {
          bar.stop();
          reject(err);
        });
    });
  });
}
