
# gitlab-notifier-cli

A friendly CLI for getting notified when gitlab pipelines complete, from the comfort of your terminal. Supports launching retries too.

## Installation

Make sure you have `yarn` installed before proceeding.

```bash
# Clone this repository
git clone git@github.com:hydrosquall/gitlab-notifier-cli.git

# Switch directories
cd src/packages/gitlab-notifier

# Install dependencies
yarn install

# Make the CLI available to projects outside of this folder
yarn link --global
```

TODO: Gitlab / Environment variable / configuration file setup / NPM install instructions

## Usage

```bash
gitlab-notifier pipeline "your-gitlab-pipeline-url-here"
```

### Todo

- Bundle up with TSDX
- Publish to NPM
- Tests?
- Polish readme
- Deploy to NPM if build completes successfully
- Add a plugin that will notify people when new versions of the CLI are available
-
Completed as a learning exercise, practicing using OCLIF for make tools for personal productivity.

### Acknowledgements

- SWYX's OCLIF course on Egghead.io
- The Heroku team for open-sourcing OCLIF
- Gitlab for clearly documenting their API
