/*
    Prototype for Porymap animation script.

    TODO:
    - Properly remove old overlays. Overlays cleared by erasing/redrawing are left unused.
    - Add forceRedraw to overlay changes
    - Test for interrupting animate loop. Switch to invoked function queue?
    - More data verification, e.g. interval != 0
    - Add hex comments to data
    - Resolve map shift somehow? Requires API change: perhaps a new callback, or adding the ability to set overlay position
    - Animate border?
    - Comments and clean-up
    - Move top-level UI elements to foreground (above overlays). Namely the cursor tile rectangle, player view rectangle, and grid.
    - Convert animation data to JSON? (Importing not supported on standard Qt implements)

*/

//====================
//       Data
//====================

import {
    toggleShortcut,
    animateOnLaunch,
    versionData,
    tilesetsPath,
    primaryPath,
    secondaryPath,
    animFileExtension,
    logPrefix,
    logDebugInfo,
    logUsageInfo,
    logBenchmarkInfo,
    refreshTime,
    defaultTimerMax,
    mapExceptions
} from "./animation_settings.js"

var root = "";
var timer = 0;
var timerMax = defaultTimerMax;
var animating = false;
var animateFuncActive = false;
var numOverlays = 1;

var tilesetsData;

// 2D array of objects tracking which overlays belong to which map spaces.
// It's accessed with x/y map coordinates, e.g. overlayRangeMap[x][y], and
// returns an object with a 'start' and 'end' property which are the first
// and max overlay used by that map space. This is used to clear the overlays
// for a space when it's drawn on.
var overlayRangeMap;

// 3D array
var animOverlayMap = {};

// Array of all the active static overlays. Used to re-show them after toggling animation.
var allStaticOverlays = [];

// This object maps static overlays to the intervals of the animation they're associated with.
// Each property is an interval, and each value is an array of overlay ids. The array below it
// is for temporarily tracking which intervals are being used in order to build this object.
var staticOverlayMap = {};
var curAnimIntervals = [];

// Object for caching data about how to build an animation for a given metatile so
// that when it's encountered again the animation can be created faster.
// Each metatile id is a property, the value of which is an object that holds the
// positions of animated tiles (animTilePositions), the positions of static tiles
// layered on top of animated tiles (staticTilePositions), and all the tiles (tiles).
var metatileCache = {};

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

var mapName;
var mapWidth;
var mapHeight;

// Basic tile/metatile size information
const tileWidth = 8;
const tileHeight = 8;
const metatileTileWidth = 2;
const metatileTileHeight = 2;
const tilesPerLayer = metatileTileWidth * metatileTileHeight;
const metatileWidth = tileWidth * metatileTileWidth;
const metatileHeight = tileHeight * metatileTileHeight;
var tilesPerMetatile;
var maxMetatileLayer;

// For getting least common multiple of animation intervals
// https://stackoverflow.com/questions/47047682
const gcd = (a, b) => a ? gcd(b % a, a) : b;
const lcm = (a, b) => a * b / gcd(a, b);

//====================
//   Main Callbacks
//====================

export function onProjectOpened(projectPath) {
    root = projectPath + "/";
    tilesPerMetatile = map.getNumTilesInMetatile();
    maxMetatileLayer = map.getNumMetatileLayers();
    map.registerAction("toggleAnimation", "Toggle map animations", toggleShortcut);
    map.registerAction("reloadAnimation", "Reload map animations")
    buildTilesetsData();
    if (animateOnLaunch) toggleAnimation();
}

/*export function onProjectClosed(projectPath) {
    resetAnimation();
    animating = false;
}*/

export function onMapOpened(newMapName) {
    map.clearOverlays();
    mapName = newMapName;
    mapWidth = map.getWidth();
    mapHeight = map.getHeight();
    loadAnimations = true;
}

export function onMapResized(oldWidth, oldHeight, newWidth, newHeight) {
    mapWidth = newWidth;
    mapHeight = newHeight;
    if (newWidth < oldWidth || newHeight < oldHeight) {
        map.clearOverlays();
        loadAnimations = true;
    }
}

