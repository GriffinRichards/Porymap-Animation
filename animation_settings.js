//====================
//     Settings
//====================

export const toggleShortcut = "Ctrl+A";
export const animateOnLaunch = true;
export const logPrefix = "ANIM: ";

// Animation data
import {tilesetsData as em}   from './animations_emerald.js';
import {tilesetsData as frlg} from './animations_frlg.js';
//import {tilesetsData as rs}   from './animations_ruby_saph.js';
export const versionData = [/*rs*/{}, frlg, em];

// Base filepaths
export const tilesetsPath = "data/tilesets/"
export const primaryPath = tilesetsPath + "primary/";
export const secondaryPath = tilesetsPath + "secondary/";
export const animFileExtension = ".png";

// Timing
 // There are 1000ms in a second, and the GBA's refresh rate is ~59.73 frames per second.
 // After rounding, the refresh rate will be just slightly slower than the GBA (17ms vs 16.74ms).
 // The timer operates in millisecond units, so it is not possible to set a closer interval.
export const refreshTime =  Math.round(1000 / 59.73);
export const defaultTimerMax = 55440; // Arbitrary "highly composite" number

// Exceptions
// If you'd like to always skip animations for certain maps, add them to this list
export const mapExceptions = [""]; // e.g. ["PetalburgCity", ...]
