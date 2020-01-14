gitlab-notifier
=====

A small CLI tool to notify when your gitlab jobs are done.

## Usage

```bash
# gitlab-notifier pipeline YOUR_GITLAB_URL
gitlab-notifier pipeline https://gitlab.ddbuild.io/DataDog/web-ui/pipelines/1796026
```

## Local Dev

```bash
## example 1: global dep
## in this folder
yarn link --global
```

## Future

- Watch Gitlab jobs tool
- Use a state machine for retry logic
- Autodetect what to watch based on the URL
- Some documentation
