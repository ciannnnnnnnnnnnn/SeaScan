# Seagrass 3D library for SeaScan

Life-size 3D models of nine Indo-Pacific seagrasses, a species data file, and a drop-in web viewer.

| Species | File | Height above sediment |
|---|---|---|
| *Enhalus acoroides* | `models/enhalus-acoroides.glb` | ~92 cm |
| *Thalassia hemprichii* | `models/thalassia-hemprichii.glb` | ~20 cm |
| *Cymodocea rotundata* | `models/cymodocea-rotundata.glb` | ~19 cm |
| *Cymodocea serrulata* | `models/cymodocea-serrulata.glb` | ~18 cm |
| *Halodule pinifolia* | `models/halodule-pinifolia.glb` | ~20 cm |
| *Halodule uninervis* | `models/halodule-uninervis.glb` | ~15 cm |
| *Halophila minor* | `models/halophila-minor.glb` | ~1.4 cm |
| *Halophila ovalis* | `models/halophila-ovalis.glb` | ~3.9 cm |
| *Syringodium isoetifolium* | `models/syringodium-isoetifolium.glb` | ~25 cm |

## What's in the folder

```
models/              9 × .glb (glTF 2.0 binary), 5.7 MB in total
species.json         names, descriptions, ID features, sizes, look-alikes, label positions
seagrass-viewer.js   <seagrass-viewer> web component (wraps Google's <model-viewer>)
index.html           example library page using all of the above
source/generator.js  the code that generated the models (to tweak or regenerate them)
```

## Add it to SeaScan (2 steps)

1. Copy the folder into your web app's static/public files, e.g. `/public/seagrass/`.
2. On a species page:

```html
<script type="module" src="/seagrass/seagrass-viewer.js"></script>

<seagrass-viewer species="halophila-ovalis"></seagrass-viewer>
```

That's it. The viewer finds `species.json` and `models/` next to the script. It gives users drag-to-rotate, zoom, a **Labels** button (named parts), a **Sway** toggle and **Reset view**.

### Options

| Attribute | What it does |
|---|---|
| `species` | Species id (the `id` field in `species.json`). Change it to switch models. |
| `base` | Folder with `species.json` and `models/`, if it isn't next to the script. |
| `labels="true"` | Open with the part labels showing. |
| `no-sway` | Start with the swaying animation paused. |
| `ar` | Show the "view in your space" AR button on supported phones (needs HTTPS). The models are life size, so AR shows the plant at real scale. |
| `model-viewer-src` | Where to load `<model-viewer>` from. By default it loads from the jsDelivr CDN. To self-host, `npm i @google/model-viewer` and point this at `model-viewer.min.js`. |

Styling (CSS custom properties): `--sg-height` (default 520px), `--sg-radius`, `--sg-bg`, `--sg-accent`, `--sg-font`.

Events: `seagrass-load` (detail = the species entry from the JSON) and `seagrass-error`.

### React / Vue / Angular

It's a standard web component, so it works in any framework. Import the script once, then use the tag:

```jsx
import '/seagrass/seagrass-viewer.js';
export const SeagrassModel = ({ id }) => <seagrass-viewer species={id} />;
```

(In Vue, add `seagrass-viewer` to `compilerOptions.isCustomElement`. In Angular, add `CUSTOM_ELEMENTS_SCHEMA`.)

### Using the models without the viewer

The `.glb` files work with any glTF viewer: Three.js `GLTFLoader`, Babylon.js, `<model-viewer>`, Unity/Unreal importers, Blender.

- **Units:** metres. **Origin:** the sediment surface is at y = 0. Roots and rhizome sit below it.
- **Named parts:** `Leaves`, `LeafSheaths`, `ErectStems`, `Rhizome`, `LeafScars`, `Roots`, `Bristles` (*Enhalus*), and for *Halophila*: `Petioles`, `LeafBlades`, `Scales`. `Sediment` is a translucent disc you can hide.
- **Animation:** one 8-second looping clip, `Sway`, driven by two morph targets. Frame 0 is the rest pose, which matches the label positions.
- **Compression:** the files use `KHR_mesh_quantization`, which all major glTF loaders support. They need no extra decoders.

## species.json

```jsonc
{
  "version": 1,
  "species": [{
    "id": "halophila-ovalis",
    "scientificName": "Halophila ovalis",
    "commonName": "Spoon grass, paddle weed",   // null where no common name is in consistent use
    "family": "Hydrocharitaceae",
    "synonyms": [],
    "tagline": "...", "description": "...",
    "idFeatures": ["..."],
    "measurements": { "leafLength": "1–4 cm", "leafWidth": "0.5–2 cm", "rhizome": "..." },
    "habitat": "...",
    "lookAlikes": [{ "id": "halophila-minor", "howToTell": "..." }],
    "model": { "file": "models/halophila-ovalis.glb", "heightAboveSedimentCm": 3.9, "depthBelowSedimentCm": 9.7, "parts": [...] },
    "hotspots": [{ "id": "blade", "label": "Leaf blade", "note": "...", "position": "x y z (metres)" }]
  }]
}
```

Several of these species have no widely agreed English common name, so `commonName` is `null` for them. Add local names (Filipino, Cebuano, etc.) here if SeaScan uses them.

## Accuracy notes

The plants are built procedurally from published measurements. These include leaf length and width, tip shape, sheath colour, rhizome thickness, roots per node, and leaf scars. Sources include the Seagrass-Watch identification guide, SeagrassNet's Indo-Pacific bioregion guide, Flora Malesiana, and Kew's Plants of the World Online. Each model is a typical plant, not a measured specimen. Real plants vary a lot with depth, light and sediment.

*Cymodocea serrulata* is listed under *Oceana serrulata* in some newer databases (WoRMS, from 2021). The JSON lists it as a synonym.

## Credits & licences

The viewer uses Google's [`<model-viewer>`](https://modelviewer.dev) (Apache 2.0). The models and data in this folder were generated for SeaScan.
