import { flags } from "@oclif/command";
import Base from "../base";
var debug = require("debug")("mycli:init");
const { prompt } = require("enquirer");

class CheckGitlabPipeline extends Base {
  static description = "Waits until a given gitlab pipeline completes";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({
      char: "n",
      description: "name to print"
    }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" })
  };

  static args = [{ name: "file" }];
  static strict = false;
  async run() {
    const { args, flags } = this.parse(CheckGitlabPipeline);
    // debug("parsing args", args);
    // debug("parsing flags", flags);

    if (typeof flags.name === "undefined") {
      if (this.config && this.config.name) {
        flags.name = this.config.name;
      } else {
        flags.name = await prompt({
          type: "input",
          name: "name",
          message: "What is your name?"
        })
          .then(({ name }: { name: string }) => name)
          .catch(console.error)
          .finally(() =>
            console.log("You can specify this with the --name flag in future")
          );
      }
    }
    const name = flags.name || "world";
    this.log(`hello pipeline ${name} from ./src/index.ts`);
  }
}

export = CheckGitlabPipeline;
