/*
        SECTION LABELS
    =        Data       =
    =   Main callbacks  =
    = Animation running =
    = Animation loading =
    =   Image creation  =
    =    Coordinates    =
    =   Data building   =
    =      Logging      =

*/

//====================
//       Data
//====================

import {
    toggleShortcut,
    reloadShortcut,
    animateOnLaunch,
    versionData,
    tilesetsPath,
    primaryPath,
    secondaryPath,
    animFileExtension,
    logPrefix,
    logBasicInfo,
    logDebugInfo,
    logUsageInfo,
    refreshTime,
    mapExceptions
} from "./settings.js"

var root = "";
var animating = false;
var animateFuncActive = false;
var loadAnimations = true;
var numOverlays = 1;

var mapName;
var mapWidth;
var mapHeight;

var mapViewTab = 0;

var tilesetsData;

// 2D array of objects tracking which overlays belong to which map spaces.
// It's accessed with x/y map coordinates, e.g. overlayRangeMap[x][y], and
// returns an object with a 'start' and 'end' property which are the first
// and max overlay used by that map space. This is used to clear the overlays
// for a space when it's drawn on.
var overlayRangeMap;

// These objects map overlays to the intervals of the animation they're associated with.
// Each property is an interval. For animOverlayMap, each value is an array of overlay ids; each
// overlay is only associated with 1 interval. For staticOverlayMap, each value is an object
// containing an array of overlay ids and a value for whether or not they are currently hidden.
// Static overlays are associated with every interval that exists on the map space they are
// associated with. The array below them is for temporarily tracking which intervals are being
// used in order to build staticOverlayMap.
var animOverlayMap = {};
var staticOverlayMap = {};
var curAnimIntervals = [];

// Object for caching data about how to build an animation for a given metatile so
// that when it's encountered again the animation can be created faster.
// Each metatile id is a property, the value of which is an object that holds the
// animation data. See getMetatileAnimData for the format of this data.
var metatileCache = {};

// Object for storing data on all the possible tile animations in the current primary/secondary tilesets.
// Each tile id is a property. The values are objects with the same properties as those in tileAnimations
var curTilesetsAnimData = {};

// Object for tracking which animations have been encountered already on the current
// metatile layer so that they can be grouped together on the same overlays.
// It takes both the interval and number of frames as properties, and the returned
// value is the overlay the first frame belongs to.
var curAnimToOverlayMap = {};

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
var maxPrimaryTile;
var maxSecondaryTile;

// For getting least common multiple of animation intervals
// https://stackoverflow.com/questions/47047682
const gcd = (a, b) => a ? gcd(b % a, a) : b;
const lcm = (a, b) => a * b / gcd(a, b);

 // Arbitrary "highly composite" number. Only used when no
 // animations are loaded, so its value is mostly irrelevant.
const defaultTimerMax = 55440;
var timer = 0;
var timerMax = defaultTimerMax;


//====================
//   Main callbacks
//====================

export function onProjectOpened(projectPath) {
    root = projectPath + "/";
    tilesPerMetatile = map.getNumTilesInMetatile();
    maxMetatileLayer = map.getNumMetatileLayers();
    maxPrimaryTile = map.getMaxPrimaryTilesetTiles();
    maxSecondaryTile = maxPrimaryTile + map.getMaxSecondaryTilesetTiles();
    map.registerAction("toggleAnimation", "Toggle map animations", toggleShortcut);
    map.registerAction("reloadAnimation", "Reload map animations", reloadShortcut)
    buildTilesetsData();
    if (animateOnLaunch) toggleAnimation();
}

export function onMapOpened(newMapName) {
    map.clearOverlays();
    mapName = newMapName;
    mapWidth = map.getWidth();
    mapHeight = map.getHeight();
    loadAnimations = true;
}

export function onMapResized(oldWidth, oldHeight, newWidth, newHeight) {
    map.clearOverlays();
    mapWidth = newWidth;
    mapHeight = newHeight;
    loadAnimations = true;
}

