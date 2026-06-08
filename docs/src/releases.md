# Release Strategy

## Triggered by a GitHub Release

Every time a GitHub release is published, a github action workflow is triggered, that does the following:

- build the mod
- publish to mod to [Maven](https://registry.somethingcatchy.net/)
- upload the mod to [Modrinth](https://modrinth.com/)
- upload the mod to [CurseForge](https://www.curseforge.com/)

It uses the release tag as the mod version and the release description as a changelog.
The `mod_version` property in the `gradle.properties` file is always set to `0.0.0-dev` for these projects, as it will be overwritten by the CI when releasing.

### Snapshot versions

If there is a draft release present in GitHub targeting a specific branch,
every pushed commit will trigger a build that will be published to [Maven](https://registry.somethingcatchy.net/) as a `-SNAPSHOT` version.

For example, a release draft targeting `main/1.21.x` with the tag `5.2.0` will build a mod jar with the version `5.2.0` and publish it as `5.2.0-SNAPSHOT`.

This allows indev-builds to already be included in the dependencies of other mods that are using them as an API,
before the version is completely finished and published to Modrinth/CurseForge.

### Example Projects

<div class="grid examples" markdown>

- ![](https://raw.githubusercontent.com/PssbleTrngle/DyeTheWorld/refs/heads/main/1.21.x/.idea/icon.png) [Dye the World!](https://github.com/PssbleTrngle/DyeTheWorld)
- ![](https://raw.githubusercontent.com/TeamGalena/Oreganized/refs/heads/main/1.21.x/.idea/icon.png) [Oreganized](https://github.com/TeamGalena/Oreganized)

</div>

## Triggered by any code change

Some projects, like libraries, are only published to [Maven](https://registry.somethingcatchy.net/).
For these it might be useful to just always publish a new version every time new commits are pushed to a main branch.

For these versions, the `mod_version` property contains a `<patch>` part, which will be overwritten by an incrementing number received from GitHub.

### Example Projects

<div class="grid examples" markdown>

- ![](https://raw.githubusercontent.com/PssbleTrngle/Atmosphere/refs/heads/main/1.21.x/.idea/icon.png) [Atmosphere](https://github.com/PssbleTrngle/Atmosphere)

</div>

## Notifactions

After a release is published, a GitHub webhook listening to action workflow runs is used to detect when a release is done or has failed.
Depending on the notification options for the specific Repository/User/Organization a message will be send to a Discord channel.

It can work without it, but works best with a `release.json` file that can also include additional information, like the Modrinth & CurseForge urls of the uploaded version.
