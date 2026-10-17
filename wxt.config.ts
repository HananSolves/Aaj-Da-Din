import { defineConfig } from "wxt";

// project-plan §3.2 Step 0: MV3 for every browser, `storage` only, no background script,
// no host permissions. The newtab entrypoint becomes chrome_url_overrides.newtab.
export default defineConfig({
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Tarikh",
    description:
      "A new tab for South Asia: today's date in the calendars you follow, festivals, a daily photo and fact. No tracking.",
    permissions: ["storage"],
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          // TODO: replace with the permanent AMO id before the first Firefox upload.
          id: "tarikh@example.org",
          strict_min_version: "140.0",
          // Not yet in WXT's manifest types.
          data_collection_permissions: { required: ["none"] },
        },
      },
    }),
  }),
});
