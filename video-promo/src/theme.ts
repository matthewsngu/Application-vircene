import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Palette reprise du design system Vircène (css/app-hub.css + logo)
export const colors = {
  ink: "#141414",
  inkSoft: "rgba(20, 20, 20, 0.72)",
  cream: "#F9F2EB",
  beige: "#DBC4AF",
  gold: "#C4A06A",
  white: "#FFFFFF",
};

// Polices stockées localement dans public/fonts (Fraunces + Archivo, OFL)
export const serif = "Fraunces";
export const sans = "Archivo";

const fonts = [
  { family: serif, file: "Fraunces-Regular.ttf", weight: "400", style: "normal" },
  { family: serif, file: "Fraunces-SemiBold.ttf", weight: "600", style: "normal" },
  { family: serif, file: "Fraunces-Italic.ttf", weight: "400", style: "italic" },
  { family: sans, file: "Archivo-Regular.ttf", weight: "400", style: "normal" },
  { family: sans, file: "Archivo-SemiBold.ttf", weight: "600", style: "normal" },
];

for (const f of fonts) {
  loadFont({
    family: f.family,
    url: staticFile(`fonts/${f.file}`),
    weight: f.weight,
    style: f.style,
  });
}
