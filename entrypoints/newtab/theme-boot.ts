import { readMirror } from "../../src/settings/mirror.ts";
import { applyLook } from "../../src/themes/look.ts";

// Runs before first paint: apply the mirrored look so there is no flash of the wrong one.
const settings = readMirror();
if (settings) applyLook(settings);