export function onTilesetUpdated(tilesetName) {
    map.clearOverlays();
    loadAnimations = true;
}

export function onTabChanged(oldTab, newTab) {
    if (!oldTab && newTab) {
        // Leaving map tab
        setAnimating(false);
    } else if (oldTab && !newTab) {
        // Entering map tab
        setAnimating(true);
    }
}

export function onBlockChanged(x, y, prevBlock, newBlock) {
    if (newBlock.metatileId == prevBlock.metatileId)
        return;

    // Erase old animation
    if (posHasAnimation(x, y)) {
        for (let i = overlayRangeMap[x][y].start; i < overlayRangeMap[x][y].end; i++)
            map.clearOverlay(i);
    }

    tryAddAnimation(x, y);
}

//=====================
//  Animation running
//=====================

//---------------------------------------------------------------------------------
// This is the main animation function.
// While animation is active it will call itself in a loop at a regular interval.
//---------------------------------------------------------------------------------
export function animate() {
    if (!animating) {
        // Stop animation
        animateFuncActive = false;
        hideOverlays();
        return;
    }
    if (loadAnimations) {
        resetAnimation();
        benchmark_init();
        loadMapAnimations();
        timerMax = calculateTimerMax();
        benchmark_log("Loading animations");
        if (logDebugInfo) log("Timer max: " + timerMax);
        if (logUsageInfo) {
            log("Overlays used: " + (numOverlays - 1));
            debug_printOverlays();
        }
    }
    updateOverlays(timer);
    if (++timer >= timerMax)
        timer = 0;
    map.setTimeout(animate, refreshTime);
}

export function toggleAnimation() {
    setAnimating(!animating);
}

function setAnimating(state) {
    animating = state;
    log("Animations " + (animating ? "on" : "off"));
    if (animating) tryStartAnimation();
}

function tryStartAnimation() {
    // Only call animation loop if it's not already running.
    if (!animateFuncActive) {
        animateFuncActive = true;
        timer = 0;
        animate();
    }
}

function hideOverlays() {
    map.hideOverlays();
    for (const interval in staticOverlayMap)
        staticOverlayMap[interval].hidden = true;
}

function resetAnimation() {
    map.clearOverlays();
    numOverlays = 1;
    timer = 0;
    animOverlayMap = {};
    staticOverlayMap = {};
    metatileCache = {};
    allStaticOverlays = [];
}

export function reloadAnimation() {
    animating = false;
    resetAnimation();
    buildTilesetsData();
    loadAnimations = true;
    animating = animateOnLaunch;
}

//
// This function is responsible for visually updating the animation.
// It does this by selectively hiding and showing overlays that each
// have different tile frame images on them.
//
function updateOverlays(timer) {
    // For each timing interval of the current animations
    for (const interval in animOverlayMap) {
        if (timer % interval == 0) {
            benchmark_init();
            // For each tile animating at this interval,
            // hide the previous frame and show the next frame
            let overlayLists = animOverlayMap[interval];
            for (let i = 0; i < overlayLists.length; i++) {
                let overlayList = overlayLists[i];
                let curFrame = (timer / interval) % overlayList.length;
                let prevFrame = curFrame ? curFrame - 1 : overlayList.length - 1;
                map.hideOverlay(overlayList[prevFrame]);
                map.showOverlay(overlayList[curFrame]);
            }

            // Show all the unrevealed static overlays associated
            // with animations at this interval
            if (staticOverlayMap[interval].hidden) {
                for (let i = 0; i < staticOverlayMap[interval].overlays.length; i++) {
                    let overlayId = staticOverlayMap[interval].overlays[i];
                    if (!map.getOverlayVisibility(overlayId))
                        map.showOverlay(overlayId)
                }
                staticOverlayMap[interval].hidden = false;
            }
            benchmark_log("Animating interval " + interval);
        }
    }
}

