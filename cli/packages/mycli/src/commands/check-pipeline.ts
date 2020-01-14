
// var debug = require("debug")("mycli:check-pipeline");
import { flags } from "@oclif/command";
import { cli } from "cli-ux";
import { Pipelines } from "gitlab";
import chalk from "chalk";

import { parse } from "url";

import * as notifier from "node-notifier";

import Base from "../base";
import { Pipeline } from '../lib/gitlab-response-types';
import { retry } from '../lib/retry';

// const { prompt } = require("enquirer");

const RETRY_INTERVAL = 6000; // in milliseconds
const RETRY_COUNT = 50;

const isPipelineDone = (response: Pipeline) => {
  return response.status === "success";
};

// Helper to deal with string-number conversion impedance
const apiVersionFromString = (apiVersion: string): 4 | 3 => {
  switch (apiVersion) {
    case "4":
      return 4;
    case "3":
      return 3;
    default:
      return 4;
  }
};

export class CheckGitlabPipeline extends Base {
  static description =
    "Notifies when a gitlab pipeline successfully completes";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    pipelineId: flags.integer({
      char: "p",
      description: "pipeline id",
      default: 1796026
    }),
    // flag with no value (-f, --force)
    // force: flags.string({ char: "f" })
    // https://www.npmjs.com/package/gitlab#getting-started
    token: flags.string({
      char: "g",
      env: "GITLAB_TOKEN",
      required: true
    }),
    host: flags.string({
      char: "o",
      default: "https://gitlab.ddbuild.io"
    }),
    apiVersion: flags.string({
      char: "a",
      default: "4",
      options: ["3", "4"]
    }),
    url: flags.string({
      char: "u",
      // required: true, // TODO: write this
      default: "https://gitlab.ddbuild.io/DataDog/web-ui/pipelines/1796026"
    })
  };

  static args = [{ name: "url" }];

  static strict = false;
  async run() {
    const { flags, args } = this.parse(CheckGitlabPipeline);

    const { token, apiVersion } = flags;
    const { url } = args;

    // parse URL into host, projectId, pipelineId
    const parsedUrl = parse(url);
    const { host, protocol } = parsedUrl;

    const gitlabApiOptions = {
      token: token,
      host: `${protocol}//${host}` || "",
      version: apiVersionFromString(apiVersion)
    };

    // TODO: this part depends on how the gitlab api version works, we assume v4.
    const parsedPath = parsedUrl.pathname?.split("/pipelines/");

    // // https://docs.gitlab.com/ee/api/README.html#namespaced-path-encoding
    const projectId = parsedPath?.slice(0, 1)[0].substr(1) || "Datadog/web-ui"; // remove first character, which is a slash we don't need
    const pipelineId = parsedPath?.slice(1, 2)[0] || 1000;

    const api = new Pipelines(gitlabApiOptions);

    const checkApiStatusPromise = () => {
      return api.show(projectId, +pipelineId).then((response: any) => {
        return response as Pipeline;
      });
    };

    this.log("Hi there! Relax, I'll let you know when the pipeline is done");
    cli.action.start(
      `Checking pipeline ${chalk.cyan(
        `${pipelineId}`
      )} in project ${projectId}`,
      `Thinking intently...`
    );

    // https://github.com/sw-yx/egghead-cli-workshop/blob/master/guide/12-polish-CLI.md
    await retry(checkApiStatusPromise, isPipelineDone, RETRY_COUNT, RETRY_INTERVAL)
      .then((response: Pipeline) => {
        cli.action.stop(chalk.green("Succeeded! Visit URL for more details")); // shows 'starting a process... done'
        notifier.notify({
          title: `Success: ${pipelineId}`, // TODO: include pipeline duration
          message: "Click to open the pipeline page in a web browser",
          closeLabel: "Dismiss",
          open: response.web_url,
          actions: "run"
        });
      })
      // TODO: could using a state machine help us to see whether everything is still working, or if it actually failed.
      .catch(() => {
        cli.action.stop(
          chalk.red(
            `Retired after ${(RETRY_COUNT * RETRY_INTERVAL) /
            1000} seconds. Try again later`
          )
        );
        notifier.notify(
          {
            title: `Failed: ${pipelineId}`,
            open: url, // from user
            message: "Click Retry to retry all jobs (or just failed jobs)?",
            closeLabel: "Dismiss",
            wait: true,
            actions: "Retry"
          },
          (err, response) => {
            api.retry(projectId, +pipelineId).then(response => {
              this.log("Retry attempt successful");
            });
          }
        );
      });
  }
}
