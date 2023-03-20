# jarchi-lib

Collection of jArchi scripts either collected on the net (and sometimes extended), or developped by myself, to help with [Archimate](https://www.archimatetool.com/) usage.

# How to use
## Prerequisites
Tested with Archi 4.9, 4.10 and 5.0 and latest jArchi plugin (v1.3.1)
jArchi shall use the GraalVM javascript interpreter (4.x versions).

## Installation
Just copy the necessary `.ajs` and associated `.js` scripts/libraries to your own jarchi `__SCRIPT_DIR__` or clone this project and point to it.

**Nota Bene:** Many scripts are using the common utilities library [lib/misc.js](doc/misc.js.md)

# Noteworthy scripts 

Custom organic grown developped or adapted by yours truly, without any ChatGpt inside :-) 

## typing/globals.d.ts 

For development, allow code completion in VSCode for Archimate jArchi api. To be used in conjunction with `jsconfig.json`.

## [Colormap](doc/Colormap.md)

A property heatmap function, with either a discrete categorical color scale or a continuous (gradient) numeric color scale. See [User's Guide](doc/Colormap.md)