function posHasAnimation(x, y) {
    return overlayRangeMap[x][y].start != undefined;
}

//----------------------------------------------------------------------------
// Timer max is the least common multiple of the animation interval * the
// number of frames for each animation in the currently loaded tilesets.
//----------------------------------------------------------------------------
function calculateTimerMax() {
    let fullIntervals = [];
    for (const tileId in curTilesetsAnimData) {
        let anim = curTilesetsAnimData[tileId];
        let fullInterval = anim.frames.length * anim.interval;
        if (!fullIntervals.includes(fullInterval))
            fullIntervals.push(fullInterval);
    }
    if (fullIntervals.length == 0)
        return defaultTimerMax;
    return fullIntervals.reduce(lcm);
}

//=====================
//  Animation loading
//=====================

//-------------------------------------------------------------------
// This is the main animation loading function.
// It retrieves the animation data for the current tilesets,
// then scans the map and tries to add an animation at each space.
//-------------------------------------------------------------------
function loadMapAnimations() {
    log("Loading map animations...")
    loadAnimations = false;

    curTilesetsAnimData = getCurrentTileAnimationData();
    if (curTilesetsAnimData == undefined) {
        log("No animations on this map.");
        return;
    }
    debug_printAnimData(curTilesetsAnimData);

    overlayRangeMap = {};
    for (let x = 0; x < mapWidth; x++) {
        overlayRangeMap[x] = {};
        for (let y = 0; y < mapHeight; y++)
            tryAddAnimation(x, y);
    }

    log("Map animations loaded.");
}

//------------------------------------------------------------------
// Returns the tile animations present in the current tilesets.
// If neither tileset has animation data or if the current map is
// in the list of map exceptions it will return undefined.
//------------------------------------------------------------------
function getCurrentTileAnimationData() {
    let p_TilesetData = tilesetsData[map.getPrimaryTileset()];
    let s_TilesetData = tilesetsData[map.getSecondaryTileset()];

    if ((p_TilesetData == undefined && s_TilesetData == undefined) || mapExceptions.includes(mapName))
        return undefined;
    if (s_TilesetData == undefined)
        return p_TilesetData.tileAnimations;
    if (p_TilesetData == undefined)
        return s_TilesetData.tileAnimations;

    // Both tilesets have data, combine them
    return Object.assign(s_TilesetData.tileAnimations, p_TilesetData.tileAnimations); 
}

//
//
//
//
function tryAddAnimation(x, y) {
    overlayRangeMap[x][y] = {};
    let curStaticOverlays = [];
    let metatileId = map.getMetatileId(x, y);
    let metatileData = metatileCache[metatileId];
    
    // If we haven't encountered this metatile yet try to build an animation for it.
    if (metatileData == undefined)
        metatileData = metatileCache[metatileId] = getMetatileAnimData(metatileId);

    // Stop if the metatile has no animating tiles
    if (metatileData.length == 0) return;

    // Get data about the metatile
    let tiles = metatileData.tiles;
    let len = metatileData.length;

    // Save starting overlay for this map space
    overlayRangeMap[x][y].start = numOverlays;
    curAnimIntervals = [];

    // Add tile images.
    // metatileData is sorted first by layer, then by whether the tile is static or animated.
    // Most of the way this is laid out is to simplify tracking overlays for allowing as many
    // images as possible to be grouped together on the same overlays.
    let i = 0;
    let layer = -1;
    while (i < len) {
        // Draw static tiles on a shared overlay until we hit an animated tile or the end of the array
        let newStaticOverlay = false;
        while(metatileData[i] && !metatileData[i].animates) {
            addStaticTileImage(x, y, metatileData[i]);
            newStaticOverlay = true;
            i++;
        }
        // Added static tile images, save and increment overlays
        if (newStaticOverlay) {
            allStaticOverlays.push(numOverlays);
            curStaticOverlays.push(numOverlays);
            numOverlays++;
        }

        // Draw animated tiles until we hit a static tile or the end of the array.
        // Overlay usage is handled already by addAnimTileFrames / curAnimToOverlayMap
        while (metatileData[i] && metatileData[i].animates) {
            // Reset cache between layers
            if (metatileData[i].layer != layer) {
                curAnimToOverlayMap = {};
                layer = metatileData[i].layer;
            }
            addAnimTileFrames(x, y, metatileData[i]);
            i++;
        }
    }

    // Save static overlays to array for each animation interval this metatile has.
    // Whichever interval occurs next will reveal the static overlays.
    // This is done so the neither the animated or static overlays are ever revealed without the other.
    if (curStaticOverlays.length != 0) {
        for (let i = 0; i < curAnimIntervals.length; i++) {
            let interval = curAnimIntervals[i];
            if (staticOverlayMap[interval] == undefined)
                staticOverlayMap[interval] = {hidden: true, overlays: []};
            staticOverlayMap[interval].overlays.push(curStaticOverlays);
            staticOverlayMap[interval].hidden = true;
        }
    }

    // Save end of overlay range for this map space
    overlayRangeMap[x][y].end = numOverlays;
    if (logUsageInfo) log("Using overlays " + overlayRangeMap[x][y].start + "-" + (overlayRangeMap[x][y].end - 1) + " at " + x + "," + y);
}

