import { ensureGitRepo } from "helpers/ensureGitRepo"
import { generateConfig } from "helpers/generateConfig"
import { prepareTargetDir } from "helpers/prepareTargetDir"
import { PackageManager } from "install-pnpm-package/dist/detectPackageManager"
import { addEslint } from "steps/addEslint"
import { addHusky } from "steps/addHusky"
import { addJest } from "steps/addJest"
import { addLintStaged } from "steps/addLintStaged"
import { addNixShell } from "steps/addNixShell"
import { addPrettier } from "steps/addPrettier"
import { addTypescript } from "steps/addTypescript"
import { addVscodeSettings } from "steps/addVscodeSettings"
import { initializeProject } from "steps/initializeProject"
import { setupApplication } from "steps/setupApplication"
import { setupLibrary } from "steps/setupLibrary"

export type Options = {
  path: string
  name: string
  description?: string
  type: "library" | "application"
  monorepo: boolean
  repo: string
  branch?: string
  authorName?: string
  authorEmail?: string
  /** Select the flavor of lockfiles you want. Also the nix file will install this packagemanager.
   * @default "npm"
   */
  packageManager?: PackageManager
}

export const createTypescriptThing = async (options: Options) => {
  const {
    name,
    description,
    type,
    //   monorepo = false,
    repo,
    branch = "main",
    authorName,
    authorEmail,
    packageManager = "npm",
  } = options
  const config = await generateConfig(options)
  await prepareTargetDir(config)
  await ensureGitRepo(config, repo, branch)
  await addNixShell(config, packageManager)
  await initializeProject(config, name, "0.0.0", description, authorName, authorEmail, "MIT")
  await addTypescript(config, packageManager)
  await addPrettier(config, packageManager)
  await addEslint(config, packageManager)
  await addJest(config, packageManager)
  await addLintStaged(config, packageManager)
  await addHusky(config, packageManager)
  await addVscodeSettings(config)
  if (type === "library") {
    await setupLibrary(config, packageManager)
  }
  if (type === "application") {
    await setupApplication(config, packageManager, name)
  }
}

export default createTypescriptThing
