import { readMirror } from "../../src/settings/mirror.ts";

// Runs before first paint: apply the mirrored theme so there is no flash of the wrong one.
const theme = readMirror()?.theme;
if (theme) document.documentElement.dataset.theme = theme;
