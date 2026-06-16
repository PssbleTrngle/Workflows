# Triggered by any code change

Some projects, like libraries, are only published to [Maven](https://registry.somethingcatchy.net/).
For these it might be useful to just always publish a new version every time new commits are pushed to a main branch.

For these versions, the `mod_version` property contains a `<patch>` part, which will be overwritten by an incrementing number received from GitHub.

## Example Projects

<div class="grid examples" markdown>

- ![](https://raw.githubusercontent.com/PssbleTrngle/Atmosphere/refs/heads/main/1.21.x/.idea/icon.png) [Atmosphere](https://github.com/PssbleTrngle/Atmosphere)

</div>