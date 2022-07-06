import * as Joi from "joi";
import { aliases } from "../conf/targets";

export const configFilename = "packager.yml";
export const possibleAssets = [
  "*.lua",
  "assets/**/*",
  "fonts/**/*",
  "images/**/*",
  "icons/**/*",
  "sounds/**/*",
  "gfx/**/*",
];

export const defaultConfig = {
  name: "NAME",
  version: "0.0.1",
  assets: ["main.lua", "config.lua"],
};

export const fullConfig = {
  name: "NAME",
  shortname: "NAME",
  description: "A game created with LÖVE",
  version: "0.0.1",
  assets: ["main.lua", "config.lua"],
  icon: "icon.ico",
  output: "dist",
  targets: aliases,
};

export const configSchema = Joi.object({
  name: Joi.string().required(),
  shortname: Joi.string()
    .regex(/^[a-z0-9-]+$/)
    .error(() => "Only characters, numbers, and dashes are allowed!")
    .optional(),
  version: Joi.string().required(),
  assets: Joi.array().items(Joi.string()).required(),
  icon: Joi.string().optional(),
  description: Joi.string().optional().default("A game made with LÖVE"),
  output: Joi.string().optional().default("dist"),
  targets: Joi.array().items(Joi.string().valid(...aliases)),
});

export const luaConf = `function love.conf(t)
    t.window.title = "%NAME%"
    -- Version of LÖVE used 
    t.version = "%VERSION%"
end`;
