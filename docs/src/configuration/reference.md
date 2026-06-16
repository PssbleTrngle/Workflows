# Configuration Reference

The `.github/metadata-config.json` file is being used by the [GitHub App](https://github.com/apps/pssbletrngle-workflows) to fine-tune the behaviour of the [File Generation](/file-generation).

There is a [JSON Schema](https://workflows.somethingcatchy.net/schema/config.json) available that can be used.

It is also versioned and will be automatically migrated if possible if the `$version` property is outdated.

```json title="Full configuration reference"
{
  "$version": "1.0", // required
  "$schema": "https://workflows.somethingcatchy.net/schema/config.json", // optional, will be added by migration
  "type": "minecraft", // required (1)
  "loaders": [string] | "detect", // "detect" by default (2)
  "versions": [string] | "detect", // "detect" by default (3)
  "strategy": "pull_request" | "push", // "push" by default (4)
  "overwrite": "always" | "generated", // "generated" by default (5)
  "assigne": null | string | "@owner", // null by default (6)
  "upload": { 
    "strategy": "release" | "push", // "release" by default (7) 
    "snapshots": boolean, // disabled by default (8)
    "curseforge": boolean, // disabled by default  (9)
    "modrinth": boolean, // disabled by default (10)
    "github": boolean, // disabled by default (11)
    "nexus": boolean // disabled by default (12)
  },
  "sonar": boolean, // disabled by default (13)
  "issueTemplates": boolean, // enabled by default (14)
  "workflows": boolean, // enabled by default (15)
  "license": boolean, // enabled by default (16)
  "configs": boolean, // enabled by default (17)
  "editorconfig": boolean // enabled by default (18)
}
```

1.  Currently only `minecraft` is possible, there are some plans to also support a generic `web` setup
2.  List of mod loaders, for example `neoforge` or `fabric`.
    They can also be [detected using the repository setup](detection).
3.  List of minecraft versions, for example `1.20` or `26.1`. Can also include patch versions like `1.21.11`.
    They can also be [detected using the repository setup](detection).
4.  `push` will commit the [generated files](/file-generation) directly to the branch,
    `pull_request` will create a new branch and open a pull request.
5.  `generated` will only overwrite previously [generated files](/file-generation),
    `always` will also overwrite files that have not been created by the app.
6.  if set, will be included as a default assignee in the [generated issue templates](/file-generation#issue-templates).
    setting it to `@owner` will use the [detected](detection) repository owner.
7.  you can read about the two release strategies in detail [here](/releases)
8.  if enabled will also publish `-SNAPSHOT` versions on each push as described [here](/releases/on-github-release#snapshot-versions).
9.  will pass the `CURSEFORGEW_TOKEN` secret as an environment variable to the release workflow.
10.  will pass the `MODRINTH_TOKEN` secret as an environment variable to the release workflow.
11.  will pass the `GITHUB_TOKEN` secret as an environment variable to the release workflow.
12.  will pass the `NEXUS_USER` and `NEXUS_TOKEN` secret as an environment variable to the release workflow.
     These are used by the [com.possible-triangle.*](https://github.com/PssbleTrngle/GradleHelper) plugins
     to publish to a [Maven Repository](https://registry.somethingcatchy.net/#browse/browse:maven-releases).
13.  The [generated test workflow](/file-generation#github-workflows) will run the `sonar` gradle task,
     added by the [SonarQube plugin](https://plugins.gradle.org/plugin/org.sonarqube).
     It passes the `SONAR_HOST_URL` and `SONAR_TOKEN` secrets as environmental variables.
14.  will disable [issue template generation](/file-generation#issue-templates).
15.  will disable [github workflow generation](/file-generation#github-workflows).
16.  will disable [license generation](/file-generation#license).
17.  will disable [labeler config generation](/file-generation#labeler-config).
18.  will disable [EditorConfig generation](/file-generation#editor-config).