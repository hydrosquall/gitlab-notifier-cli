
import { flags } from "@oclif/command";
import { cli } from "cli-ux";
import { Pipelines } from "gitlab";
import chalk from "chalk";

import { parse } from "url";
import * as humanizeDuration from 'humanize-duration';

import * as notifier from "node-notifier";

import Base from "../base";
import { Pipeline } from '../lib/gitlab-response-types';
import { retry } from '../lib/retry';

// const { prompt } = require("enquirer");
const isPipelineDone = (response: Pipeline) => {
  return response.status === "success" || response.status === "failed";
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
    retryInterval: flags.integer({
      char: "i",
      description: "duration to wait in between retries, in ms",
      default: 10000 // 10 seconds seems reasonable
    }),
    retryCount: flags.integer({
      char: "c",
      description: "number of times to retry before halting checks",
      default: 6 * 25, // try for 25 minutes by default
    }),
    language: flags.string({
      char: "l",
      description: "Preferred locale for describing durations, check humanize-durations for full list",
      default: 'en'
    })
  };

  static args = [{ name: "url", default: "https://gitlab.ddbuild.io/DataDog/web-ui/pipelines/1796026" }];

  static strict = false;
  async run() {
    const { flags, args } = this.parse(CheckGitlabPipeline);

    const { token, apiVersion, retryCount, retryInterval, language } = flags;
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
      cli.action.start('')

      return api.show(projectId, +pipelineId).then((response) => {

        // Not great to have a side-effect in here, but it's OK for now. In future, compose the retry function
        // with both a checker and a logger.
        const durationInSeconds = (response as Pipeline).duration || 0;
        cli.action.start( `Thinking intently`, `Last run completed in ${humanizeDuration(durationInSeconds * 1000)}`);

        return response as Pipeline;
      });
    };

    const humanizer = humanizeDuration.humanizer({
      language
    })

    this.log("Hi there! Relax, I'll let you know when your pipeline is done");
    this.log(`Checking pipeline ${chalk.cyan(`${pipelineId}`)} in project ${projectId}`);
    cli.action.start(
      'Watching',
      `Thinking intently...`
    );

    // https://github.com/sw-yx/egghead-cli-workshop/blob/master/guide/12-polish-CLI.md
    await retry(checkApiStatusPromise, isPipelineDone, retryCount, retryInterval)
      .then((response: Pipeline) => {
        const formattedStatus = response.status.toUpperCase();
        const colorFunction = response.status === 'success' ? chalk.green: chalk.red;

        const durationInSeconds = response.duration || 0;
        const humanizedDuration = humanizer(durationInSeconds * 1000);

        cli.action.stop(colorFunction(`\n${formattedStatus} after ${humanizedDuration}. Visit ${url} for detail.`));

        if (response.status === 'failed') {
          notifier.notify(
            {
              title: `${pipelineId} failed`,
              subtitle: `Duration: ${ humanizedDuration }`,
              open: url, // from user
              message: "Click Retry to retry failed jobs from the previous run",
              closeLabel: "Dismiss",
              wait: true,
              timeout: 15000, // I believe this in milliseconds.
              actions: "Retry"
            },
            (err: any, response: string, notificationMetadata?: notifier.NotificationMetadata) => {
              this.log(`response ${response}`);
              if (response === 'closed') {
                this.exit();
              }

              if (response === 'activate') {
                if (notificationMetadata && notificationMetadata.activationValue === 'Retry') {
                  api.retry(projectId, +pipelineId).then(response => {
                    console.log(response);
                    this.log("Successfully triggered retries on this pipeline");
                  }).catch(() => {
                    this.log("Launching a retry failed somehow, check gitlab for details");
                  })
                }
              }
            }
          );
        } else if (response.status === 'success') {
          notifier.notify({
            title: `${pipelineId} succeeded 🥳`, // TODO: include pipeline duration
            subtitle: `Duration: ${humanizedDuration}`,
            message: "Click to open the pipeline page",
            closeLabel: "Dismiss",
            open: response.web_url,
          });
          this.exit();
        }

      }).catch(() => {
        // TODO: could using a state machine help us to see whether everything is still working, or if it actually failed.
        cli.action.stop(
          chalk.red(
            `Stopped checking after after ${humanizer((retryCount * retryInterval))}. I can try again if you'd like.`
          )
        );
        this.exit();
      });

  }
}
