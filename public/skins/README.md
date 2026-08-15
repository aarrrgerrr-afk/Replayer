# Local skin models

This folder is intentionally shipped without Fortnite assets.

To use a locally exported model:

1. Export a character as a `.glb` with a tool such as Fortnite Porting, and make sure you have the right to use that export.
2. Put the file in this folder.
3. Add an entry to `manifest.json`, for example:

```json
{
  "version": 1,
  "skins": {
    "id:cid_556_athena_commando_f_rebirthdefaulta": {
      "url": "/skins/recruit.glb",
      "label": "Recruit · CID_556_Athena_Commando_F_RebirthDefaultA",
      "source": "local export"
    }
  }
}
```

The manifest key can match either the replay skin name (for example `midas`) or the extracted Character ID (for example `id:cid_556_athena_commando_f_rebirthdefaulta`). Missing, invalid, or failed models automatically fall back to the catalog icon and then the procedural avatar.

The website does not include or redistribute Fortnite-owned models.
