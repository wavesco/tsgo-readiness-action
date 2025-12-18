export type Diagnostic = {
  file?: string;
  line?: number;
  col?: number;
  level: "error" | "warning" | "message";
  code?: string;
  text: string;
  raw: string;
};

const DIAG_RE =
  /^(.*)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.*)$/;

export function parseDiagnostics(output: string): Diagnostic[] {
  const diags: Diagnostic[] = [];
  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    const m = line.match(DIAG_RE);
    if (m) {
      diags.push({
        file: m[1],
        line: Number(m[2]),
        col: Number(m[3]),
        level: m[4] as "error" | "warning",
        code: `TS${m[5]}`,
        text: m[6],
        raw: line,
      });
      continue;
    }

    // Fallback: keep notable lines
    if (/error\s+TS\d+:/i.test(line) || /warning\s+TS\d+:/i.test(line)) {
      diags.push({ level: "message", text: line, raw: line });
    }
  }
  return diags;
}

export function summarize(diags: Diagnostic[]) {
  let errors = 0;
  let warnings = 0;
  for (const d of diags) {
    if (d.level === "error") errors++;
    if (d.level === "warning") warnings++;
  }
  return { errors, warnings, total: diags.length };
}

export function renderMarkdown(params: {
  title: string;
  command: string;
  exitCode: number;
  errors: number;
  warnings: number;
  diagnostics: Diagnostic[];
  maxDiagnostics: number;
}): string {
  const top = params.diagnostics.slice(0, params.maxDiagnostics);

  const lines: string[] = [];
  lines.push(`<!-- tsgo-readiness-bot -->`);
  lines.push(`## ${params.title}`);
  lines.push("");
  lines.push(`**Command:** \`${params.command}\``);
  lines.push(`**Exit code:** \`${params.exitCode}\``);
  lines.push(
    `**Errors:** \`${params.errors}\`  **Warnings:** \`${params.warnings}\``
  );
  lines.push("");

  if (top.length) {
    lines.push(`### Diagnostics (first ${top.length})`);
    lines.push("```");
    for (const d of top) lines.push(d.raw);
    lines.push("```");
  } else {
    lines.push("✅ No diagnostics found.");
  }

  return lines.join("\n");
}
