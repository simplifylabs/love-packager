export interface IPaths {
  out: string;
  tmp: string;
  tmpDir: string;
  tmpLove: string;
  binary: string;
}

export interface ITarget {
  name: string;
  alias: string;
  binary?: IBinary;
  supported?: NodeJS.Platform[];
  outputFormat: string;
}

export interface IBinary {
  name: string;
  regex: RegExp;
  format: string;
}

const availableTargets = [
  {
    name: "LÖVE File",
    alias: "love",
    outputFormat: "{NAME}-{VERSION}.love",
  },
  {
    name: "Web",
    alias: "web",
    outputFormat: "{NAME}-{VERSION}-Web.zip",
  },
  {
    name: "Windows (32 Bit)",
    alias: "win-32",
    binary: {
      name: "Win32-{VERSION}",
      regex: /win32(.*).zip/g,
      format: "zip",
    },
    outputFormat: "{NAME}-{VERSION}-Win32.zip",
  },
  {
    name: "Windows (64 Bit)",
    alias: "win-64",
    binary: {
      name: "Win64-{VERSION}",
      regex: /win64(.*).zip/g,
      format: "zip",
    },
    outputFormat: "{NAME}-{VERSION}-Win64.zip",
  },
  {
    name: "Linux",
    alias: "linux",
    binary: {
      name: "Linux-{VERSION}",
      regex: /.AppImage/g,
      format: "AppImage",
    },
    outputFormat: "{NAME}-{VERSION}-Linux.AppImage",
    supported: ["linux"],
  },
  {
    name: "MacOS",
    alias: "mac",
    binary: {
      name: "Mac-{VERSION}",
      regex: /macos(.*).zip/g,
      format: "zip",
    },
    outputFormat: "{NAME}-{VERSION}-MacOS.zip",
    supported: ["linux", "darwin"],
  },
] as ITarget[];

export const aliases = availableTargets.map((t) => t.alias);
export default availableTargets;
