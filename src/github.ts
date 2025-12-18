import * as github from "@actions/github";

export async function upsertStickyComment(opts: {
  token: string;
  body: string;
}): Promise<void> {
  const ctx = github.context;

  // Only PRs have an issue number here.
  const issueNumber = ctx.payload.pull_request?.number;
  if (!issueNumber) return;

  const octokit = github.getOctokit(opts.token);
  const owner = ctx.repo.owner;
  const repo = ctx.repo.repo;

  const marker = "<!-- tsgo-readiness-bot -->";

  // Find existing comment
  const comments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100
  });

  const existing = comments.data.find((c: any) => c.body?.includes(marker));

  if (existing) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body: opts.body,
    });
  } else {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: opts.body,
    });
  }
}
