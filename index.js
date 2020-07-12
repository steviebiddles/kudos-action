const core = require('@actions/core');
const github = require('@actions/github');
const moment = require('moment');

// most @actions toolkit packages have async methods
async function run() {
  try {
    const token = core.getInput('token');
    const seconds = core.getInput('seconds');
    const octokit = github.getOctokit(token);

    // https://github.com/actions/toolkit/blob/master/packages/github/src/context.ts
    const issue = github.context.issue; // issue or pull_request

    // get details
    const { data: { created_at: createdAt } } = await octokit.pulls.get({
      owner: issue.owner,
      repo: issue.repo,
      pull_number: issue.number,
    });

    // get list of reviews --> returned in order
    const { data: reviews } = await octokit.pulls.listReviews({
      owner: issue.owner,
      repo: issue.repo,
      pull_number: issue.number,
    });

    const maxDateTimeForKudos = moment(createdAt).add(seconds, 's');
    const approved = reviews.filter(
        r => r.state === 'APPROVED' && moment(r.submitted_at) <= maxDateTimeForKudos
    );

    // only give kudos to first reviewer that approved
    if (approved && approved.length === 1) {
      const msg = `Kudos to ${approved[0].user.login}! You have 500 YEI points coming your way.`;

      await octokit.issues.createComment({
        owner: issue.owner,
        repo: issue.repo,
        issue_number: issue.number,
        body: msg,
      });
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
