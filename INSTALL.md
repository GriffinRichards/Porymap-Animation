## Prerequisites

Porymap release version 4.5.0 is required. Porymap can be [downloaded here](https://github.com/huderlem/porymap/releases).

If you are building your own copy of Porymap between 4.5.0 and the unreleased 5.0.0 you will need to clone [the porymap-5 branch of this script instead](https://github.com/GriffinRichards/Porymap-Animation/tree/porymap-5).

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

If you have questions, see [the FAQ](https://github.com/GriffinRichards/Porymap-Animation#faq).
