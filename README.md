# LÖVE Packager

CLI to package your LÖVE projects

## Targets

|                  | Alias | Supported |
| ---------------- | :---: | :-------: |
| LOVE File        | love  |    ✔️     |
| Windows (32 bit) | win32 |    ✔️     |
| Windows (64 bit) | win64 |    ✔️     |
| MacOS            |  mac  |    ✔️     |
| Linux (AppImage) | linux |    ✔️     |
| Web              |  web  |    ✔️     |
| Android          |   -   |    ❌     |
| iOS              |   -   |    ❌     |

## Installation

1. Install [NodeJS](https://nodejs.org/en/)
2. Run `npx love-packager init` to initialise the directory
3. Run `npx love-packager package all` to package to project

## Commands

### init

Create a packager.yml file

#### Usage

`$ npx love-packager init [PATH] [--full]`

#### Flags

- --full

### package

Package the project

#### Usage

`$ npx love-packager package [TARGETS...] [--all]`

#### Flags

- --all

### help

Display help information for love-packager

## Config

Configuration in packager.yml

### Required:

- `name` - String - Full project name
- `version` - String - Current version (e.g. 1.0.0)
- `assets` - Array<String> - List of files to include (Glob Patterns)

### Optional:

- `icon` - String - Path to 256x256 .png icon
- `description` - String - Short description
- `shortname` - String - Filename for executables
- `output` - String - Name for output folder
- `targets` - Array<String> - Fallback target list

### Example Config:

```yml
name: LÖVE Project

description: A game created with LÖVE
version: 0.0.1
icon: icon.png

assets:
  - "*.lua"
  - assets/**/*

targets:
  - love
  - web
  - win-32
  - win-64
  - linux
  - mac
```

## Credits

- [LÖVE](https://github.com/love2d/love)
- [love.js](https://github.com/Davidobot/love.js)
