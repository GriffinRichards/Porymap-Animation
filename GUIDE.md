## Settings

After installation, the first thing you should take a look at is the `settings.js` file. Each of the settings should be largely self-explanatory, but they are described below.


| Setting | Description | Default value |
----------|-------------|-----------------
| `toggleShortcut` | The keyboard shortcut for `Toggle Map Animations` | `"Ctrl+A"` |
| `reloadShortcut` | The keyboard shortcut for `Reload Map Animations` | `""` |
| `animateOnLaunch` | Whether animations should be running when Porymap is first opened | `true` |
| `tilesetsPath` | The base filepath for all animation images | `"data/tilesets/"` |
| `primaryPath` | The base filepath for animation images in primary tilesets | `tilesetsPath + "primary/"` |
| `secondaryPath` | The base filepath for animation images in secondary tilesets | `tilesetsPath + "secondary/"` |
| `animFileExtension` | The file extension of all animation images* | `".png"` |
| `logPrefix` | All logs produced by the plug-in will use this string as a prefix | `"ANIM: "` |
| `logBasicInfo` | Logs when animations are turned on/off, and when they start/finish loading  | `true` |
| `logUsageInfo` | Logs which overlays have been used** | `false` |
| `logDebugInfo` | Logs all the loaded animation data** | `false` |
| `refreshTime` | The time in milliseconds between animation updates | `Math.round(1000 / 59.73)` |
| `mapExceptions` | An array of map names for maps that should never animate | `[""]` |

\* Animation images having more than one file extension is not currently supported as it seems like an unlikely use case. If your project needs this support please open an issue and it will be added.

\** Setting `logUsageInfo` and/or `logDebugInfo` to `true` will negatively affect Porymap's performance.

### Animation files
Note also the following section:
```
// Animation data
import {tilesetsData as em}   from './animations_pokeemerald.js';
import {tilesetsData as frlg} from './animations_pokefirered.js';
import {tilesetsData as rs}   from './animations_pokeruby.js';
export const versionData = [rs, frlg, em];
```
These are the files containing the animation data. If you would like to use your own file you need only change the filepath.

By default these files contain animation data for all the vanilla animations in each game version. If you would like to delete the files for the versions you are not using you may replace all 3 filepaths with the same file, or replace the exports with empty objects, e.g.
```
import {tilesetsData as em}   from './animations_pokeemerald.js';
export const versionData = [{}, {}, em];
```
Which data set in `versionData` that gets used depends on the value of `base_game_version` in your project's `porymap.project.cfg` file. `pokeruby` will use the first, `pokefirered` the second, and `pokeemerald` the third.

## Animation data format

After customizing settings you may want to add or change tile animations. Navigate to and open the `animations_<version>.js` file your project uses. If you're not sure which of the 3 it uses, see above.

### Tileset properties 

Each file contains a single object called `tilesetsData`. Each entry in this object is all the animation data for a given tileset. For example, let's look at the entry for `gTileset_Rustboro`

```
    "gTileset_Rustboro": {
        folder: "rustboro/anim",
        primary: false,
        tileAnimations: {
            640: { // (0x280)
                folder: "windy_water",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                frameOffsets: [1, 2, 3, 4, 5, 6, 7],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
            960: { // (0x3C0)
                folder: "fountain",
                frames: ["0", "1"],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
        },
    },
```
- The top property `"gTileset_Rustboro"` is the name of the tileset this data belongs to
- `folder: "rustboro/anim",` defines the base filepath for all animation images in this tileset, in this case `rustboro/anim`.
- `primary: false,` is whether or not this tileset is a primary tileset. This is not required; if it is excluded it will be assumed to be `false`.
- `tileAnimations` defines the object that contains data for each animating tile in this tileset.

### Required Animation properties

Let's look at the second entry in `tileAnimations`
```
           960: { // (0x3C0)
                folder: "fountain",
                frames: ["0", "1"],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
```
- `960` is the tile id this animation starts at. The commented value next to it is just for convenience; you may use either the decimal or hexadecimal tile id values.
- `folder: "fountain",` is the name of the folder containing the animation images, in this case `fountain`.
- `frames: ["0", "1"],` is an array of filenames for the animation images, and the order in which they should appear before looping. If they need to repeat they can be listed again in the array.
- `numTiles: 4,` is the number of tiles this animation spans. This means tiles 960, 961, 962, and 963 are all part of this animation.
- `interval: 8,` is the number of animation updates that will pass before the frame changes. A lower value is a faster animation.
- `imageWidth: 16,` is the width of each image for this animation.

These are all the basic, required properties to add for any new animation. There are also a few optional properties:

### Optional animation properties
- `frameOffsets`: Some animations have duplicates that use the same frames but are offset so that they show different frames at the same time. For example, the other animation in `gTileset_Rustboro` has
```
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                frameOffsets: [1, 2, 3, 4, 5, 6, 7],
```
This creates copies of the original animation starting after its last tile and with the frames shifted. This allows the creation of animations with an undulating effect. With the above `frameOffsets` there would be duplicate animations with the following frames:
```
frames: ["7", "0", "1", "2", "3", "4", "5", "6"], // Offset 1
frames: ["6", "7", "0", "1", "2", "3", "4", "5"], // Offset 2
frames: ["5", "6", "7", "0", "1", "2", "3", "4"], // Offset 3
frames: ["4", "5", "6", "7", "0", "1", "2", "3"], // Offset 4
frames: ["3", "4", "5", "6", "7", "0", "1", "2"], // Offset 5
frames: ["2", "3", "4", "5", "6", "7", "0", "1"], // Offset 6
frames: ["1", "2", "3", "4", "5", "6", "7", "0"], // Offset 7
```