function getMetatileAnimData(metatileId) {
    let metatileData = [];
    let tiles = map.getMetatileTiles(metatileId);
    if (!tiles) return metatileData;
    let positions = scanTiles(tiles);

    // No animating tiles, end early
    if (positions.anim.length == 0) return metatileData;

    let dimensions = getTileImageDimensions(tiles);

    // Merge static and animated tile arrays into one object array
    // sorted first by layer, then by static vs animated tiles.
    positions.static.sort((a, b) => b - a);
    positions.anim.sort((a, b) => b - a);
    for (let layer = 0; layer < maxMetatileLayer; layer++) {
        while (positions.static[0] && Math.floor(positions.static.slice(-1) / tilesPerLayer) == layer) {
            // Assemble data entry for static tile
            let tilePos = positions.static.pop();
            metatileData.push({animates: false, pos: tilePos, tile: tiles[tilePos]});
        }
        while (positions.anim[0] && Math.floor(positions.anim.slice(-1) / tilesPerLayer) == layer) {
            // Assemble data entry for animated tile
            let tilePos = positions.anim.pop();
            let tile = tiles[tilePos];
            let dim = dimensions[tilePos];
            if (!dim) continue;
            metatileData.push({animates: true, pos: tilePos, layer: layer, tile: tile, w: dim.w, h: dim.h, imageOffset: dim.offset});
        }
    }
    return metatileData;
}

function scanTiles(tiles) {
    // Scan metatile for animating tiles
    let animTilePositions = [];
    let staticTilePositions = [];
    let savedColumns = [];
    for (let i = 0; i < tilesPerMetatile; i++) {
        let layerPos = i % tilesPerLayer;
        if (!savedColumns.includes(layerPos) && isAnimated(tiles[i].tileId)) {
            // Animating tile found, save all tiles in this column
            for (let j = layerPos; j < tilesPerMetatile; j += tilesPerLayer) {
                if (!tiles[j].tileId) continue;
                if (i == j || isAnimated(tiles[j].tileId))
                    animTilePositions.push(j); // Save animating tile
                else
                    staticTilePositions.push(j); // Save static tile
            }
            savedColumns.push(layerPos);
        }
    }
    let positions = {};
    positions["static"] = staticTilePositions;
    positions["anim"] = animTilePositions;
    return positions;
}

function isAnimated(tileId) {
    return curTilesetsAnimData[tileId] != undefined;
}

//==================
//  Image creation
//==================

