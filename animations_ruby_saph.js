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
            640: {
                folder: "0", // "windy_water",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                copies: [{tileId: 644, frameOffset: 1},
                         {tileId: 648, frameOffset: 2},
                         {tileId: 652, frameOffset: 3},
                         {tileId: 656, frameOffset: 4},
                         {tileId: 660, frameOffset: 5},
                         {tileId: 664, frameOffset: 6},
                         {tileId: 668, frameOffset: 7},
                ],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
            960: { // 0x3C0
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
            608: { // TODO: Fix
                folder: "0", // "flower_1",
                frames: ["0", "0", "1", "2",
                         "3", "3", "3", "3",
                         "3", "3", "2", "1",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4"],
                copies: [{tileId: 612, frameOffset: 1},
                         {tileId: 616, frameOffset: 2},
                         {tileId: 620, frameOffset: 3},
                         {tileId: 624, frameOffset: 4},
                         {tileId: 628, frameOffset: 5},
                         {tileId: 632, frameOffset: 6},
                         {tileId: 636, frameOffset: 7},
                ],
                numTiles: 4,
                interval: 8,
                imageWidth: 16,
            },
            640: {
                folder: "1", // "flower_2",
                frames: ["0", "0", "1", "2",
                         "3", "3", "3", "3",
                         "3", "3", "2", "1",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4",
                         "0", "0", "4", "4"],
                copies: [{tileId: 644, frameOffset: 1},
                         {tileId: 648, frameOffset: 2},
                         {tileId: 652, frameOffset: 3},
                         {tileId: 656, frameOffset: 4},
                         {tileId: 660, frameOffset: 5},
                         {tileId: 664, frameOffset: 6},
                         {tileId: 668, frameOffset: 7},
                ],
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
            800: {
                folder: "", // "steam",
                frames: ["0", "1", "2", "3"],
                copies: [{tileId: 804, frameOffset: 2}],
                numTiles: 4,
                interval: 16,
                imageWidth: 8,
            },
            672: { // Lavaridge's lava gets its images from the cave tileset
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
            736: {
                folder: "", // "flowers",
                frames: ["0", "1", "2", "3", "4", "5", "6", "7"],
                copies: [{tileId: 740, frameOffset: 1},
                         {tileId: 744, frameOffset: 2},
                         {tileId: 748, frameOffset: 3},
                         {tileId: 752, frameOffset: 4},
                         {tileId: 756, frameOffset: 5},
                         {tileId: 760, frameOffset: 6},
                         {tileId: 764, frameOffset: 7},
                ],
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
            976: {
                folder: "0", // "log_bridges",
                frames: ["0", "1", "2"],
                numTiles: 30,
                interval: 16,
                imageWidth: 8,
            },
            1008: {
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
            1008: {
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
            976: {
                folder: "1", // "front_waterfall",
                frames: ["0", "1", "2"],
                numTiles: 20,
                interval: 8,
                imageWidth: 32,
            },
            1008: { // Unused in vanilla
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
            928: {
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
            992: {
                folder: "1", // "floor_light",
                frames: ["0", "1"],
                numTiles: 4,
                interval: 64,
                imageWidth: 16,
            },
            1016: {
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
            656: {
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
            1008: {
                folder: "", // "blinking_lights",
                frames: ["0", "1"],
                numTiles: 9,
                interval: 4,
                imageWidth: 72,
            },
        },
    },
};
