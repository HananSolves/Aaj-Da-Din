import { defineConfig } from "wxt";

// Plan §3 Step 0: MV3 for every browser, `storage` only, no background script,
// no host permissions. The newtab entrypoint becomes chrome_url_overrides.newtab.
export default defineConfig({
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Aaj Da Din",
    description:
      "A Punjabi new tab: today's date in Punjabi calendars, festivals, a daily photo and fact. No tracking.",
    permissions: ["storage"],
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          // TODO: replace with the permanent AMO id before the first Firefox upload.
          id: "aajdadin@example.org",
          strict_min_version: "140.0",
          // Not yet in WXT's manifest types.
          data_collection_permissions: { required: ["none"] },
        },
      },
    }),
  }),
});
