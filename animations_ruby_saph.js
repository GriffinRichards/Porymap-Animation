/*



*/

export const tilesetsData = {
    "gTileset_General": {
        folder: "general/anim",
        primary: true,
        tileAnimations: {
            432: { // (0x1B0)
                folder: "1", // "water",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                numTiles: 30,
                interval: 16,
                imageWidth: 16,
            },
            464: { // (0x1D0)
                folder: "2", // "sand_water_edge",
                frames: ["0", "1", "2", "3", "4", "5", "6"],
                numTiles: 10,
                interval: 16,
                imageWidth: 16,
            },
            480: { // (0x1E0)
                folder: "4", // "land_water_edge",
                frames: ["0", "1", "2", "3"],
                numTiles: 10,
                interval: 16,
                imageWidth: 80,

            },
            496: { // (0x1F0)
                folder: "3", // "waterfall",
                frames: ["0", "1", "2", "3"],
                numTiles: 6,
                interval: 16,
                imageWidth: 48,
            },
            508: { // (0x1FC)
                folder: "0", // "flower",
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
                folder: "", // "tv_turned_on",
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
            640: { // (0x280)
                folder: "0", // "windy_water",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                frameOffsets: [1, 2, 3, 4, 5, 6, 7],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
            960: { // (0x3C0)
                folder: "1", // "fountain",
                frames: ["0", "1"],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
        },
    },
    "gTileset_Mauville": {
        folder: "mauville/anim",
        primary: false,
        tileAnimations: {
            608: { // (0x260)
                folder: "0", // "flower_1",
                frames: ["0", "0", "1", "2",
                         "3", "3", "3", "3",
                         "3", "3", "2", "1",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4"],
                frameOffsets: [1, 2, 3, 4, 5, 6, 7],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
            640: { // (0x280)
                folder: "1", // "flower_2",
                frames: ["0", "0", "1", "2",
                         "3", "3", "3", "3",
                         "3", "3", "2", "1",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4"],
                frameOffsets: [1, 2, 3, 4, 5, 6, 7],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
        },
    },
    "gTileset_Lavaridge": {
        folder: "lavaridge/anim",
        primary: false,
        tileAnimations: {
            800: { // (0x320)
                folder: "", // "steam",
                frames: ["0", "1", "2", "3"],
                frameOffsets: [2],
                numTiles: 4,
                interval: 16,
                imageWidth: 8,
            },
            672: { // (0x2A0) Lavaridge's lava gets its images from the cave tileset
                folder: "data/tilesets/secondary/cave/anim",
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
            736: { // (0x2E0)
                folder: "", // "flowers",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                frameOffsets: [1, 2, 3, 4, 5, 6, 7],
                numTiles: 4,
                interval: 8,
                imageWidth: 32,
            },
        },
    },
    "gTileset_Pacifidlog": {
        folder: "pacifidlog/anim",
        primary: false,
        tileAnimations: {
            976: { // (0x3D0)
                folder: "0", // "log_bridges",
                frames: ["0", "1", "2"],
                numTiles: 30,
                interval: 16,
                imageWidth: 8,
            },
            1008: { // (0x3F0)
                folder: "1", // "water_currents",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                numTiles: 8,
                interval: 16,
                imageWidth: 16,
            },
        },
    },
    "gTileset_Underwater": {
        folder: "underwater/anim",
        primary: false,
        tileAnimations: {
            1008: { // (0x3F0)
                folder: "", // "seaweed",
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
            976: { // (0x3D0)
                folder: "1", // "front_waterfall",
                frames: ["0", "1", "2"],
                numTiles: 20,
                interval: 8,
                imageWidth: 32,
            },
            1008: { // (0x3F0) Unused in vanilla
                folder: "0", // "side_waterfall",
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
            928: { // (0x3A0)
                folder: "", // "lava",
                frames: ["0", "1", "2", "3"],
                numTiles: 4,
                interval: 16,
                imageWidth: 8,
            },
        },
    },
    "gTileset_EliteFour": {
        folder: "elite_four/anim",
        primary: false,
        tileAnimations: {
            992: { // (0x3E0)
                folder: "1", // "floor_light",
                frames: ["0", "1"],
                numTiles: 4,
                interval: 64,
                imageWidth: 16,
            },
            1016: { // (0x3F8)
                folder: "0", // "wall_lights",
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
            656: { // (0x290)
                folder: "", // "electric_gates",
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
            1008: { // (0x3F0)
                folder: "", // "blinking_lights",
                frames: ["0", "1"],
                numTiles: 9,
                interval: 4,
                imageWidth: 72,
            },
        },
    },
};