export function onMapShifted(xDelta, yDelta) {
    if (xDelta == 0 && yDelta == 0) return;

    // Move and wrap the overlays and reconstruct overlayRangeMap
    let newMap = {};
    for (let x = 0; x < mapWidth; x++) {
        if (!newMap[x]) newMap[x] = {};
        for (let y = 0; y < mapHeight; y++) {
            if (!newMap[x][y]) newMap[x][y] = {start: -1, end: -1};
            let overlayStart = overlayRangeMap[x][y].start;
            if (overlayStart == -1) continue;
            let newX = getWrappedMapCoord(x + xDelta, mapWidth);
            let newY = getWrappedMapCoord(y + yDelta, mapHeight);
            let overlayEnd = overlayRangeMap[x][y].end;
            for (let i = overlayStart; i < overlayEnd; i++)
                setOverlayMapPos(newX, newY, i);
            if (!newMap[newX]) newMap[newX] = {}
            newMap[newX][newY] = {start: overlayStart, end: overlayEnd};
        }
    }
    overlayRangeMap = newMap;
}

export function onTilesetUpdated(tilesetName) {
    map.clearOverlays();
    loadAnimations = true;
}

export function onMainTabChanged(oldTab, newTab) {
    if (!oldTab && newTab) {
        // Leaving map tab
        mapViewTab = map.getMapViewTab();
        setAnimating(false);
    } else if (oldTab && !newTab && !mapViewTab) {
        // Entering map tab on metatile view
        setAnimating(true);
    }
}

export function onMapViewTabChanged(oldTab, newTab) {
    if (!oldTab && newTab) {
        // Leaving metatile view
        setAnimating(false);
    } else if (oldTab && !newTab) {
        // Entering metatile view
        setAnimating(true);
    }
}

export function onBlockChanged(x, y, prevBlock, newBlock) {
    if (newBlock.metatileId == prevBlock.metatileId)
        return;
    tryRemoveAnimation(x, y);
    tryAddAnimation(x, y);
}


//=====================
//  Animation running
//=====================

//-------------------------------------------------------------------------------
// This is the main animation loop. It's initially called by tryStartAnimation,
// and it will call itself at a regular interval via setTimeout. Other functions
// can interact with the animation loop by setting 'animating' to false to stop
// animation or 'loadAnimations' to true to reload animation data.
//-----------------------------------------------------------------------
export function animate() {
    if (!animating) {
        // Stop animation
        animateFuncActive = false;
        hideOverlays();
        return;
    }
    if (loadAnimations) {
        resetAnimation();
        loadMapAnimations();
        timerMax = calculateTimerMax();
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
    if (logBasicInfo) log("Animations " + (animating ? "on" : "off"));
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
}

export function reloadAnimation() {
    animating = false;
    resetAnimation();
    buildTilesetsData();
    loadAnimations = true;
    setAnimating(animateOnLaunch);
}

//--------------------------------------------------------------------
// This function is responsible for visually updating the animation.
// It does this by selectively hiding and showing overlays that each
// have different tile frame images on them.
//--------------------------------------------------------------------
function updateOverlays(timer) {
    // For each timing interval of the current animations
    for (const interval in animOverlayMap) {
        if (timer % interval == 0) {
            // For each tile animating at this interval,
            // hide the previous frame and show the next frame
            let overlayLists = animOverlayMap[interval];
            if (!overlayLists) continue;
            for (let i = 0; i < overlayLists.length; i++) {
                let overlayList = overlayLists[i];
                let curFrame = (timer / interval) % overlayList.length;
                let prevFrame = curFrame ? curFrame - 1 : overlayList.length - 1;
                map.hideOverlay(overlayList[prevFrame]);
                map.showOverlay(overlayList[curFrame]);
            }

            // Show all the unrevealed static overlays associated
            // with animations at this interval
            if (staticOverlayMap[interval] && staticOverlayMap[interval].hidden) {
                for (let i = 0; i < staticOverlayMap[interval].overlays.length; i++)
                    map.showOverlay(staticOverlayMap[interval].overlays[i])
                staticOverlayMap[interval].hidden = false;
            }
        }
    }
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
    if (logBasicInfo) log("Loading animations...");
    loadAnimations = false;

    curTilesetsAnimData = getCurrentTileAnimationData();
    if (curTilesetsAnimData == undefined) {
        if (logBasicInfo) log("No animations on this map");
        return;
    }
    debug_printAnimData(curTilesetsAnimData);

    overlayRangeMap = {};
    for (let x = 0; x < mapWidth; x++) {
        overlayRangeMap[x] = {};
        for (let y = 0; y < mapHeight; y++)
            tryAddAnimation(x, y);
    }

    if (logBasicInfo) log("Map animations loaded");
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

//----------------------------------------------------------------------------
// Removes the animation (if it exists) at the given map coordinates.
// Overlays are not re-used unless animations are fully reloaded, so this
// doesn't bother to remove overlays from the overlay maps. Over a very long
// period this could impact performance, but it keeps drawing speed high.
//----------------------------------------------------------------------------
function tryRemoveAnimation(x, y) {
    if (overlayRangeMap[x][y].start != -1) {
        for (let i = overlayRangeMap[x][y].start; i < overlayRangeMap[x][y].end; i++)
            map.clearOverlay(i);
    }
}

//-----------------------------------------------------------------
// Tries to create a new animation at the given map coordinates.
// If the metatile at this position has not been encountered yet,
// examine it to determine if and how it animates, then cache the
// result. If it should animate, add the images and save which
// overlays were used.
//-----------------------------------------------------------------
function tryAddAnimation(x, y) {
    overlayRangeMap[x][y] = {start: -1, end: -1};
    let curStaticOverlays = [];
    let metatileId = map.getMetatileId(x, y);
    let metatileData = metatileCache[metatileId];
    
    // If we haven't encountered this metatile yet try to build an animation for it.
    if (metatileData == undefined)
        metatileData = metatileCache[metatileId] = getMetatileAnimData(metatileId);

    // Stop if the metatile has no animating tiles
    if (metatileData.length == 0) return;

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
            addStaticTileImage(metatileData[i]);
            newStaticOverlay = true;
            i++;
        }
        // Added static tile images, save and increment overlays
        if (newStaticOverlay) {
            setOverlayMapPos(x, y, numOverlays);
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
    // This is done so the neither the animated or static overlays are ever revealed
    // without the other, which could result in visual mistakes like flickering.
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

//------------------------------------------------------------------------
// Examines the specified metatile and returns an array of objects,
// each object containing data about how to draw one of the images
// for this metatile. For static tiles, this is the tile and tile
// position. For animated tiles, this is the tile, tile position, layer,
// image width and height, and the pixel offset into the image data.
// If this metatile has no animating tiles it returns an empty array.
//------------------------------------------------------------------------
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
            let dim = dimensions[tilePos];
            if (!dim) continue;
            metatileData.push({animates: true, pos: tilePos, layer: layer, tile: tiles[tilePos], w: dim.w, h: dim.h, imageOffset: dim.offset});
        }
    }
    return metatileData;
}

