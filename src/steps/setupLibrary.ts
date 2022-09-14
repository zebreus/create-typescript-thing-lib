import { appendScriptToPackage } from "helpers/addScriptToPackage"
import { commitWithAuthor } from "helpers/commitWithAuthor"
import { Config } from "helpers/generateConfig"
import { installPackage } from "helpers/installPackage"
import { modifyJsonConfig } from "helpers/modifyJsonFile"
import { writeAndAddFile } from "helpers/writeAndAddFile"
import { PackageManager } from "install-pnpm-package/dist/detectPackageManager"
import { PackageJson } from "types-package-json"

export const setupLibrary = async (config: Config, packageManager: PackageManager) => {
  await installPackage(config, packageManager, ["resolve-tspaths"])

  await modifyJsonConfig<Omit<PackageJson, "keywords"> & { keywords?: string[] }>(
    config,
    "package.json",
    packageJson => ({
      ...packageJson,
      files: [...new Set([...(packageJson.files || []), "dist/**"])],
      keywords: [...new Set([...(packageJson.keywords || []), "library"])],
      main: "dist/index.js",
    })
  )

  await appendScriptToPackage(
    config,
    "build",
    "tsc --project tsconfig.build.json && resolve-tspaths -p tsconfig.build.json"
  )
  await appendScriptToPackage(
    config,
    "prepack",
    "rm -rf dist && tsc --project tsconfig.build.json && resolve-tspaths -p tsconfig.build.json"
  )
  await appendScriptToPackage(config, "prepublish", "eslint --cache && tsc --noEmit")

  await writeAndAddFile(config, "src/index.ts", generateLibraryIndex())

  await commitWithAuthor(config, "Setup project as library")
}

const generateLibraryIndex = () => {
  return `export const add = (a: number, b: number) => a + b
    export const subtract = (a: number, b: number) => a - b
    `
}
