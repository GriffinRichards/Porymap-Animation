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
var inAnimatedView = true;
var animateFuncActive = false;
var loadAnimations = true;
var numLayers = 1;

var mapName;
var mapWidth;
var mapHeight;

var tilesetsData;

// 2D array of objects tracking which layers belong to which map spaces.
// It's accessed with x/y map coordinates, e.g. layerRangeMap[x][y], and
// returns an object with a 'start' and 'end' property which are the first
// and max layer used by that map space. This is used to clear the layers
// for a space when it's drawn on.
var layerRangeMap;

// These objects map layers to the intervals of the animation they're associated with.
// Each property is an interval. For animLayerMap, each value is an array of layer ids; each
// layer is only associated with 1 interval. For staticLayerMap, each value is an object
// containing an array of layer ids and a value for whether or not they are currently hidden.
// Static layers are associated with every interval that exists on the map space they are
// associated with. The array below them is for temporarily tracking which intervals are being
// used in order to build staticLayerMap.
var animLayerMap = {};
var staticLayerMap = {};
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
// metatile layer so that they can be grouped together on the same layers.
// It takes both the interval and number of frames as properties, and the returned
// value is the layer the first frame belongs to.
var curAnimToLayerMap = {};

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

const versionMap = {
    "pokeruby": 0,
    "pokefirered": 1,
    "pokeemerald": 2,
};


//====================
//   Main callbacks
//====================

export function onProjectOpened(projectPath) {
    root = projectPath + "/";
    tilesPerMetatile = constants.tiles_per_metatile;
    maxMetatileLayer = constants.layers_per_metatile;
    maxPrimaryTile = constants.max_primary_tiles;
    maxSecondaryTile = maxPrimaryTile + constants.max_secondary_tiles;
    inAnimatedView = !(utility.getMainTab() || utility.getMapViewTab());
    if (verifyPorymapVersion(5,1,1)) { // registerToggleAction was introduced in 5.1.1
        utility.registerToggleAction("toggleAnimation", "Toggle Map Animations", toggleShortcut, animateOnLaunch);
    } else {
        utility.registerAction("toggleAnimation", "Toggle Map Animations", toggleShortcut);
    }
    buildTilesetsData();
    if (animateOnLaunch) toggleAnimation();
}

export function onMapOpened(newMapName) {
    overlay.clear();
    mapName = newMapName;
    mapWidth = map.getWidth();
    mapHeight = map.getHeight();
    loadAnimations = true;
}

export function onMapResized(oldWidth, oldHeight, newWidth, newHeight) {
    overlay.clear();
    mapWidth = newWidth;
    mapHeight = newHeight;
    loadAnimations = true;
}

export function onMapShifted(xDelta, yDelta) {
    if (xDelta == 0 && yDelta == 0) return;

    // Move and wrap the layers and reconstruct layerRangeMap
    let newMap = {};
    for (let x = 0; x < mapWidth; x++) {
        if (!newMap[x]) newMap[x] = {};
        for (let y = 0; y < mapHeight; y++) {
            if (!newMap[x][y]) newMap[x][y] = {start: -1, end: -1};
            let layerStart = layerRangeMap[x][y].start;
            if (layerStart == -1) continue;
            let newX = getWrappedMapCoord(x + xDelta, mapWidth);
            let newY = getWrappedMapCoord(y + yDelta, mapHeight);
            let layerEnd = layerRangeMap[x][y].end;
            for (let i = layerStart; i < layerEnd; i++)
                setLayerMapPos(newX, newY, i);
            if (!newMap[newX]) newMap[newX] = {}
            newMap[newX][newY] = {start: layerStart, end: layerEnd};
        }
    }
    layerRangeMap = newMap;
}

export function onTilesetUpdated(tilesetName) {
    overlay.clear();
    loadAnimations = true;
}

export function onMainTabChanged(oldTab, newTab) {
    inAnimatedView = !(newTab || utility.getMapViewTab());
    tryStartAnimation();
}

