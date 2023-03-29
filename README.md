# jarchi-lib

Collection of jArchi scripts either collected on the net (and sometimes extended), or developped by myself, to help with [Archimate](https://www.archimatetool.com/) usage.

The license of this work is APACHE Licence 2.0, as described in [LICENSE-2.0](./LICENSE-2.0.txt) for my own work.

Collected scripts are respective copyright and licence by the original author.

# How to use
## Prerequisites
Tested with Archi 4.9, 4.10 and 5.0 and latest jArchi plugin (v1.3.1)
jArchi shall use the GraalVM javascript interpreter (4.x versions).

## Installation
Just copy the necessary `.ajs` and associated `.js` scripts/libraries to your own jarchi `__SCRIPT_DIR__` or clone this project and point to it.

**Nota Bene:** Many scripts are using the common utilities library [scripts/lib/misc.js](doc/misc.js.md)

# Noteworthy scripts 

Custom organic grown developped or adapted by yours truly, without any ChatGpt inside :-) 

The `.ajs` except when noted, resides in the `scripts` directory

## typing/globals.d.ts 

For development, allow code completion in VSCode for Archimate jArchi api. To be used in conjunction with [`jsconfig.json`](https://code.visualstudio.com/docs/languages/jsconfig).

## 1. [Colormap.ajs](doc/Colormap.md)

A property heatmap Wizard, with either a discrete categorical color scale or a continuous (gradient) numeric color scale. 

See [User's Guide](doc/Colormap.md) for details and installation.

## 2. Generate legend.ajs

Modified extended version of the script of David Girard, create the view legend for each type of element used in the view.
The specialization is taken into account **only** if there is a custom icon associated.

The legend item description comes from the description of a associated template element of same type (which name is `.legend.<type>[|<specialization>]`) and so are reused between legends in the same model.