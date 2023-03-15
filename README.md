# jarchi-lib

Personal jArchi script library
Collection of jArchi scripts either collected on the net, or developped by myself, to help with [Archimate](https://www.archimatetool.com/) usage

### Prerequisites
Tested with Archi 4.9, 4.10 and 5.0 and latest jArchi plugin (v1.3.1)
jArchi shall use the GraalVM javascript interpreter 

### How to use
install
point the configuration

## Scripts

### Colormap
Inspired by []() but completely redesigned and developped as a SWT Wizard, a colorization function of visual elements based on property value. 
A discrete categorical color scale or a continuous numeric color scale are available.
User's Guide can be found [here](doc/Colormap.md)

```
Colormap.ajs - entry point
lib/
    misc.js - common utilities
    ColorModel.js 
    ColorWizard.js
    ImageRegistry.js
    Colormap.scheme/  - directory to store/retrieve default property color schemes
```
