/*



*/

export const tilesetsData = {
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
            640: { // TODO: Maybe condense copy lists into a single numCopies and offset(s) field
                folder: "windy_water",
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
            608: {
                folder: "flower_1",
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
                folder: "flower_2",
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
                folder: "steam",
                frames: ["0", "1", "2", "3"],
                copies: [{tileId: 804, frameOffset: 2}],
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
            736: { // TODO: Handle alternate flower color?
                folder: "flowers",
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
                imageWidth: 16,
            },
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
