import { mkdtemp, rm, stat } from "fs/promises"
import { Config } from "helpers/generateConfig"
import { loadExistingFile } from "helpers/loadExistingFile"
import { createTypescriptThing } from "index"
import { tmpdir } from "os"
import { resolve } from "path"
import { sh } from "sh"
import { runInDirectory } from "tests/runInDirectory"

const testConfig = (dir: string): Config => ({
  targetDir: dir,
  gitCommits: true,
  gitRepo: true,
  packageManager: "npm",
  logger: {
    logMessage: () => {},
    logState: () => {},
  },
})

describe("The structure of the generated project looks ok", () => {
  let dir = ""
  beforeAll(async () => {
    dir = await mkdtemp(resolve(tmpdir(), "cttl-test-"))
    await createTypescriptThing({
      path: dir,
      name: "test",
      type: "library",
      gitOrigin: "git@github.com:isomorphic-git/test.empty.git",
      gitBranch: "master",
    })
  }, 120000)

  afterAll(async () => {
    await rm(dir, { recursive: true })
  })

  it("Creates a nix shell file", async () => {
    const file = await loadExistingFile(testConfig(dir), "shell.nix")
    expect(file).toBeTruthy()
  })

  it("Creates a correct package.json file", async () => {
    const packageJson = await loadExistingFile(testConfig(dir), "package.json")
    expect(packageJson).toBeTruthy()
    const packageObject = JSON.parse(packageJson || "")
    expect(packageObject.name).toBe("test")
  })

  it("Creates a typescript project file", async () => {
    const fileJson = await loadExistingFile(testConfig(dir), "tsconfig.json")
    expect(fileJson).toBeTruthy()
    const fileObject = JSON.parse(fileJson || "")
    expect(typeof fileObject.compilerOptions).toBe("object")
  })

  it("Creates a prettier config file", async () => {
    const fileJson = await loadExistingFile(testConfig(dir), ".prettierrc.json")
    expect(fileJson).toBeTruthy()
    const fileObject = JSON.parse(fileJson || "")
    expect(typeof fileObject).toBe("object")
  })

  it("Creates an eslint config file", async () => {
    const fileJson = await loadExistingFile(testConfig(dir), ".eslintrc.json")
    expect(fileJson).toBeTruthy()
    const fileObject = JSON.parse(fileJson || "")
    expect(typeof fileObject).toBe("object")
  })

  it("Creates a jest config file", async () => {
    const fileJson = await loadExistingFile(testConfig(dir), "jest.config.js")
    expect(fileJson).toBeTruthy()
  })

  it("Creates a lint-staged config file", async () => {
    const fileJson = await loadExistingFile(testConfig(dir), ".lintstagedrc.json")
    expect(fileJson).toBeTruthy()
    const fileObject = JSON.parse(fileJson || "")
    expect(typeof fileObject).toBe("object")
  })

  it("Creates an executable precommit hook", async () => {
    const file = await loadExistingFile(testConfig(dir), ".husky/pre-commit")
    expect(file).toBeTruthy()
    const statResult = await stat(resolve(dir, ".husky/pre-commit"))
    expect(statResult.mode & 0o111).toBe(0o111)
  })

  it("Creates vscode config files", async () => {
    const fileJson1 = await loadExistingFile(testConfig(dir), ".vscode/settings.json")
    const fileJson2 = await loadExistingFile(testConfig(dir), ".vscode/extensions.json")
    expect(fileJson1).toBeTruthy()
    expect(fileJson2).toBeTruthy()
    expect(typeof JSON.parse(fileJson1 || "")).toBe("object")
    expect(typeof JSON.parse(fileJson2 || "")).toBe("object")
  })
})

describe("The generated project seems to work", () => {
  let dir = ""
  beforeAll(async () => {
    dir = await mkdtemp(resolve(tmpdir(), "cttl-test-"))
    await createTypescriptThing({
      path: dir,
      name: "test",
      type: "library",
      gitOrigin: "git@github.com:isomorphic-git/test.empty.git",
      gitBranch: "master",
    })
    await sh(`cd '${dir}' && npm install`)
  }, 120000)

  afterAll(async () => {
    await rm(dir, { recursive: true })
  })

  it("The generated project passes its tests", async () => {
    const { stdout, stderr } = await sh(`cd '${dir}' && npm run test`)
    expect(stdout + stderr).toContain("PASS")
  }, 120000)

  it("The files in the generated project are formatted correctly", async () => {
    const prettierPromise = sh(`cd '${dir}' && $(npm bin)/prettier . --check`)
    await expect(prettierPromise).resolves.toBeTruthy()
  }, 120000)

  it("The files in the generated project pass eslint", async () => {
    const eslintPromise = sh(`cd '${dir}' && $(npm bin)/eslint src`)
    await expect(eslintPromise).resolves.toBeTruthy()
  }, 120000)
})

it("Entrypoint for debugging", async () => {
  await runInDirectory(async dir => {
    await createTypescriptThing({
      path: dir,
      name: "test",
      type: "library",
      gitOrigin: "git@github.com:isomorphic-git/test.empty.git",
      gitBranch: "master",
    })
  })
}, 120000)