function addAnimTileFrames(x, y, data) {
    let tileId = data.tile.tileId;
    let frames = curTilesetsAnimData[tileId].frames;
    let interval = curTilesetsAnimData[tileId].interval;

    // Get which overlay to start creating the frame images on.
    // If there is already a set of images on this layer that share
    // an interval and number of frames, just use the same overlays.
    if (!curAnimToOverlayMap[interval]) curAnimToOverlayMap[interval] = {};
    let baseOverlayId = curAnimToOverlayMap[interval][frames.length];
    let newOverlaySet = (baseOverlayId == undefined);

    // If it's a new interval+frame count, start the overlay usage at the next available overlay (and save to cache)
    if (newOverlaySet) baseOverlayId = curAnimToOverlayMap[interval][frames.length] = numOverlays;

    // Add frame images for this tile
    let overlays = [];
    let frameOverlayMap = {};
    for (let i = 0; i < frames.length; i++) {
        // Get overlay to use for this frame. Repeated frames will share an overlay/image
        let overlayId = frameOverlayMap[frames[i]];
        let newFrame = (overlayId == undefined);
        if (newFrame) overlayId = baseOverlayId++;

        // If this a new set of overlays, save them to an array so they can be tracked for animation.
        // Also hide the overlay; animated frame images are hidden until their frame is active
        if (newOverlaySet) {
            overlays.push(overlayId);
            if (newFrame) map.hideOverlay(overlayId);
        }

        // Create new frame image
        if (newFrame) {
            addAnimTileImage(x, y, data, i, overlayId);
            frameOverlayMap[frames[i]] = overlayId;
        }
    }

    if (!newOverlaySet) return;

    // Update overlay usage
    numOverlays = baseOverlayId;

    // Add overlays to animation map
    if (animOverlayMap[interval] == undefined)
        animOverlayMap[interval] = [];
    animOverlayMap[interval].push(overlays);
    if (!curAnimIntervals.includes(interval))
        curAnimIntervals.push(interval);
}

function addAnimTileImage(x, y, data, frame, overlayId) {
    let tile = data.tile;
    let anim = curTilesetsAnimData[tile.tileId];
    let filepath = anim.filepath + anim.frames[frame] + animFileExtension;
    map.createImage(x_mapToTile(x, data.pos), y_mapToTile(y, data.pos), filepath, data.w, data.h, data.imageOffset, tile.xflip, tile.yflip, tile.palette, true, overlayId);
}

function addStaticTileImage(x, y, data) {
    let tile = data.tile;
    map.hideOverlay(numOverlays);
    map.addTileImage(x_mapToTile(x, data.pos), y_mapToTile(y, data.pos), tile.tileId, tile.xflip, tile.yflip, tile.palette, true, numOverlays);
}

//--------------------------------------------------------------------------------------------------------
// Take a map coordinate and tile position and return the coordinate to start drawing that tile's image
//--------------------------------------------------------------------------------------------------------
function x_mapToTile(x, tilePos) { return x * metatileWidth + ((tilePos % metatileTileWidth) * tileWidth); }
function y_mapToTile(y, tilePos) { return y * metatileHeight + (Math.floor((tilePos % tilesPerLayer) / metatileTileWidth) * tileHeight); }

