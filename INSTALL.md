## Prerequisites

This plug-in works with Porymap, which can be [downloaded here](https://github.com/huderlem/porymap/releases). Version 5.2.0 or newer is suggested. Version 5.0.0 is the oldest supported version.

If you are using Porymap version 4.5.0, you can instead download the [older version of this script](https://github.com/GriffinRichards/Porymap-Animation/releases/tag/v1.0.0).

You are assumed to already have a Pokémon generation 3 decompilation project set up. If you do not, see the `INSTALL.md` at [pokeemerald](https://github.com/pret/pokeemerald), [pokefirered](https://github.com/pret/pokefirered) or [pokeruby](https://github.com/pret/pokeruby), or the fork of your choice.
There is very little this plug-in needs from your project, and what little it does (filepaths) can be changed in `settings.js` and `animations_<version>.js`, so if your project works with a compatible version of Porymap it should work with this plug-in.

## Installation

1. Clone this repository to the location of your choice.
```
git clone https://github.com/GriffinRichards/Porymap-Animation
```

2. Launch Porymap and open the `Options -> Custom Scripts...` window.

    <details>
        <summary><i>If using a Porymap version older than 5.2.0...</i></summary>

    >   You won't have `Options -> Custom Scripts...` available. You'll need to manually specify the path to `animation.js` under `custom_scripts` in `porymap.user.cfg` or `porymap.project.cfg`.
    >   After specifying this path you can skip the remaining steps.
    </details>

3. Select the `Load Script` button, then in the file prompt navigate to and select `Porymap-Animation/animation.js`.

4. Close the window by selecting `OK`.


That's it! You should now see the new option `Toggle Map Animations` available under `Tools`, which you can use to turn the animations on or off.

For information on creating your own animations or changing the animation settings see [GUIDE.md](https://github.com/GriffinRichards/Porymap-Animation/blob/master/GUIDE.md)

If you have questions, see [the FAQ](https://github.com/GriffinRichards/Porymap-Animation#faq).
