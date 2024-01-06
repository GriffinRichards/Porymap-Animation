# Porymap Animation

An animation plug-in for [Porymap][porymap], the Pokémon generation 3 decompilation map editor.

To start using this plug-in, see [INSTALL.md][install].

For help using this plug-in, see [GUIDE.md][guide] or the FAQ below.

![Animation preview](https://user-images.githubusercontent.com/25753467/170611564-94576b17-1551-4109-873f-e78494550031.gif)

## FAQ

- [What does this do?](https://github.com/GriffinRichards/Porymap-Animation/blob/master/README.md#what-does-this-do)
- [How do I use this?](https://github.com/GriffinRichards/Porymap-Animation#how-do-i-use-this)
- [Will this modify my maps/tilesets/project in any way?](https://github.com/GriffinRichards/Porymap-Animation#will-this-modify-my-mapstilesetsproject-in-any-way)
- [My animation isn't working, what's wrong?](https://github.com/GriffinRichards/Porymap-Animation#my-animation-isnt-working-whats-wrong)
- [Why isn't this animation I added working?](https://github.com/GriffinRichards/Porymap-Animation#why-isnt-this-animation-i-added-working)
- [Why aren't the border/map connections animating?](https://github.com/GriffinRichards/Porymap-Animation#why-arent-the-bordermap-connections-animating)
- [Are the animations supposed to slow down/stop when I move the mouse rapidly?](https://github.com/GriffinRichards/Porymap-Animation#are-the-animations-supposed-to-slow-downstop-when-i-move-the-mouse-rapidly)
- [Why is this not built in to Porymap?](https://github.com/GriffinRichards/Porymap-Animation#why-is-this-not-built-in-to-porymap)

### What does this do?

This plug-in animates the tiles on maps viewed in Porymap so that you can see what they would look like in-game.


### How do I use this?

See [INSTALL.md][install] to install the plug-in. 

After installation it will run automatically whenever you open your project with Porymap. You can change the plug-in's settings in `settings.js`. See [GUIDE.md][guide] for how to create your own animations.


### Will this modify my maps/tilesets/project in any way?

No. This does not write to any files and will not make any changes to your project. It will only read the images specified by your `animations_<version>.js` file and use them to create visual effects in Porymap. These effects can be toggled on or off at any time.


### My animation isn't working, what's wrong?

See the troubleshooting list below.

**Note**: If the plug-in encounters an error it will be logged in Porymap's log file, located at `%Appdata%\pret\porymap\porymap.log` for Windows or `~/Library/Application Support/pret/porymap/porymap.log` for macOS. Anything in the log related to this plug-in will have the prefix `ANIM: `

1. Make sure you've followed the instructions in [INSTALL.md][install].
2. Open `Options -> Project Settings`, find your entry for `animation.js`, and make sure the check box next to it is checked. If you don't see an entry for `animation.js`, go back to [INSTALL.md][install]!
3. Make sure `Tools -> Toggle Map Animations` is checked. If you don't see `Tools -> Toggle Map Animations` then the script hasn't loaded! Check Porymap's log file for errors and look over your changes to `settings.js` and `animations_<version>.js` for mistakes.
4. In Porymap select both the `Map` tab on the top bar, and either the `Metatiles` or `Prefabs` tab in the right panel. Animations run in these tab views only.
5. Have you added animation data? All tile animations must have data in your `animations_<version>.js` file to animate. The script comes pre-loaded with data for all the vanilla animations, but if you add or change any animations you must update this file accordingly. See [GUIDE.md][guide] for more information.
6. Remove the map's name from `mapExceptions` in `settings.js` if it has been added there.
7. If you are still unable to get animations working you can join pret's [Discord](https://discord.gg/d5dubZ3) and ask for help in the `#porymap` channel.


### Why isn't this animation I added working?

For any new tileset animations you've created you'll need to add animation data to tell the plug-in how to recreate it (the plug-in comes pre-loaded with data for all the animations in the original games). Check the [GUIDE.md][guide] to see how to do this, and make sure your new animation data follows the correct format. If the original game's animations also aren't working see the troubleshooting list above. If you're still stuck you can join pret's [Discord](https://discord.gg/d5dubZ3) and ask for help in the `#porymap` channel.

### Why aren't the border/map connections animating?

Porymap's API doesn't currently support reading tiles from the connecting maps, which is necessary to create animations there. The API does support reading tiles in the current map's border, but animating the border and not connecting maps would look strange. I may decide to add support for this in the future.


### Are the animations supposed to slow down/stop when I move the mouse rapidly?

Sort of. This is an issue with Porymap, not the plug-in, and has to do with what happens when the mouse enters a new map square.


### Why is this not built in to Porymap?

There'd be a lot of hassle to do it well. It's the kind of thing that can definitely be done much better as part of Porymap, but is probably best left to personal forks where people can implement it in a way that works for them. A plug-in offers some of this freedom without needing to fork Porymap.

Also a bit of author preference here; I wanted an excuse to test the limits of Porymap's API and expand what it has to offer.




[porymap]: https://github.com/huderlem/porymap
[pokeemerald]: https://github.com/pret/pokeemerald
[pokefirered]: https://github.com/pret/pokefirered
[pokeruby]: https://github.com/pret/pokeruby
[install]: https://github.com/GriffinRichards/Porymap-Animation/blob/master/INSTALL.md
[guide]: https://github.com/GriffinRichards/Porymap-Animation/blob/master/GUIDE.md