//----------------------------------------------------------------
// Calculate the region of the image each tile should load from.
//----------------------------------------------------------------
function getTileImageDimensions(tiles) {
    let dimensions = [];
    for (let layer = 0; layer < maxMetatileLayer; layer++) {
        let posOffset = layer * tilesPerLayer;
        let posData = {};
        
        // Calculate x/y offset and set default dimensions for each animated tile
        for (let i = 0; i < tilesPerLayer; i++) {
            let tilePos = i + posOffset;
            let tile = tiles[tilePos];
            if (!isAnimated(tile.tileId)) continue;
            let anim = curTilesetsAnimData[tile.tileId];
            posData[i] = {x: getImageDataX(anim), y: getImageDataY(anim), id: anim.identifier, tile: tile};
            dimensions[tilePos] = {w: tileWidth, h: tileHeight, offset: (posData[i].x + (posData[i].y * anim.imageWidth))};
        }

        // Adjacent sequential positions from the same animations can share an image.
        // Determine which positions (if any) can, update their dimensions, and stop tracking old positions
        let hasRow1, hasRow2;
        if (hasRow1 = canCombine_Horizontal(posData, 0, 1)) {
            // Merge positions 0 and 1 into a single wide position
            dimensions[0 + posOffset].w = tileWidth * 2;
            dimensions[1 + posOffset] = undefined;
            posData[1] = undefined;
        }
        if (hasRow2 = canCombine_Horizontal(posData, 2, 3)) {
            // Merge positions 2 and 3 into a single wide position;
            dimensions[2 + posOffset].w = tileWidth * 2;
            dimensions[3 + posOffset] = undefined;
            posData[3] = undefined;
        }

        // Only 1 horizontal image created, can't combine vertically
        if (hasRow1 != hasRow2) continue;

        if (canCombine_Vertical(posData, 0, 2)) {
            // Merge positions 0 and 2 into a single tall position
            // If 0 and 2 were already wide positions this creates a square
            dimensions[0 + posOffset].h = tileHeight * 2;
            dimensions[2 + posOffset] = undefined;
            posData[2] = undefined
        }
        if (canCombine_Vertical(posData, 1, 3)) {
            // Merge positions 1 and 3 into a single tall position
            dimensions[1 + posOffset].h = tileHeight * 2;
            dimensions[3 + posOffset] = undefined;
            posData[3] = undefined
        }
    }
    return dimensions;
}

function getImageDataX(anim) { return (anim.index * tileWidth) % anim.imageWidth; };
function getImageDataY(anim) { return Math.floor(anim.index * tileWidth / anim.imageWidth) * tileHeight; }

function canCombine(data, a, b) {
    return (data[a] && data[b]
         && data[a].id == data[b].id
         && data[a].tile.xflip == data[b].tile.xflip
         && data[a].tile.yflip == data[b].tile.yflip
         && data[a].tile.palette == data[b].tile.palette);
}

function canCombine_Horizontal(data, a, b) {
    return (canCombine(data, a, b)
         && data[a].x == (data[b].x - tileWidth)
         && data[a].y == data[b].y);
}

function canCombine_Vertical(data, a, b) {
    return (canCombine(data, a, b)
         && data[a].x == data[b].x
         && data[a].y == (data[b].y - tileHeight));
}

