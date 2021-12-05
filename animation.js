/*
    Prototype for Porymap animation script.

    TODO:
    - Map switching is still broken
    - Allow offest animations
    - Properly remove old overlays


    OPTIMIZATION:

    # Initial
        Petalburg
        - Animation time: ~0
        - Build time: ~25
        - Overlays consumed: 305

        Slateport
        - Animation time: ~6
        - Build time: ~1625
        - Overlays consumed: 17320

        Route 124
        - Animation time: ~35
        - Build time: ~16456
        - Overlays consumed: 191677

    # After introducing curAnimToOverlayMap
        Petalburg
        - Animation time: ~0
        - Build time: ~25
        - Overlays consumed: 113

        Slateport
        - Animation time: ~3
        - Build time: ~1439
        - Overlays consumed: 5597

        Route 124
        - Animation time: ~13
        - Build time: ~16108
        - Overlays consumed: 60419


    # After introducing allStaticOverlays[]
        Petalburg
        - Animation time: ~0
        - Build time: ~25
        - Overlays consumed: 81

        Slateport
        - Animation time: ~3
        - Build time: ~1432
        - Overlays consumed: 4389

        Route 124
        - Animation time: ~13
        - Build time: ~15704
        - Overlays consumed: 45089




*/

//====================
//   Animation Data
//====================

