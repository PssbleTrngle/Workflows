---
hide:
  - navigation
---

# What brought you here?

- I've seen [![](/assets/bot.svg){ .inline-icon } pssbletrngle-workflows[bot]](https://github.com/apps/pssbletrngle-workflows) create commits in a repository
- I'm wondering how the automatic releases work for a mod I've seen
- I've seen an automated discord notifaction about a mod release

---

# What is this?

Workflows is a Website & GitHub Application that uses webhooks to react to specific github events.
It's features include:

- Generating & updating repository config files, like [GitHub workflows](/file-generation#github-workflows) or [Issue Templates](/file-generation#issue-templates)
- [Sending notifactions](/releases/notifications) to various configured discord webhooks
- Providing an overview over the state of your minecraft repositories by providing an UI

It can be used without any of them, but is meant to integrate with the [com.possible-triangle.*](https://github.com/PssbleTrngle/GradleHelper) gradle plugins, which use the various parameters passed by the generated workflows and use them accordingly.

Together, both of these allow a very easy and standardized [release process](/releases) including uploading mods to modrinth, curseforge and maven.