//
// To avoid users having to write out every tile in tilesetsData only the first tile of each animation
// is listed (along with numTiles). This function handles copying properties from this tile to the remaining tiles.
// It also constructs the full filepaths for each frame and handles removing any objects that are missing properties.
//
function buildTilesetsData() {
    tilesetsData = JSON.parse(JSON.stringify(versionData[map.getBaseGameVersion()]));
    // For each tileset
    let identifier = 0;
    for (const tilesetName in tilesetsData) {
        if (!verifyTilesetData(tilesetName)) continue;

        let basePath = root + (tilesetsData[tilesetName].primary ? primaryPath : secondaryPath);
        let tilesetPath = basePath + tilesetsData[tilesetName].folder + "/";
        let anims = tilesetsData[tilesetName].tileAnimations;
        let tileIds = Object.keys(anims);
        if (tileIds.length == 0) {
            // No animations, delete it
            warn(tilesetName + " has a header but no tile animations.");
            delete tilesetsData[tilesetName];
            continue;
        }

        // For each animation start tile
        for (let i = 0; i < tileIds.length; i++) {
            let tileId = tileIds[i];
            if (!verifyTileAnimData(tileId, tilesetName)) continue;

            // Set filepath for animation frames
            anims[tileId].filepath = (anims[tileId].externalFolder ? root : tilesetPath) + anims[tileId].folder + "/";
            anims[tileId].identifier = identifier++;

            // Copy first tile animation for the remaining tiles
            let tileIdInt = parseInt(tileId);
            for (let j = 1; j < anims[tileId].numTiles; j++) {
                let nextTileId = tileIdInt + j;
                anims[nextTileId] = Object.assign({}, anims[tileId]);
                anims[nextTileId].index = j;
            }
            anims[tileId].index = 0;

            // Create copies of animation tiles with offset frame timings (if any)
            if (!anims[tileId].copies) continue;
            let numFrames = anims[tileId].frames.length;
            for (let j = 0; j < anims[tileId].copies.length; j++) {
                let copyData = anims[tileId].copies[j];
                let offset = Math.abs(numFrames - copyData.frameOffset);

                // Shift frames for offset copies
                let copyFrames = [];
                for (let frame = 0; frame < numFrames; frame++)
                    copyFrames[frame] = anims[tileId].frames[(frame + offset) % numFrames];

                // Copy all tiles for offset animation
                let copyTileIdInt = parseInt(copyData.tileId);
                for (let k = 0; k < anims[tileId].numTiles; k++) {
                    let nextTileId = copyTileIdInt + k;
                    anims[nextTileId] = Object.assign({}, anims[tileId]);
                    anims[nextTileId].index = k;
                    anims[nextTileId].frames = copyFrames;
                    anims[nextTileId].identifier = identifier++;
                }
            }
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

function error(message) {
    map.error(logPrefix + message);
}

function verifyTilesetData(tilesetName) {
    let tilesetData = tilesetsData[tilesetName];
    if (tilesetData == undefined)
        return false; // A tileset missing a header is invalid but not an error

    let valid = true;
    let properties = ["tileAnimations", "folder"]; // "primary" is not required
    for (let i = 0; i < properties.length; i++) {
        if (!tilesetData.hasOwnProperty(properties[i])) {
            error(tilesetName + " is missing property '" + properties[i] + "'");
            valid = false;
        }
    }
    if (!valid)
        delete tilesetsData[tilesetName];
    return valid;
}

function verifyTileAnimData(tileId, tilesetName) {
    // Assumes tileset data has already been verified
    let anim = tilesetsData[tilesetName].tileAnimations[tileId];
    if (anim == undefined)
        return false; // A missing tile animation is invalid but not an error

    let valid = true;
    let properties = ["numTiles", "frames", "interval", "folder", "imageWidth"];
    for (let i = 0; i < properties.length; i++) {
        if (!anim.hasOwnProperty(properties[i])) {
            error("Animation for tile " + tileId + " of " + tilesetName + " is missing property '" + properties[i] + "'");
            valid = false;
        }
    }
    if (!valid)
        delete tilesetsData[tilesetName].tileAnimations[tileId];
    return valid;
}

function debug_printAnimDataByTileset() {
    if (!logDebugInfo) return;
    for (var tilesetName in tilesetsData) {
        map.log(tilesetName);
        let anims = tilesetsData[tilesetName].tileAnimations;
        debug_printAnimData(anims);
    }
}

function debug_printAnimData(anims) {
    if (!logDebugInfo) return;
    for (var tileId in anims) {
        log(tileId);
        let anim = anims[tileId];
        for (var property in anim) {
            log(property + ": " + anim[property]);
        }
        log("");
    }
}

function debug_printOverlays() {
    if (!logUsageInfo) return;
    for (const interval in animOverlayMap) {
        log("Overlays animating at interval of " + interval + ":");
        let overlayLists = animOverlayMap[interval];
        for (let j = 0; j < overlayLists.length; j++) {
            log(overlayLists[j]);
        }
    }
}

var benchmark;
var runningTotal = 0;

function benchmark_init() {
    if (!logBenchmarkInfo) return;
    benchmark = new Date().getTime();
}

function benchmark_add() {
    if (!logBenchmarkInfo) return;
    let cur = new Date().getTime();
    runningTotal += cur - benchmark;
    benchmark = cur;
}

function benchmark_log(message) {
    if (!logBenchmarkInfo) return;
    let end = new Date().getTime();
    log(message + " time: " + (end - benchmark));
    benchmark = end;
}

function benchmark_total(message) {
    if (!logBenchmarkInfo) return;
    log(message + " time: " + runningTotal);
}
