# File Generation

The [GitHub App](https://github.com/apps/pssbletrngle-workflows) can generate a variety of files using a [config file](/configuration) as input.
It will also keep them updated when the underlying templates get updated, making it easy to have a common structure across multiple repositories and branches.

It also generated a header that is used again by the application on subsequent runs. 
By default the application will not overwrite files that have not being generated, which is detected by checking this header.
If wanted, this check can be turned of using the `overwrite` property.

??? abstract "Format of the generated header"

    ```xml
    <meta>
       <source>@pssbletrngle/github-meta-generator</source>
       <version>1.0.84</version>
       <timestamp>2026-06-08T09:56:01.413Z</timestamp>
       <hash>9da437811bc1d494</hash>
    </meta>
    ```

By default the application commits these files directly to the targeted branch.
Using the `strategy` property you can also configure it to create a pull request using a branch it will create itself.

## GitHub workflows

!!! info "can be disabled by setting the `workflows` property to `false`"

Depending on the [configuration](/configuration), a `test.yml`, a `release.yml` and a `labeler.yml` is generated.

- The `release.yml` workflow takes care of the automatic release as described [here](/releases).
The property `upload.strategy` defines when the release is triggered and can be either `push` or `release` :material-information-outline:{ title="the default value" }

- The `test.yml` workflow takes care of running various checks, including [Spotless](https://github.com/diffplug/spotless), [JUnit Tests](https://junit.org/) and [SonarQube](https://www.sonarsource.com/products/sonarqube/), if any of these are configured.
To sonar check is only enabled if the property `sonar` is set to `true`.

    It also takes care of [publishing snapshot versions](/releases/on-github-release#snapshot-versions), unless the property `upload.snapshots` is set to `false`.
This is done by passing the environment variable `SNAPSHOT` to the gradle commands. Everything else has to be done by the gradle setup itself.
The [com.possible-triangle.*](https://docs.somethingcatchy.net/latest/publishing/#uploading) plugins react to this variable and configure the publishing accordingly.

- The `labeler.yml` workflows uses [github/issue-labeler](https://github.com/github/issue-labeler) to automatically set some labels on newly created issues.
It uses a [config file](#labeler-config) that is also being generated.

## Issue Templates

!!! info "can be disabled by setting the `issueTemplates` property to `false`"

[Issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository#creating-issue-forms) are YAML files defining a form with various inputs that issue reporters have to fill out when creating a ticket.

There is a _Feature Request_ and a _Bug Report_ template generated. The app also sets the `blank_issues_enabled` to `false` in `.github/config.yml` to force reports to select one of these templates.

There is nothing preventing you from defining additional issue templates.

## Editor Config

!!! info "can be disabled by setting the `editorconfig` property to `false`"

An [.editorconfig](https://editorconfig.org/) file is being generated, defining some basic styling requirements.

## License

!!! info "can be disabled by setting the `license` property to `false`"

A basic MIT licenses that excludes any assets and marks them as ARR

## Labeler Config

!!! info "can be disabled by setting the `configs` property to `false`"

This file specifies some issue labels that are automatically added to new issues depending on the issue title and description.
These currently are the minecraft version (1) and mod loader (2) labels.
{ .annotate }

1.  for example `1.21.x` or `26.1.x`
2.  for example `neoforge` or `fabric`