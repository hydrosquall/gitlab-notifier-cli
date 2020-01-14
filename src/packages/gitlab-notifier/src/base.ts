import { Command } from "@oclif/command";
const { cosmiconfig } = require("cosmiconfig");
const explorer = cosmiconfig("gitlab-pipeline");
var debug = require("debug")("mycli:base");

type ConfigType = {
  name?: string;
  // gitlabToken?: string;
};

export default abstract class Base extends Command {
  static config: null | ConfigType;
  async init() {
    const config = await explorer.search();
    // { config, filepath } // if not null, check for configuration

    // debug("parsing config", { config, filepath });
    this.config = config;
  }
}