//-----------------------------------------------------
// Reads the given tile array and returns an object
// containing the positions of its animated tiles and
// the positions of any static tiles layered above or
// below the animated tiles.
//-----------------------------------------------------
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
    let positions = {static: staticTilePositions, anim: animTilePositions};
    return positions;
}

function isAnimated(tileId) {
    return curTilesetsAnimData[tileId] != undefined;
}


//==================
//  Image creation
//==================

//------------------------------------------------------------------
// Creates the images for each frame of an animated tile at the
// given position. Most of its job is determining (and saving) which
// overlays to use for the images, and it passes the actual image
// creation off to addAnimTileImage.
//------------------------------------------------------------------
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
    // NOTE: Nearly all of the animation load time comes from this loop, primarily
    // the calls to map.createImage in addAnimTileImage. The optimization for repeated
    // frames (only creating each frame image once) is almost a wash, because very few
    // animations have repeat frames, so the overhead slows down loading on many maps.
    // Maps that do have animations with repeat frames however (Route 117 especially)
    // benefit significantly.
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
            if (newFrame) {
                map.hideOverlay(overlayId);
                setOverlayMapPos(x, y, overlayId);
            }
        }

        // Create new frame image
        if (newFrame) {
            addAnimTileImage(data, i, overlayId);
            frameOverlayMap[frames[i]] = overlayId;
        }
    }

    if (!newOverlaySet) return;

    // Update overlay usage
    numOverlays = baseOverlayId;

    // Add overlays/interval to animation map
    if (animOverlayMap[interval] == undefined)
        animOverlayMap[interval] = [];
    animOverlayMap[interval].push(overlays);
    if (!curAnimIntervals.includes(interval))
        curAnimIntervals.push(interval);
}

//-------------------------------------------------------------------
// Create an image for one frame of an animated tile (or tile group)
//-------------------------------------------------------------------
function addAnimTileImage(data, frame, overlayId) {
    let tile = data.tile;
    let filepath = curTilesetsAnimData[tile.tileId].filepaths[frame];
    map.createImage(x_posToScreen(data.pos), y_posToScreen(data.pos), filepath, data.w, data.h, data.imageOffset, tile.xflip, tile.yflip, tile.palette, true, overlayId);
}

