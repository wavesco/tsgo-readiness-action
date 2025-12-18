import * as exec from "@actions/exec";

export type RunResult = {
  code: number;
  stdout: string;
  stderr: string;
  command: string;
};

export type InstallMode = "npx" | "local";

export async function runTsgo(
  args: string[],
  installMode: InstallMode = "npx"
): Promise<RunResult> {
  let stdout = "";
  let stderr = "";

  if (installMode === "local") {
    const command = `tsgo ${args.join(" ")}`.trimEnd();
    const code = await exec.exec("tsgo", args, {
      ignoreReturnCode: true,
      listeners: {
        stdout: (data: Buffer) => (stdout += data.toString("utf8")),
        stderr: (data: Buffer) => (stderr += data.toString("utf8")),
      },
    });

    return { code, stdout, stderr, command };
  }

  // Use npx to run tsgo from @typescript/native-preview without requiring user install.
  // Equivalent idea: install @typescript/native-preview then run tsgo.
  const npxArgs = [
    "--yes",
    "--package=@typescript/native-preview",
    "tsgo",
    ...args,
  ];

  const command = `npx ${npxArgs.join(" ")}`;

  const code = await exec.exec("npx", npxArgs, {
    ignoreReturnCode: true,
    listeners: {
      stdout: (data: Buffer) => (stdout += data.toString("utf8")),
      stderr: (data: Buffer) => (stderr += data.toString("utf8")),
    },
  });

  return { code, stdout, stderr, command };
}
