import * as core from "@actions/core";
import { runTsgo } from "./tsgo";
import { parseDiagnostics, summarize, renderMarkdown } from "./report";
import { upsertStickyComment } from "./github";

function asBool(v: string): boolean {
  return ["true", "1", "yes", "y", "on"].includes(v.trim().toLowerCase());
}

export async function run(): Promise<void> {
  const tsconfig = core.getInput("tsconfig") || "tsconfig.json";
  const installMode = (core.getInput("installMode") || "npx").toLowerCase();
  const mode = (core.getInput("mode") || "project").toLowerCase();
  const noEmit = asBool(core.getInput("noEmit") || "true");
  const extendedDiagnostics = asBool(
    core.getInput("extendedDiagnostics") || "false"
  );
  const failOnError = asBool(core.getInput("failOnError") || "true");
  const maxDiagnostics = Number(core.getInput("maxDiagnostics") || "50");
  const commentMode = (core.getInput("commentMode") || "sticky").toLowerCase();

  const args: string[] = [];
  if (mode === "build") {
    args.push("-b", tsconfig);
  } else {
    args.push("--project", tsconfig);
  }
  if (noEmit) args.push("--noEmit");
  if (extendedDiagnostics) args.push("--extendedDiagnostics");

  const res = await runTsgo(args, installMode === "local" ? "local" : "npx");

  const combined = `${res.stdout}\n${res.stderr}`;
  const diagnostics = parseDiagnostics(combined);
  const { errors, warnings } = summarize(diagnostics);

  const ok = res.code === 0;
  const title = ok ? "✅ TSGO Readiness" : "❌ TSGO Readiness";
  const md = renderMarkdown({
    title,
    command: res.command,
    exitCode: res.code,
    errors,
    warnings,
    diagnostics,
    maxDiagnostics,
  });

  // Job summary
  await core.summary.addRaw(md).write();

  // PR comment
  const token = process.env.GITHUB_TOKEN || core.getInput("github-token");
  if (commentMode === "sticky" && token) {
    await upsertStickyComment({ token, body: md });
  }

  if (!ok && failOnError) {
    core.setFailed(
      `tsgo failed (exit ${res.code}). Errors: ${errors}, Warnings: ${warnings}`
    );
  }
}

run().catch((e) => {
  core.setFailed(e instanceof Error ? e.message : String(e));
});