export function onMapViewTabChanged(oldTab, newTab) {
    inAnimatedView = !newTab; // Main tab assumed to be map tab
    tryStartAnimation();
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
//-------------------------------------------------------------------------------
export function animate() {
    if (!shouldAnimate()) {
        // Stop animation
        animateFuncActive = false;
        hideOverlay();
        return;
    }
    if (loadAnimations) {
        resetAnimation();
        loadMapAnimations();
        timerMax = calculateTimerMax();
        if (logDebugInfo) log("Timer max: " + timerMax);
        if (logUsageInfo) {
            log("Layers used: " + (numLayers - 1));
            debug_printLayers();
        }
    }
    updateOverlay(timer);
    if (++timer >= timerMax)
        timer = 0;
    utility.setTimeout(animate, refreshTime);
}

export function toggleAnimation() {
    animating = !animating;
    if (logBasicInfo) log("Animations " + (animating ? "on" : "off"));
    tryStartAnimation();
}

function shouldAnimate() {
    return animating && inAnimatedView;
}

function tryStartAnimation() {
    if (!shouldAnimate()) return;

    // Only call animation loop if it's not already running.
    if (!animateFuncActive) {
        animateFuncActive = true;
        timer = 0;
        animate();
    }
}

function hideOverlay() {
    overlay.hide();
    for (const interval in staticLayerMap)
        staticLayerMap[interval].hidden = true;
}

function resetAnimation() {
    overlay.clear();
    numLayers = 1;
    timer = 0;
    animLayerMap = {};
    staticLayerMap = {};
    metatileCache = {};
}

//--------------------------------------------------------------------
// This function is responsible for visually updating the animation.
// It does this by selectively hiding and showing layers that each
// have different tile frame images on them.
//--------------------------------------------------------------------
function updateOverlay(timer) {
    // For each timing interval of the current animations
    for (const interval in animLayerMap) {
        if (timer % interval == 0) {
            // For each tile animating at this interval,
            // hide the previous frame and show the next frame
            let layerLists = animLayerMap[interval];
            if (!layerLists) continue;
            for (let i = 0; i < layerLists.length; i++) {
                let layerList = layerLists[i];
                let curFrame = (timer / interval) % layerList.length;
                let prevFrame = curFrame ? curFrame - 1 : layerList.length - 1;
                overlay.hide(layerList[prevFrame]);
                overlay.show(layerList[curFrame]);
            }

            // Show all the unrevealed static layers associated
            // with animations at this interval
            if (staticLayerMap[interval] && staticLayerMap[interval].hidden) {
                for (let i = 0; i < staticLayerMap[interval].layers.length; i++)
                    overlay.show(staticLayerMap[interval].layers[i])
                staticLayerMap[interval].hidden = false;
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
    loadAnimations = false;

    curTilesetsAnimData = getCurrentTileAnimationData();
    if (curTilesetsAnimData == undefined) {
        if (logBasicInfo) log("No animations on this map");
        return;
    }
    debug_printAnimData(curTilesetsAnimData);

    layerRangeMap = {};
    for (let x = 0; x < mapWidth; x++) {
        layerRangeMap[x] = {};
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
// Layers are not re-used unless animations are fully reloaded, so this
// doesn't bother to remove layers from the layer maps. Over a very long
// period this could impact performance, but it keeps drawing speed high.
//----------------------------------------------------------------------------
function tryRemoveAnimation(x, y) {
    if (layerRangeMap[x][y].start != -1) {
        for (let i = layerRangeMap[x][y].start; i < layerRangeMap[x][y].end; i++)
            overlay.clear(i);
    }
}

//-----------------------------------------------------------------
// Tries to create a new animation at the given map coordinates.
// If the metatile at this position has not been encountered yet,
// examine it to determine if and how it animates, then cache the
// result. If it should animate, add the images and save which
// layers were used.
//-----------------------------------------------------------------
function tryAddAnimation(x, y) {
    layerRangeMap[x][y] = {start: -1, end: -1};
    let curStaticLayers = [];
    let metatileId = map.getMetatileId(x, y);
    let metatileData = metatileCache[metatileId];
    
    // If we haven't encountered this metatile yet try to build an animation for it.
    if (metatileData == undefined)
        metatileData = metatileCache[metatileId] = getMetatileAnimData(metatileId);

    // Stop if the metatile has no animating tiles
    if (metatileData.length == 0) return;

    let tiles = metatileData.tiles;
    let len = metatileData.length;

    // Save starting layer for this map space
    layerRangeMap[x][y].start = numLayers;
    curAnimIntervals = [];

    // Add tile images.
    // metatileData is sorted first by layer, then by whether the tile is static or animated.
    // Most of the way this is laid out is to simplify tracking layers for allowing as many
    // images as possible to be grouped together on the same layers.
    let i = 0;
    let layer = -1;
    while (i < len) {
        // Draw static tiles on a shared layer until we hit an animated tile or the end of the array
        let newStaticLayer = false;
        while(metatileData[i] && !metatileData[i].animates) {
            addStaticTileImage(metatileData[i]);
            newStaticLayer = true;
            i++;
        }
        // Added static tile images, save and increment layers
        if (newStaticLayer) {
            setLayerMapPos(x, y, numLayers);
            curStaticLayers.push(numLayers);
            numLayers++;
        }

        // Draw animated tiles until we hit a static tile or the end of the array.
        // Layer usage is handled already by addAnimTileFrames / curAnimToLayerMap
        while (metatileData[i] && metatileData[i].animates) {
            // Reset cache between layers
            if (metatileData[i].layer != layer) {
                curAnimToLayerMap = {};
                layer = metatileData[i].layer;
            }
            addAnimTileFrames(x, y, metatileData[i]);
            i++;
        }
    }

    // Save static layers to array for each animation interval this metatile has.
    // Whichever interval occurs next will reveal the static layers.
    // This is done so the neither the animated or static layers are ever revealed
    // without the other, which could result in visual mistakes like flickering.
    if (curStaticLayers.length != 0) {
        for (let i = 0; i < curAnimIntervals.length; i++) {
            let interval = curAnimIntervals[i];
            if (staticLayerMap[interval] == undefined)
                staticLayerMap[interval] = {hidden: true, layers: []};
            staticLayerMap[interval].layers = staticLayerMap[interval].layers.concat(curStaticLayers);
            staticLayerMap[interval].hidden = true;
        }
    }

    // Save end of layer range for this map space
    layerRangeMap[x][y].end = numLayers;
    if (logUsageInfo) log("Using layers " + layerRangeMap[x][y].start + "-" + (layerRangeMap[x][y].end - 1) + " at " + x + "," + y);
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
    if (logDebugInfo) log("Scanning " + metatileId);
    let positions = scanTiles(tiles);

    // No animating tiles, end early
    if (positions.anim.length == 0) return metatileData;
    debug_printObject(positions);

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
            metatileData.push({animates: true, pos: tilePos, layer: layer, tile: tiles[tilePos], w: dim.w, h: dim.h, xOffset: dim.xOffset, yOffset: dim.yOffset});
        }
    }
    debug_printObjectArr(metatileData);
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
// layers to use for the images, and it passes the actual image
// creation off to addAnimTileImage.
//------------------------------------------------------------------
function addAnimTileFrames(x, y, data) {
    let tileId = data.tile.tileId;
    let frames = curTilesetsAnimData[tileId].frames;
    let interval = curTilesetsAnimData[tileId].interval;

    // Get which layer to start creating the frame images on.
    // If there is already a set of images on this layer that share
    // an interval and number of frames, just use the same layers.
    if (!curAnimToLayerMap[interval]) curAnimToLayerMap[interval] = {};
    let baseLayerId = curAnimToLayerMap[interval][frames.length];
    let newLayerSet = (baseLayerId == undefined);

    // If it's a new interval+frame count, start the layer usage at the next available layer (and save to cache)
    if (newLayerSet) baseLayerId = curAnimToLayerMap[interval][frames.length] = numLayers;

    // Add frame images for this tile
    // NOTE: Nearly all of the animation load time comes from this loop, primarily
    // the calls to overlay.createImage in addAnimTileImage. The optimization for repeated
    // frames (only creating each frame image once) is almost a wash, because very few
    // animations have repeat frames, so the overhead slows down loading on many maps.
    // Maps that do have animations with repeat frames however (Route 117 especially)
    // benefit significantly.
    let layers = [];
    let frameLayerMap = {};
    for (let i = 0; i < frames.length; i++) {
        // Get layer to use for this frame. Repeated frames will share a layer/image
        let layerId = frameLayerMap[frames[i]];
        let newFrame = (layerId == undefined);
        if (newFrame) layerId = baseLayerId++;

        // If this a new set of layers, save them to an array so they can be tracked for animation.
        // Also hide the layer; animated frame images are hidden until their frame is active
        if (newLayerSet) {
            layers.push(layerId);
            if (newFrame) {
                overlay.hide(layerId);
                setLayerMapPos(x, y, layerId);
            }
        }

        // Create new frame image
        if (newFrame) {
            addAnimTileImage(data, i, layerId);
            frameLayerMap[frames[i]] = layerId;
        }
    }

    if (!newLayerSet) return;

    // Update layer usage
    numLayers = baseLayerId;

    // Add layers/interval to animation map
    if (animLayerMap[interval] == undefined)
        animLayerMap[interval] = [];
    animLayerMap[interval].push(layers);
    if (!curAnimIntervals.includes(interval))
        curAnimIntervals.push(interval);
}

//-------------------------------------------------------------------
// Create an image for one frame of an animated tile (or tile group)
//-------------------------------------------------------------------
function addAnimTileImage(data, frame, layerId) {
    let tile = data.tile;
    let filepath = curTilesetsAnimData[tile.tileId].filepaths[frame];
    let hScale = tile.xflip ? -1 : 1;
    let vScale = tile.yflip ? -1 : 1;
    overlay.createImage(x_posToScreen(data.pos), y_posToScreen(data.pos), filepath, data.w, data.h, data.xOffset, data.yOffset, hScale, vScale, tile.palette, true, layerId);
}

//--------------------------------------------------
// Create an image for one frame of a static tile
//--------------------------------------------------
function addStaticTileImage(data) {
    let tile = data.tile;
    overlay.hide(numLayers);
    overlay.addTileImage(x_posToScreen(data.pos), y_posToScreen(data.pos), tile.tileId, tile.xflip, tile.yflip, tile.palette, true, numLayers);
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
            dimensions[tilePos] = {w: tileWidth, h: tileHeight, xOffset: posData[i].x, yOffset: posData[i].y};
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
// - setLayerMapPos takes map coordinates and a layer id and sets
//   the pixel coordinates of that layer.
// - getWrappedMapCoord takes a map coordinate and a max width or height
//   and returns a bounded map coordinate.
//------------------------------------------------------------------------
function x_mapToScreen(x) { return x * metatileWidth; }
function y_mapToScreen(y) { return y * metatileHeight; }
function x_posToScreen(tilePos) { return (tilePos % metatileTileWidth) * tileWidth; }
function y_posToScreen(tilePos) { return Math.floor((tilePos % tilesPerLayer) / metatileTileWidth) * tileHeight; }
function setLayerMapPos(x, y, layerId) { overlay.setPosition(x_mapToScreen(x), y_mapToScreen(y), layerId); }
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
    tilesetsData = JSON.parse(JSON.stringify(versionData[versionMap[constants.base_game_version]]));
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

//---------------------------------------------------------------------------
// Verify if the user's version of Porymap is at least as new as the version
// numbers provided. Returns false if the user's version is older than the
// the provided version. Otherwise returns true.
//---------------------------------------------------------------------------
function verifyPorymapVersion(major, minor, patch) {
    if (constants.version.major != major)
        return constants.version.major > major;
    if (constants.version.minor != minor)
        return constants.version.minor > minor;
    return constants.version.patch >= patch;
}


//==================
//     Logging
//==================

function log(message) {
    utility.log(logPrefix + message);
}

function warn(message) {
    utility.warn(logPrefix + message);
}

function error(message) {
    utility.error(logPrefix + message);
}

function debug_printObject(object) {
    if (!logDebugInfo) return;
    log(JSON.stringify(object));
}

function debug_printObjectArr(object) {
    if (!logDebugInfo) return;
    for (var property in object)
        log(JSON.stringify(object[property]));
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
// Log all the layers being used for animation
// and which timing interval they belong to.
//------------------------------------------------
function debug_printLayers() {
    if (!logUsageInfo) return;
    for (const interval in animLayerMap) {
        log("Layers animating at interval of " + interval + ":");
        let animLayers = animLayerMap[interval];
        for (let j = 0; j < animLayers.length; j++) {
            log(animLayers[j]);
        }
        log("Static layers associated with interval " + interval + ":");
        let staticLayers = staticLayerMap[interval];
        if (!staticLayers) continue;
        for (let j = 0; j < staticLayers.layers.length; j++) {
            log(staticLayers.layers[j]);
        }
    }
}