//--------------------------------------------------
// Create an image for one frame of a static tile
//--------------------------------------------------
function addStaticTileImage(data) {
    let tile = data.tile;
    map.hideOverlay(numOverlays);
    map.addTileImage(x_posToScreen(data.pos), y_posToScreen(data.pos), tile.tileId, tile.xflip, tile.yflip, tile.palette, true, numOverlays);
}

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
            posData[i] = {x: getImageDataX(anim), y: getImageDataY(anim), filepath: anim.filepath, tile: tile};
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
            posData[2] = undefined;
        }
        if (canCombine_Vertical(posData, 1, 3)) {
            // Merge positions 1 and 3 into a single tall position
            dimensions[1 + posOffset].h = tileHeight * 2;
            dimensions[3 + posOffset] = undefined;
            posData[3] = undefined;
        }
    }
    return dimensions;
}

//---------------------------------------------------------------------------------------------
// Calculate the pixel coordinates to start loading image data from for the given animation
//---------------------------------------------------------------------------------------------
function getImageDataX(anim) { return (anim.index * tileWidth) % anim.imageWidth; };
function getImageDataY(anim) { return Math.floor(anim.index * tileWidth / anim.imageWidth) * tileHeight; }

//------------------------------------------------------------------------------------
// Determine whether or not the tiles at two different positions can share an image
//------------------------------------------------------------------------------------
function canCombine(data, a, b) {
    return (data[a] && data[b]
         && data[a].filepath == data[b].filepath
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


//==================
//   Coordinates
//==================

//------------------------------------------------------------------------
// The below functions all deal with coordinate conversions.
// - mapToScreen takes a map coordinate and returns a pixel coordinate.
// - posToScreen takes a tile position and returns a pixel offset.
// - setOverlayMapPos takes map coordinates and an overlay id and sets
//   the pixel coordinates of that overlay.
// - getWrappedMapCoord takes a map coordinate and a max width or height
//   and returns a bounded map coordinate.
//------------------------------------------------------------------------
function x_mapToScreen(x) { return x * metatileWidth; }
function y_mapToScreen(y) { return y * metatileHeight; }
function x_posToScreen(tilePos) { return (tilePos % metatileTileWidth) * tileWidth; }
function y_posToScreen(tilePos) { return Math.floor((tilePos % tilesPerLayer) / metatileTileWidth) * tileHeight; }
function setOverlayMapPos(x, y, overlayId) { map.setOverlayPosition(x_mapToScreen(x), y_mapToScreen(y), overlayId); }
function getWrappedMapCoord(coord, max) { return ((coord >= 0) ? coord : (Math.abs(max - Math.abs(coord)))) % max; }


//==================
//  Data building
//==================

//-----------------------------------------------------------------------------
// Retrieve the user's animation data based on their project version, then
// populate it. There are properties expected by the program that are not
// written out in the data because they can be calculated, so this saves
// the user manual entry (for instance, copying animation data for each tile,
// or constructing the full filepath of each image).
//-----------------------------------------------------------------------------
function buildTilesetsData() {
    tilesetsData = JSON.parse(JSON.stringify(versionData[map.getBaseGameVersion()]));
    // For each tileset
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
            let anim = anims[tileId];

            // Set filepaths for animation frames
            anim.filepaths = [];
            let numFrames = anim.frames.length;
            let animPath = (anim.externalFolder ? root : tilesetPath) + anim.folder + "/";
            for (let frame = 0; frame < numFrames; frame++)
                anim.filepaths[frame] = animPath + anim.frames[frame] + animFileExtension;
            anim.filepath = animPath;

            // Copy first tile animation for the remaining tiles
            let tileIdInt = parseInt(tileId);
            for (let j = 1; j < anim.numTiles; j++) {
                let nextTileId = tileIdInt + j;
                if (!verifyAnimCopy(anims, nextTileId, tileId, tilesetName)) break;
                anims[nextTileId] = Object.assign({}, anim);
                anims[nextTileId].index = j;
            }
            anim.index = 0;

            // Create copies of animation tiles with offset frame timings (if any).
            if (!anim.frameOffsets) continue;
            for (let j = 0; j < anim.frameOffsets.length; j++) {
                let offset = Math.abs(numFrames - anim.frameOffsets[j]);

                // Shift frames for offset copy (only shifting the filepath really matters)
                let copyFrames = [];
                let copyFilepaths = [];
                for (let frame = 0; frame < numFrames; frame++) {
                    let shiftedFrame = (frame + offset) % numFrames;
                    copyFrames[frame] = anim.frames[shiftedFrame];
                    copyFilepaths[frame] = anim.filepaths[shiftedFrame];
                }

                // Write animation for each tile of this offset copy
                let copyTileIdInt = tileIdInt + anim.numTiles * (j + 1);
                for (let k = 0; k < anim.numTiles; k++) {
                    let nextTileId = copyTileIdInt + k;
                    if (!verifyAnimCopy(anims, nextTileId, copyTileIdInt, tilesetName)) break;
                    anims[nextTileId] = Object.assign({}, anim);
                    anims[nextTileId].index = k;
                    anims[nextTileId].frames = copyFrames;
                    anims[nextTileId].filepaths = copyFilepaths;
                }
            }
        }
    }
}

