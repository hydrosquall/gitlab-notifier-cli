gitlab-notifier
=====

A small CLI tool to notify when your gitlab jobs are done.

# Usage
<!-- usage -->
```sh-session


#
gitlab-notifier https://gitlab.ddbuild.io/DataDog/web-ui/pipelines/1796026
```
<!-- usagestop -->

# Local Dev

```
## example 1: global dep
## in this folder
yarn link --global
## in project folder
# gitlab-notifier pipeline YOUR_GITLAB_URL
gitlab-notifier pipeline https://gitlab.ddbuild.io/DataDog/web-ui/pipelines/1796026
```
