## Prerequisites

**NOTE:** This plug-in is not currently supported by any released version of Porymap. It can only be used if you build Porymap from source using the version located at this branch: https://github.com/GriffinRichards/porymap/tree/expand-API

You are assumed to already have a Pokémon generation 3 decompilation project set up. If you do not, see the `INSTALL.md` at [pokeemerald](https://github.com/pret/pokeemerald), [pokefirered](https://github.com/pret/pokefirered) or [pokeruby](https://github.com/pret/pokeruby), or the fork of your choice.
There is very little this plug-in needs from your project, and what little it does (filepaths) can be changed in `settings.js` and `animations_<version>.js`, so if your project works with a compatible version of Porymap it should work with this plug-in.

## Installation

1. Clone this repository to the location of your choice.
```
git clone https://github.com/GriffinRichards/Porymap-Animation
```

2. Navigate to your decompilation project folder and locate your `porymap.project.cfg` file. If you do not have one then open your project with Porymap and one will be created.

3. Open this file and locate the `custom_scripts` field, and include the path to `Porymap-Animation/animation.js` in this field. For instance if you cloned `Porymap-Animation` inside your project folder and had no pre-existing custom scripts, the field should look like this
```
custom_scripts=Porymap-Animation/animation.js
```

That's it! If Porymap is currently open relaunch it.

You should see two new options under `Tools`, `Toggle Map Animations` and `Reload Map Animations`. The toggle will turn the animations on or off, and the reload can be used to restart animation if you encounter an issue.

For information on creating your own animations or changing the animation settings see [GUIDE.md](https://github.com/GriffinRichards/Porymap-Animation/blob/master/GUIDE.md)