//-----------------------------------------------------------------------
// Verify that the specified tileset data has the required properties.
// If it's empty return false. If it's missing properties delete it and
// return false. Otherwise return true.
//-----------------------------------------------------------------------
function verifyTilesetData(tilesetName) {
    let tilesetData = tilesetsData[tilesetName];
    if (tilesetData == undefined)
        return false; // A tileset missing a header is invalid but not an error

    let valid = true;
    let reqProperties = ["tileAnimations", "folder"];
    let reqPropertyErrors = [verifyObject, verifyString];
    for (let i = 0; i < reqProperties.length; i++) {
        if (!tilesetData.hasOwnProperty(reqProperties[i])) {
            error(tilesetName + " is missing property '" + reqProperties[i] + "'");
            valid = false;
        } else {
             let errorMsg = reqPropertyErrors[i](tilesetData[reqProperties[i]]);
             if (errorMsg) {
                error(tilesetName + " has invalid property '" + reqProperties[i] + "': " + errorMsg);
                valid = false;
             }
        }
    }
    let optProperties = ["primary"];
    let optPropertyErrors = [verifyBool];
    for (let i = 0; i < optProperties.length; i++) {
        if (tilesetData.hasOwnProperty(optProperties[i])) {
             let errorMsg = optPropertyErrors[i](tilesetData[optProperties[i]]);
             if (errorMsg) {
                error(tilesetName + " has invalid property '" + optProperties[i] + "': " + errorMsg);
                valid = false;
             }
        }
    }
    if (!valid)
        delete tilesetsData[tilesetName];
    return valid;
}

//---------------------------------------------------------------------------
// Verify that the specified tile animation is valid. If it's empty return
// false. If it's missing properties or it exceeds the total tile limit
// then delete it and return false. Otherwise return true.
//---------------------------------------------------------------------------
function verifyTileAnimData(tileId, tilesetName) {
    // Assumes tileset data has already been verified
    let anim = tilesetsData[tilesetName].tileAnimations[tileId];
    if (anim == undefined)
        return false; // A missing tile animation is invalid but not an error

    let valid = true;

    if (!verifyTileLimit(tileId, tilesetName))
        valid = false;

    let reqProperties = ["numTiles", "frames", "interval", "folder", "imageWidth"];
    let reqPropertyErrors = [verifyPositive, verifyArray, verifyPositive, verifyString, verifyPositive];
    for (let i = 0; i < reqProperties.length; i++) {
        if (!anim.hasOwnProperty(reqProperties[i])) {
            error("Animation for tile " + tileId + " of " + tilesetName + " is missing property '" + reqProperties[i] + "'");
            valid = false;
        } else {
             let errorMsg = reqPropertyErrors[i](anim[reqProperties[i]]);
             if (errorMsg) {
                error("Animation for tile " + tileId + " of " + tilesetName + " has invalid property '" + reqProperties[i] + "': " + errorMsg);
                valid = false;
             }
        }
    }
    let optProperties = ["frameOffsets", "externalFolder"];
    let optPropertyErrors = [verifyArray, verifyBool];
    for (let i = 0; i < optProperties.length; i++) {
        if (anim.hasOwnProperty(optProperties[i])) {
             let errorMsg = optPropertyErrors[i](anim[optProperties[i]]);
             if (errorMsg) {
                error("Animation for tile " + tileId + " of " + tilesetName + " has invalid property '" + optProperties[i] + "': " + errorMsg);
                valid = false;
             }
        }
    }
    if (!valid)
        delete tilesetsData[tilesetName].tileAnimations[tileId];
    return valid;
}

