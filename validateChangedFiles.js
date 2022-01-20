const simpleGit = require("simple-git");

async function validateChangedFiles() {
  const { created, deleted, modified, renamed } = await simpleGit().status();

  const onlyIndexHtmlChanged =
    modified.length === 1 && modified[0] === "bungie-website-output/index.html";

  console.log({ modified, onlyIndexHtmlChanged });

  if (
    created.length === 0 &&
    deleted.length === 0 &&
    renamed.length === 0 &&
    onlyIndexHtmlChanged
  ) {
    console.log("Only index.html has changed, so lets revert its changes");
    await simpleGit().checkout("HEAD -- bungie-website-output/index.html");
  }
}

module.exports = validateChangedFiles;