- `externalFolder`: Normally the `folder` for an animation is assumed to be at the base path of the tileset it belongs to. If you'd like the path to instead be treated as absolute (starting from the project root) you can add `externalFolder: true,` to the animation. For example, in `gTileset_Lavaridge` tile 672 has
```
            672: { // (0x2A0)
                folder: "data/tilesets/secondary/cave/anim/lava",
                externalFolder: true,
                frames: ["0", "1", "2", "3"],
                numTiles: 4,
                interval: 16,
                imageWidth: 16,
            },
```
The animation images for this tileset will therefore come from `data/tilesets/secondary/cave/anim/lava`, instead of `data/tilesets/secondary/lavaridge/anim/ + folder`

## Creating an animation using `tileset_anims.c`

`src/tileset_anims.c` in your project is where in-game animations are defined. The plug-in will not interact with this file. This is a short explanation of how to derive the above data format from the information in this file. As an example we'll look at the floating log animations in `gTileset_Pacifidlog`. In this plug-in, its data looks like this:
```
            976: { // (0x3D0)
                folder: "log_bridges",
                frames: ["0", "1", "2", "1],
                numTiles: 30,
                interval: 16,
                imageWidth: 16,
            },
```
Let's see how the `folder`, `frames`, `numTiles`, `interval`, `imageWidth` and start tile `976` were obtained. 

### Getting `folder` and `imageWidth`
Navigate to the tileset animation folder for `gTileset_Pacifidlog`, which is `data/tilesets/secondary/pacifidlog/anim`. This is where the `log_bridges` folder is, and the images in this folder have a width of `16` pixels, so we add `folder: "log_bridges",` and `imageWidth: 16,`. It also has 3 images in it named `0.png`, `1.png`, and `2.png`. These are the frames, but first we need to know what order they go in.

### Getting `frames`

Navigate to `src/tileset_anims.c` and find where the above files are included
```c
const u16 gTilesetAnims_Pacifidlog_LogBridges_Frame0[] = INCBIN_U16("data/tilesets/secondary/pacifidlog/anim/log_bridges/0.4bpp");
const u16 gTilesetAnims_Pacifidlog_LogBridges_Frame1[] = INCBIN_U16("data/tilesets/secondary/pacifidlog/anim/log_bridges/1.4bpp");
const u16 gTilesetAnims_Pacifidlog_LogBridges_Frame2[] = INCBIN_U16("data/tilesets/secondary/pacifidlog/anim/log_bridges/2.4bpp");
```
These are the names given to the frames in the project. Next find where they're used
```c
const u16 *const gTilesetAnims_Pacifidlog_LogBridges[] = {
    gTilesetAnims_Pacifidlog_LogBridges_Frame0,
    gTilesetAnims_Pacifidlog_LogBridges_Frame1,
    gTilesetAnims_Pacifidlog_LogBridges_Frame2,
    gTilesetAnims_Pacifidlog_LogBridges_Frame1
};
```
Here we can see the order of the frames for this animation goes 0, 1, 2, 1. Using the filenames we can now add `frames: ["0", "1", "2", "1"],` to the animation.

### Getting the start tile id and `numTiles`
Find where the above frame table (`gTilesetAnims_Pacifidlog_LogBridges`) is used.
```c
static void QueueAnimTiles_Pacifidlog_LogBridges(u8 timer)
{
    u8 i = timer % 4;
    AppendTilesetAnimToBuffer(gTilesetAnims_Pacifidlog_LogBridges[i], (u16 *)(BG_VRAM + TILE_OFFSET_4BPP(NUM_TILES_IN_PRIMARY + 464)), 0x3C0);
}
```
`timer % 4` just ensures that `i` is within bounds of `gTilesetAnims_Pacifidlog_LogBridges`. This is equivalent to `u8 i = timer % ARRAY_COUNT(gTilesetAnims_Pacifidlog_LogBridges);`, it's not relevant for us here. We can get the start tile id from the second argument to `AppendTilesetAnimToBuffer`:
```c
(u16 *)(BG_VRAM + TILE_OFFSET_4BPP(NUM_TILES_IN_PRIMARY + 464))
```
By finding the definition of `NUM_TILES_IN_PRIMARY` we can see it's `512`, and `512+464` is `976`. This is the start tile for this animation. The last argument to `AppendTilesetAnimToBuffer` is the size to copy over. `0x3C0` is `960` in decimal. Each tile has a size of 32, so `960/32` gives us `numTiles`, which is `30`. Depending on your project this last argument may look like `30 * TILE_SIZE_4BPP` already, so it's even clearer that the number of tiles is `30`.


### Getting `interval`
Find where the above function (`QueueAnimTiles_Pacifidlog_LogBridges`) is used.
```c
static void TilesetAnim_Pacifidlog(u16 timer)
{
    if (timer % 16 == 0)
        QueueAnimTiles_Pacifidlog_LogBridges(timer >> 4);
    if (timer % 16 == 1)
        QueueAnimTiles_Pacifidlog_WaterCurrents(timer >> 4);
}
```
`if (timer % 16 == 0)` tells us that `QueueAnimTiles_Pacifidlog_LogBridges` will get called once every 16 updates, which gives us an interval of `16`. And that's it, now we have all the data we need to build this animation in the plug-in.
