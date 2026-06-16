# Detecting configuration values

Some configuration file properties are set to `"detect"` by default.
These will be tried to detect using the overall repository context, but might fail, depending on the specific strategy used for the property.

## Using branch pattern

The `loaders` and `versions` property can be detected if the repository branches follow a specific pattern.
If one of these is configured to be detected, but cannot due to the branch pattern, the configuration will be invalid.

These three patterns are possible:

- `main/<loader>/<version>`
- `main/<loader>`
- `main/<version>`

`<loader>` has to be one of _neoforge_, _forge_, _fabric_ or _quilt_ and `<version>` has to follow the syntax of a semantic version (1)
{ .annotate }

1.  replacing the _patch_ part of the semantic version with an `x` is also valid here, it will be omitted in that case

!!! example "Here are some examples and the information that will be detected from them"

| Branch Name          | Detected loader | Detected version |
| -------------------- | --------------- | ---------------- |
| main/neoforge/1.21.x | `neoforge`      | `1.21`           |
| main/fabric/26.1.2   | `fabric`        | `26.1.2`         |
| main/forge/1.20      | `forge`         | `1.20`           |
| main/forge           | `forge`         | -                |
| main/forge           | `forge`         | -                |
| main/1.21.11         | -               | `1.21.11`        |
| main/1.20            | -               | `1.20`           |
| main/26.1.x          | -               | `26.1`           |

## Code owner

When setting the `assigne` property to `"@owner"`, the repository owner will be used.