//--------------------------------------------------------------------------
// The below are used for verifying basic validity of a property's value.
// They return an error message if invalid, and an empty string otherwise.
//--------------------------------------------------------------------------
function verifyPositive(value) {
    if (typeof value !== "number" || value <= 0)
        return "'" + value + "' is not a positive number";
    return "";
}
function verifyString(value) {
    if (typeof value !== "string")
        return "'" + value + "' is not a string";
    return "";
}
function verifyBool(value) {
    if (typeof value !== "boolean")
        return "'" + value + "' is not a boolean";
    return "";
}
function verifyObject(value) {
    if (typeof value !== "object")
        return "'" + value + "' is not an object";
    return "";
}
function verifyArray(value) {
    if (typeof value !== "object" || !Array.isArray(value) || value.length == 0)
        return "'" + value + "' is not a non-empty array";
    return "";
}

//---------------------------------------------------------------------------
// Verify that an animation can be written for targetTileId. If targetTileId
// already has an animation or exceeds the total tile limit then return
// false. Otherwise return true.
//---------------------------------------------------------------------------
function verifyAnimCopy(anims, targetTileId, srcTileId, tilesetName) {
    let valid = true;
    if (anims[targetTileId] != undefined) {
        error("Animation for tile " + srcTileId + " of " + tilesetName + " would overwrite existing animation at tile " + targetTileId);
        valid = false;
    }
    if (!verifyTileLimit(targetTileId, tilesetName))
        valid = false;
    return valid;
}

//---------------------------------------------------------------------------
// Verify that the specified tile does not exceed the tileset's limit.
// Exceeding the limit on a primary tileset is 'technically' ok as long as
// it remains within the secondary tileset limit, but warn the user as it's
// likely unintended. If the tile exceeds the secondary tileset, return
// false. Otherwise return true.
//---------------------------------------------------------------------------
function verifyTileLimit(tileId, tilesetName) {
    let primary = tilesetsData[tilesetName].primary;
    let maxTile = primary ? maxPrimaryTile : maxSecondaryTile;
    if (tileId >= maxTile) {
        let message = ("Tile " + tileId + " exceeds limit of " + (maxTile - 1) + " for " + tilesetName);
        if (primary && tileId < maxSecondaryTile) {
            warn(message);
        } else {
            error(message);
            return false;
        }
    }
    return true;
}


//==================
//     Logging
//==================

function log(message) {
    map.log(logPrefix + message);
}

function warn(message) {
    map.warn(logPrefix + message);
}

function error(message) {
    map.error(logPrefix + message);
}

//----------------------------------------------------
// Log all of the calculated animation data. Unused.
//----------------------------------------------------
function debug_printAnimDataByTileset() {
    if (!logDebugInfo) return;
    for (var tilesetName in tilesetsData) {
        log(tilesetName);
        let anims = tilesetsData[tilesetName].tileAnimations;
        debug_printAnimData(anims);
    }
}

//--------------------------------------------------
// Log the specified animation data. Used to print
// the loaded animation for the current tilesets.
//--------------------------------------------------
function debug_printAnimData(anims) {
    if (!logDebugInfo) return;
    for (var tileId in anims) {
        log(tileId);
        let anim = anims[tileId];
        for (var property in anim) {
            // Pre-computed filepath list is enormous, skip
            // printing it and use base filepath property instead
            if (property != "filepaths")
                log(property + ": " + anim[property]);
        }
        log("");
    }
}

//------------------------------------------------
// Log all the overlays being used for animation
// and which timing interval they belong to.
//------------------------------------------------
function debug_printOverlays() {
    if (!logUsageInfo) return;
    for (const interval in animOverlayMap) {
        log("Overlays animating at interval of " + interval + ":");
        let animOverlays = animOverlayMap[interval];
        for (let j = 0; j < animOverlays.length; j++) {
            log(animOverlays[j]);
        }
        log("Static overlays associated with interval " + interval + ":");
        let staticOverlays = staticOverlayMap[interval];
        if (!staticOverlays) continue;
        for (let j = 0; j < staticOverlays.overlays.length; j++) {
            log(staticOverlays.overlays[j]);
        }
    }
}
