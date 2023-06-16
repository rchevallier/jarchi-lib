# Colormap/Reapply*

2 supplemental companion .ajs script to [Colormap wizard](Colormap%20wizard.md):
* `Colormap/Reapply to selected view.ajs`
* `Colormap/Reapply to model.ajs`

## Installation

These scripts require `Colormap/Wizard.ajs` and associated javascript libraries in `lib/colormap/*.js` and `lib/misc.js`

See section installation in [Colormap wizard](Colormap%20wizard.md).

## Use cases

When a color scheme has been applied to a view, the colormap **Wizard** saves the name of the selected property for colorization among the view's properties under then name `.colormap.property`.

### On a selected view 

It is so possible for the user to reapply the color scheme associated to this selected property without going thru the **Wizard**, by launching the script `Colormap/Reapply to selected view.ajs`. 

For instance, when some values for this property has been changed in model, and you want to recolorize the associated visual elements with the new/updated property values.

This script will automatically defer to the **Wizard** in the following cases:

1. There is no saved color scheme associated to the property (file `__SCRIPTS_DIR__/lib/colormap/scheme/<property>.json`)
2. None of the visual objects in the view have the property valued
3. For a Categorical color scheme, at least one visual object property value has no corresponding color
4. For a Continuous color scheme, among all the visual objects property values, the lowest or highest property value is out of range of the color scheme scale.


### On a model

The script `Colormap/Reapply to model.ajs` will reapply the color scheme associated to each view of the current model, which has a `.colormap.property` property defined.

The script will stop at the 1st view which cannot be recolorize automatically, and it will defer to the **Wizard**.

## Nota Bene

If you observe the applied color scheme seems different from the previously visible on the view, it's because the oen applied is different from the one saved. The color scheme reapplied by this script is based on the definition **saved**, not the latest applied.
