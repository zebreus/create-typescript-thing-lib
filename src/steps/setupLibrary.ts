import { commitWithAuthor } from "helpers/commitWithAuthor"
import { Config } from "helpers/generateConfig"
import { installPackage } from "helpers/installPackage"
import { augmentJsonConfig } from "helpers/modifyJsonFile"
import { withStateLogger } from "helpers/withStateLogger"
import { writeAndAddFile } from "helpers/writeAndAddFile"
import { PackageJson } from "types-package-json"

export const setupLibrary = withStateLogger(
  {
    id: "library",
    message: "Configuring project as library",
    failed: "Failed to configure library",
    completed: "Configured project as library",
  },
  async (config: Config) => {
    await installPackage(config, ["@zebreus/resolve-tspaths"])

    await augmentJsonConfig<Omit<Partial<PackageJson>, "keywords"> & { keywords?: string[] }>(config, "package.json", {
      files: ["dist/**"],
      keywords: ["library"],
      main: "dist/index.js",
    })

    await writeAndAddFile(config, "src/index.ts", generateLibraryIndex())

    await writeAndAddFile(config, "src/tests/example.test.ts", generateLibraryTest())

    await commitWithAuthor(config, "Setup project as library")
  }
)

const generateLibraryTest = () => {
  return `import { add, subtract } from "index"

it("adds two numbers", () => {
  expect(add(1, 2)).toBe(3)
})

it("subtracts two numbers", () => {
  expect(subtract(1, 2)).toBe(-1)
})`
}

const generateLibraryIndex = () => {
  return `export const add = (a: number, b: number) => a + b
    export const subtract = (a: number, b: number) => a - b
    `
}
