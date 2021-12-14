# Porymap Animation

An animation plug-in for [Porymap][porymap], the Pokémon generation 3 decompilation map editor.

To start using this plug-in, see [INSTALL.md][install].

For help creating your own animations in this plug-in, see [GUIDE.md][guide].

![Animation Preview](/preview.gif)

## FAQ

### What does this do?

This plug-in animates the tiles on maps viewed in Porymap so that you can see what they would look like in-game.


### How do I use this?

See [INSTALL.md][install] to install the plug-in. 

After installation it will run automatically whenever you open your project with Porymap. You can change the plug-in's settings in `settings.js`. See [GUIDE.md][guide] for how to create your own animations.


### Will this modify my maps/tilesets/project in any way?

No. This does not write to any files and will not make any changes to your project. It will only read the images specified by your `animations_<version>.js` file and use them to create visual effects in Porymap. These effects can be toggled on or off at any time.


### Nothing is animating, what's wrong?

See the troubleshooting list below.

**Note**: If the plug-in encounters an error it will be logged in Porymap's log file, located at `%Appdata%\pret\porymap\porymap.log` for Windows or `~/Library/Application Support/pret/porymap/porymap.log` for macOS. Anything in the log related to this plug-in will have the prefix `ANIM: `

1. Make sure you've followed the instructions in [INSTALL.md][install].
2. In Porymap select both the `Map` tab on the top bar and the `Metatiles` tab in the right panel. Animations run in this tab view only.
3. Try reloading map animations, with `Tools -> Reload Map Animations`.
4. If you do not see `Tools -> Reload Map Animations` then the plug-in has not loaded successfully. Check Porymap's log file for errors and look over your changes to `settings.js` and `animations_<version>.js` for mistakes.
5. Ensure this map has tiles that animate. Only tiles associated with data in `animations_<version>.js` will animate.
6. Remove the map's name from `mapExceptions` in `settings.js` if it has been added there.
7. If you are still unable to get animations working you can join pret's [Discord](https://discord.gg/d5dubZ3) and ask for help in the `#porymap` channel.


### Why isn't this animation I added working?

See if the [GUIDE.md][guide] answers your question. If not, see bullet point 7 in the answer above.


### Why aren't the border/map connections animating?

Porymap's API doesn't currently support reading tiles from the border or the connecting maps, which is necessary to create animations there. Extending the API to do this for borders is trivial, but is less so for connecting maps, and animating one but not the other would look strange. I may decide to add support for this in the future.


### Are the animations supposed to slow down/stop when I move the mouse rapidly?

Sort of. This is an issue with Porymap, not the plug-in, and has to do with what happens when the mouse enters a new map square.


### Why is this not built in to Porymap?

There'd be a lot of hassle to do it well. It's the kind of thing that can definitely be done much better as part of Porymap, but is probably best left to personal forks where people can implement it in a way that works for them.

Also a bit of author preference here; I wanted an excuse to test the limits of Porymap's API and expand what it has to offer.




[porymap]: https://github.com/huderlem/porymap
[pokeemerald]: https://github.com/pret/pokeemerald
[pokefirered]: https://github.com/pret/pokefirered
[pokeruby]: https://github.com/pret/pokeruby
[install]: h
[guide]: h