const tilesetsData = {
    "gTileset_General": {
        folder: "general/anim",
        primary: true,
        tileAnimations: {
            432: { // (0x1B0)
                folder: "water",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                numTiles: 30,
                interval: 16,
                imageWidth: 16,
            },
            464: { // (0x1D0)
                folder: "sand_water_edge",
                frames: ["0", "1", "2", "3", "4", "5", "6"],
                numTiles: 10,
                interval: 16,
                imageWidth: 16,
            },
            480: { // (0x1E0)
                folder: "land_water_edge",
                frames: ["0", "1", "2", "3"],
                numTiles: 10,
                interval: 16,
                imageWidth: 80,

            },
            496: { // (0x1F0)
                folder: "waterfall",
                frames: ["0", "1", "2", "3"],
                numTiles: 6,
                interval: 16,
                imageWidth: 8,
            },
            508: { // (0x1FC)
                folder: "flower",
                frames: ["0", "1", "0", "2"],
                numTiles: 4,
                interval: 16,
                imageWidth: 16,
            },
        }
    },
    "gTileset_Building": {
        folder: "building/anim",
        primary: true,
        tileAnimations: {
            496: { // This is an unused version of the TV that's always on
                folder: "tv_turned_on",
                frames: ["0", "1"],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
        },
    },
    "gTileset_Rustboro": {
        folder: "rustboro/anim",
        primary: false,
        tileAnimations: {
            /*: { //VDEST
                folder: "windy_water/",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                numTiles: ,
                interval: 8,
                imageWidth: 16,
            },*/
            960: { // 0x3C0
                folder: "fountain",
                frames: ["0", "1"],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
        },
    },
    "gTileset_Dewford": {
        folder: "dewford/anim",
        primary: false,
        tileAnimations: {
            682: { // Unused in vanilla
                folder: "flag",
                frames: ["0", "1", "2", "3"],
                numTiles: 6,
                interval: 8,
                imageWidth: 24,
            },
        },
    },
    "gTileset_Slateport": {
        folder: "slateport/anim",
        primary: false,
        tileAnimations: {
            736: {
                folder: "balloons",
                frames: ["0", "1", "2", "3"],
                numTiles: 4,
                interval: 16,
                imageWidth: 16,
            },
        },
    },
    "gTileset_Mauville": {
        folder: "mauville/anim",
        primary: false,
        tileAnimations: {
            /*: { // VDEST
                folder: "flower_1",
                frames: ["0", "1", "2", "3", "4"],
                numTiles: ,
                interval: 8,
                imageWidth: 16,
            },
            : {
                folder: "flower_2",
                frames: ["0", "1", "2", "3", "4"],
                numTiles: ,
                interval: 8,
                imageWidth: 16,
            },*/
        },
    },
    "gTileset_Lavaridge": {
        folder: "lavaridge/anim",
        primary: false,
        tileAnimations: {
            800: {
                folder: "steam",
                frames: ["0", "1", "2", "3"],
                offsetCopies: [2],
                numTiles: 4,
                interval: 16,
                imageWidth: 16,
            },
            804: { // TODO: Collapse as a frame offset of above
                folder: "steam",
                frames: ["2", "3", "0", "1"],
                numTiles: 4,
                interval: 16,
                imageWidth: 16,
            },
            672: { // Lavaridge's lava gets its images from the cave tileset
                folder: "data/tilesets/secondary/cave/anim/lava",
                externalFolder: true,
                frames: ["0", "1", "2", "3"],
                numTiles: 4,
                interval: 16,
                imageWidth: 16,
            },
        },
    },
    "gTileset_EverGrande": {
        folder: "ever_grande/anim",
        primary: false,
        tileAnimations: {
            /*: { // VDEST
                folder: "flowers",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },*/
        },
    },
    "gTileset_Pacifidlog": {
        folder: "pacifidlog/anim",
        primary: false,
        tileAnimations: {
            976: {
                folder: "log_bridges",
                frames: ["0", "1", "2"],
                numTiles: 30,
                interval: 16,
                imageWidth: 16,
            },
            1008: {
                folder: "water_currents",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                numTiles: 8,
                interval: 16,
                imageWidth: 16,
            },
        },
    },
    "gTileset_Sootopolis": {
        folder: "sootopolis/anim",
        primary: false,
        tileAnimations: {
            752: {
                folder: "stormy_water",
                frames: ["0_kyogre", "1_kyogre", "2_kyogre", "3_kyogre", "4_kyogre", "5_kyogre", "6_kyogre", "7_kyogre"],
                numTiles: 48,
                interval: 16,
                imageWidth: 64,
            },
            800: {
                folder: "stormy_water",
                frames: ["0_groudon", "1_groudon", "2_groudon", "3_groudon", "4_groudon", "5_groudon", "6_groudon", "7_groudon"],
                numTiles: 48,
                interval: 16,
                imageWidth: 64,
            },
        },
    },
    "gTileset_BattleFrontierOutsideWest": {
        folder: "battle_frontier_outside_west/anim",
        primary: false,
        tileAnimations: {
            730: {
                folder: "flag",
                frames: ["0", "1", "2", "3"],
                numTiles: 6,
                interval: 8,
                imageWidth: 24,
            },
        },
    },
    "gTileset_BattleFrontierOutsideEast": {
        folder: "battle_frontier_outside_east/anim",
        primary: false,
        tileAnimations: {
            730: {
                folder: "flag",
                frames: ["0", "1", "2", "3"],
                numTiles: 6,
                interval: 8,
                imageWidth: 24,
            },
        },
    },
    "gTileset_Underwater": {
        folder: "underwater/anim",
        primary: false,
        tileAnimations: {
            1008: {
                folder: "seaweed",
                frames: ["0", "1", "2", "3"],
                numTiles: 4,
                interval: 16,
                imageWidth: 16,
            },
        },
    },
    "gTileset_SootopolisGym": {
        folder: "sootopolis_gym/anim",
        primary: false,
        tileAnimations: {
            976: {
                folder: "front_waterfall",
                frames: ["0", "1", "2"],
                numTiles: 20,
                interval: 8,
                imageWidth: 32,
            },
            1008: { // Unused in vanilla
                folder: "side_waterfall",
                frames: ["0", "1", "2"],
                numTiles: 12,
                interval: 8,
                imageWidth: 16,
            },
        },
    },
    "gTileset_Cave": {
        folder: "cave/anim",
        primary: false,
        tileAnimations: {
            928: {
                folder: "lava",
                frames: ["0", "1", "2", "3"],
                numTiles: 4,
                interval: 16,
                imageWidth: 16,
            },
        },
    },
    "gTileset_EliteFour": {
        folder: "elite_four/anim",
        primary: false,
        tileAnimations: {
            992: {
                folder: "floor_light",
                frames: ["0", "1"],
                numTiles: 4,
                interval: 64,
                imageWidth: 16,
            },
            1016: {
                folder: "wall_lights",
                frames: ["0", "1", "2", "3"],
                numTiles: 1,
                interval: 8,
                imageWidth: 8,
            },
        },
    },
    "gTileset_MauvilleGym": {
        folder: "mauville_gym/anim",
        primary: false,
        tileAnimations: {
            656: {
                folder: "electric_gates",
                frames: ["0", "1"],
                numTiles: 16,
                interval: 2,
                imageWidth: 16,
            },
        },
    },
    "gTileset_BikeShop": {
        folder: "bike_shop/anim",
        primary: false,
        tileAnimations: {
            1008: {
                folder: "blinking_lights",
                frames: ["0", "1"],
                numTiles: 9,
                interval: 4,
                imageWidth: 24,
            },
        },
    },
    "gTileset_BattlePyramid": {
        folder: "battle_pyramid/anim",
        primary: false,
        tileAnimations: {
            647: {
                folder: "statue_shadow",
                frames: ["0", "1", "2"],
                numTiles: 8,
                interval: 8,
                imageWidth: 16,
            },
            663: {
                folder: "torch",
                frames: ["0", "1", "2"],
                numTiles: 8,
                interval: 8,
                imageWidth: 16,
            },
        },
    },
};


//====================
//     Settings
//====================

const toggleShortcut = "Ctrl+A"
const animateOnLaunch = true;
const logPrefix = "ANIM: ";

// Filepaths
const tilesetsPath = "data/tilesets/"
const primaryPath = tilesetsPath + "primary/";
const secondaryPath = tilesetsPath + "secondary/";
const animFileExtension = ".png";

// Basic tile/metatile size information
const tileWidth = 8;
const tileHeight = 8;
const metatileTileWidth = 2;
const metatileTileHeight = 2;
const tilesPerLayer = metatileTileWidth * metatileTileHeight;
const metatileWidth = tileWidth * metatileTileWidth;
const metatileHeight = tileHeight * metatileTileHeight;

// Timing
const refreshRate = 16;
const defaultTimerMax = 55440 // Arbitrary "highly composite" number




//====================
//     Program
//====================

var root = "";
var timer = 0;
var timerMax = defaultTimerMax;
var animating = false;
var animateFuncActive = false;

// 2D array of objects tracking which overlays belong to which map spaces.
// It's accessed with x/y map coordinates, e.g. overlayRangeMap[x][y], and
// returns an object with a 'start' and 'end' property which are the first
// and max overlay used by that map space. This is used to clear the overlays
// for a space when it's drawn on.
var overlayRangeMap;
var numOverlays = 1;

// 3D array
var overlayMap = {};

// Array of all the active static overlays. Used to re-show them after toggling animation.
var allStaticOverlays = [];

// Object for caching data about how to build an animation for a given metatile so
// that when it's encountered again the animation can be created faster.
// Each metatile id is a property, the value of which is an object that holds the
// positions of animated tiles (animTilePositions), the positions of static tiles
// layered on top of animated tiles (staticTilePositions), and all the tiles (tiles).
var metatileScanCache = {};

// Object for storing data on all the possible tile animations in the current primary/secondary tilesets.
// Each tile id is a property.
// The values are objects with the same properties as those in tileAnimations
var curTilesetsAnimData = {};

// Object for tracking which animations have been encountered already on the current
// metatile layer so that they can be grouped together on the same overlays.
// Properties are the 'identifier' field of the tile animations encountered,
// values are the overlay the first frame belongs to.
var curAnimToOverlayMap = {};

// Whether or not the animations should be reloaded.
// This needs to happen when the map or tilesets change.
var loadAnimations = true;

var mapWidth;
var mapHeight;

var tilesPerMetatile;

//-------------------
// Main Callbacks
//-------------------

export function onProjectOpened(projectPath) {
    root = projectPath + "/";
    tilesPerMetatile = map.getNumTilesInMetatile();
    map.registerAction("toggleAnimation", "Toggle map animations", toggleShortcut);
    buildTilesetsData();
    if (animateOnLaunch) toggleAnimation();
}

export function onMapOpened(mapName) {
    map.clearOverlay();
    mapWidth = map.getWidth();
    mapHeight = map.getHeight();
    loadAnimations = true;
}

// TODO (On API's end): onBlockChanged is not triggered by Undo/Redo
export function onBlockChanged(x, y, prevBlock, newBlock) {
    if (!animating || newBlock.metatileId == prevBlock.metatileId)
        return;

    // Erase old animation
    if (posHasAnimation(x, y)) {
        for (let i = overlayRangeMap[x][y].start; i < overlayRangeMap[x][y].end; i++)
            map.clearOverlay(i);
        // TODO: Remove overlay lists from overlayMap
    }

    tryAddAnimation(x, y);
}

export function onTilesetUpdated(tilesetName) {
    map.clearOverlay();
    loadAnimations = true;
}

//-------------------
// Animation running
//-------------------

export function animate() {
    if (!animating) {
        // Stop animation
        animateFuncActive = false;
        map.hideOverlay();
        return;
    }
    if (loadAnimations) {
        resetAnimation();
        benchmark_init();
        loadMapAnimations();
        benchmark_log("build animations");
        log("Took " + numOverlays + " overlays");
    }
    updateOverlays(timer);
    timer++;
    if (timer > timerMax)
        timer = 0;
    map.setTimeout(animate, refreshRate);
}

export function toggleAnimation() {
    animating = !animating;
    log("Animations " + (animating ? "on" : "off"));
    if (animating) tryStartAnimation();
}

function tryStartAnimation() {
    // Only call animation loop if it's not already running.
    if (!animateFuncActive) {
        animateFuncActive = true;
        animate();
    }
    // Show static overlays
    for (let i = 0; i < allStaticOverlays.length; i++)
        map.showOverlay(allStaticOverlays[i]);
}

function resetAnimation() {
    map.clearOverlay();
    numOverlays = 1;
    timer = 0;
    timerMax = calculateTimerMax();
    overlayMap = {};
    allStaticOverlays = [];
}

//
// This function is responsible for visually running the animation.
// It does this by selectively hiding and showing overlays that each
// have a different tile frame image on them.
//
function updateOverlays(timer) {
    // For each timing interval of the current animations
    for (const interval in overlayMap) {
        if (timer % interval == 0) {
            benchmark_init();
            let overlayLists = overlayMap[interval];
            // For each tile animating at this interval
            for (let j = 0; j < overlayLists.length; j++) {
                let overlayList = overlayLists[j];
                // Hide the previous frame, show the next frame
                let curFrame = (timer / interval) % overlayList.length;
                let prevFrame = curFrame ? curFrame - 1 : overlayList.length - 1;
                map.hideOverlay(overlayList[prevFrame]);
                map.showOverlay(overlayList[curFrame]);
            }
            benchmark_log("animation");
        }
    }
}

function posHasAnimation(x, y) {
    return overlayRangeMap[x][y].start != undefined;
}

function calculateTimerMax() {
    // TODO
    return defaultTimerMax;
}

//-------------------
// Animation loading
//-------------------

function loadMapAnimations() {
    loadAnimations = false;

    curTilesetsAnimData = getCurrentTileAnimationData();
    if (curTilesetsAnimData == undefined)
        return; // Neither of the current tilesets have animations

    overlayRangeMap = {};
    for (let x = 0; x < mapWidth; x++) {
        overlayRangeMap[x] = {};
        for (let y = 0; y < mapHeight; y++)
            tryAddAnimation(x, y);
    }

    log("Loaded map animations.");
    //debug_printAnimData(curTilesetsAnimData);
}

//
// Returns the tile animations present in the current tilesets.
// If neither tileset has animation data it will return undefined.
//
function getCurrentTileAnimationData() {
    let p_TilesetData = tilesetsData[map.getPrimaryTileset()];
    let s_TilesetData = tilesetsData[map.getSecondaryTileset()];

    if (p_TilesetData == undefined && s_TilesetData == undefined)
        return undefined;
    if (s_TilesetData == undefined)
        return p_TilesetData.tileAnimations;
    if (p_TilesetData == undefined)
        return s_TilesetData.tileAnimations;

    // Both tilesets have data, combine them
    return Object.assign(s_TilesetData.tileAnimations, p_TilesetData.tileAnimations); 
}

function tryAddAnimation(x, y) {
    overlayRangeMap[x][y] = {};
    let curStaticOverlays = [];
    let metatileId = map.getMetatileId(x, y);
    let metatileData = metatileScanCache[metatileId];
    
    // If we haven't encountered this metatile yet try to build an animation for it.
    if (metatileData == undefined)
        metatileData = metatileScanCache[metatileId] = scanMetatile(metatileId);

    // Check if this has any animated tiles
    let animPositions = metatileData.animTilePositions;
    if (animPositions.length == 0) return;

    // This is an animating metatile
    let staticPositions = metatileData.staticTilePositions;
    let tiles = metatileData.tiles;
    overlayRangeMap[x][y].start = numOverlays;

    // TODO: This process can be simplified to a single loop
    //       over an object that holds the tile positions and
    //       bools for whether or not each position is animated.

    // Add static tiles on layer 1
    let addStaticOverlay = false;
    for (var i = 0; i < staticPositions.length; i++) {
        let pos = staticPositions[i];
        if (pos >= tilesPerLayer) break;
        addStaticTileImage(x, y, pos, tiles[pos]);
        addStaticOverlay = true;
    }
    if (addStaticOverlay) {
        allStaticOverlays.push(numOverlays);
        curStaticOverlays.push(numOverlays);
        numOverlays++;
        addStaticOverlay = false;
    }

    // Add frames for animated tiles on layer 1
    curAnimToOverlayMap = {};
    for (var j = 0; j < animPositions.length; j++) {
        let pos = animPositions[j];
        if (pos >= tilesPerLayer) break;
        addAnimTileFrames(x, y, pos, tiles[pos]);
    }

    // Add static tiles on layer 2
    for (; i < staticPositions.length; i++) {
        let pos = staticPositions[i];
        if (pos >= tilesPerLayer * 2) break;
        addStaticTileImage(x, y, pos, tiles[pos]);
        addStaticOverlay = true;
    }
    if (addStaticOverlay) {
        allStaticOverlays.push(numOverlays);
        curStaticOverlays.push(numOverlays);
        numOverlays++;
        addStaticOverlay = false;
    }

    // Add frames for animated tiles on layer 2
    curAnimToOverlayMap = {};
    for (; j < animPositions.length; j++) {
        let pos = animPositions[j];
        if (pos >= tilesPerLayer * 2) break;
        addAnimTileFrames(x, y, pos, tiles[pos]);
    }

    // Add static tiles on layer 3
    for (; i < staticPositions.length; i++) {
        let pos = staticPositions[i];
        if (pos >= tilesPerLayer * 3) break;
        addStaticTileImage(x, y, pos, tiles[pos]);
        addStaticOverlay = true;
    }
    if (addStaticOverlay) {
        allStaticOverlays.push(numOverlays);
        curStaticOverlays.push(numOverlays);
        numOverlays++;
        addStaticOverlay = false;
    }

    // Add frames for animated tiles on layer 3
    curAnimToOverlayMap = {};
    for (; j < animPositions.length; j++) {
        let pos = animPositions[j];
        if (pos >= tilesPerLayer * 3) break;
        addAnimTileFrames(x, y, pos, tiles[pos]);
    }

    for (i = 0; i < curStaticOverlays.length; i++)
        map.showOverlay(curStaticOverlays[i]);

    overlayRangeMap[x][y].end = numOverlays;
}

function addAnimTileFrames(x, y, tilePos, tile) {
    let tileId = tile.tileId;
    let overlays = [];

    let identifier = curTilesetsAnimData[tileId].identifier;
    let overlayId = curAnimToOverlayMap[identifier];
    if (overlayId == undefined) {
        // This is a new animation on this layer, it should use the next overlay
        overlayId = curAnimToOverlayMap[identifier] = numOverlays;
        var newAnimation = true;
    } else {
        // This animation exists elsewhere on this layer, group it on the same overlay
        var newAnimation = false;
    }

    // Add frame images for this tile
    let numFrames = curTilesetsAnimData[tileId].frames.length;
    let imageOffset = getTileImageOffset(tileId);
    for (let frame = 0; frame < numFrames; frame++, overlayId++) {
        if (newAnimation) {
            overlays.push(overlayId);
            map.hideOverlay(overlayId); // Animated tile overlays are hidden until their frame is active
        }
        addAnimTileImage(x, y, tilePos, tile, frame, imageOffset, overlayId);
    }

    if (!newAnimation) return;

    numOverlays += numFrames;

    // Add overlays to animation map
    let interval = curTilesetsAnimData[tileId].interval;
    if (overlayMap[interval] == undefined)
        overlayMap[interval] = [];
    overlayMap[interval].push(overlays);
}

function addAnimTileImage(x, y, tilePos, tile, frame, imageOffset, overlayId) {
    let filepath = curTilesetsAnimData[tile.tileId].filepaths[frame];
    map.createImage(x_mapToTile(x, tilePos), y_mapToTile(y, tilePos), filepath, tileWidth, tileHeight, imageOffset, tile.xflip, tile.yflip, true, overlayId);
}

function addStaticTileImage(x, y, tilePos, tile) {
    map.hideOverlay(numOverlays);
    map.addTileImage(x_mapToTile(x, tilePos), y_mapToTile(y, tilePos), tile.tileId, tile.xflip, tile.yflip, tile.palette, true, numOverlays);
}

function x_mapToTile(x, tilePos) { return x * metatileWidth + ((tilePos % metatileTileWidth) * tileWidth); }
function y_mapToTile(y, tilePos) { return y * metatileHeight + (Math.floor((tilePos % tilesPerLayer) / metatileTileWidth) * tileHeight); }
function getTileImageOffset(tileId) {
    let anim = curTilesetsAnimData[tileId];
    let index = anim.index;
    let imageWidth = anim.imageWidth;

    return ((index * tileWidth) % imageWidth) + (Math.floor(index * tileWidth / imageWidth) * tileHeight * imageWidth);
}

function scanMetatile(metatileId) {
    let animTilePositions = [];
    let staticTilePositions = [];
    let tiles = map.getMetatileTiles(metatileId);
    for (let i = 0; i < tilesPerMetatile; i++) {
        if (curTilesetsAnimData[tiles[i].tileId] != undefined) {
            // Found a tile that should animate
            animTilePositions.push(i);
        } else if (tiles[i].tileId) {
            //for (let j = i; j >= tilesPerLayer; j -= tilesPerLayer) {
                //if (animTilePositions.indexOf(j - tilesPerLayer) != -1) {
                    // Found a tile layered above an animating tile
                    staticTilePositions.push(i);
                //}
            //}
        }
    }

    let animation = {};
    animation.animTilePositions = animTilePositions;
    animation.staticTilePositions = staticTilePositions;
    animation.tiles = tiles;
    return animation;
}

//
// To avoid users having to write out every tile in tilesetsData only the first tile of each animation
// is listed (along with numTiles). This function handles copying properties from this tile to the remaining tiles.
// It also constructs the full filepaths for each frame and handles removing any objects that are missing properties.
//
function buildTilesetsData() {
    // For each tileset
    for (const tilesetName in tilesetsData) {
        if (!verifyTilesetData(tilesetName)) continue;

        let basePath = root + (tilesetsData[tilesetName].primary ? primaryPath : secondaryPath);
        let tilesetPath = basePath + tilesetsData[tilesetName].folder + "/";
        let anims = tilesetsData[tilesetName].tileAnimations;
        let tileNums = Object.keys(anims);
        if (tileNums.length == 0) {
            // No animations, delete it
            warn(tilesetName + " has a header but no tile animations.");
            delete tilesetsData[tilesetName];
            continue;
        }

        // For each animation start tile
        for (let i = 0; i < tileNums.length; i++) {
            let tileNum = tileNums[i];
            if (!verifyTileAnimData(tileNum, tilesetName)) continue;

            // Construct filepaths for animation frames
            if (anims[tileNum].externalFolder)
                var animPath = root + anims[tileNum].folder + "/";
            else animPath = tilesetPath + anims[tileNum].folder + "/";
            anims[tileNum].filepaths = [];
            for (let frame = 0; frame < anims[tileNum].frames.length; frame++)
                anims[tileNum].filepaths[frame] = animPath + anims[tileNum].frames[frame] + animFileExtension;
            anims[tileNum].identifier = i;

            // Copy first tile animation for the remaining tiles
            for (let j = 1; j < anims[tileNum].numTiles; j++) {
                let nextTileNum = parseInt(tileNum) + j;
                anims[nextTileNum] = Object.assign({}, anims[tileNum]);
                anims[nextTileNum].index = j;
            }
            anims[tileNum].index = 0;
        }
    }
}

//---------------
// Logging
//---------------

function log(message) {
    map.log(logPrefix + message);
}

function warn(message) {
    map.warn(logPrefix + message);
}

function verifyTilesetData(tilesetName) {
    let tilesetData = tilesetsData[tilesetName];
    if (tilesetData == undefined)
        return false; // A tileset missing a header is invalid but not an error

    let valid = true;
    let properties = ["tileAnimations", "folder"]; // "primary" is not required
    for (let i = 0; i < properties.length; i++) {
        if (!tilesetData.hasOwnProperty(properties[i])) {
            map.error(logPrefix + tilesetName + " is missing property '" + properties[i] + "'");
            valid = false;
        }
    }
    if (!valid)
        delete tilesetsData[tilesetName];
    return valid;
}

function verifyTileAnimData(tileNum, tilesetName) {
    // Assumes tileset data has already been verified
    let anim = tilesetsData[tilesetName].tileAnimations[tileNum];
    if (anim == undefined)
        return false; // A missing tile animation is invalid but not an error

    let valid = true;
    let properties = ["numTiles", "frames", "interval", "folder", "imageWidth"];
    for (let i = 0; i < properties.length; i++) {
        if (!anim.hasOwnProperty(properties[i])) {
            map.error(logPrefix + "Animation for tile " + tileNum + " of " + tilesetName + " is missing property '" + properties[i] + "'");
            valid = false;
        }
    }
    if (!valid)
        delete tilesetsData[tilesetName].tileAnimations[tileNum];
    return valid;
}

function debug_printAnimDataByTileset() {
    for (var tilesetName in tilesetsData) {
        map.log(tilesetName);
        let anims = tilesetsData[tilesetName].tileAnimations;
        debug_printAnimData(anims);
    }
}

function debug_printAnimData(anims) {
    for (var tileNum in anims) {
        map.log(tileNum);
        let anim = anims[tileNum];
        for (var property in anim) {
            map.log(property + ": " + anim[property]);
        }
    }
}

var benchmark;

function benchmark_init() {
    benchmark = new Date().getTime();
}

function benchmark_log(message) {
    let end = new Date().getTime();
    log(message + " time: " + (end - benchmark));
    benchmark = end;
}
