# Colormap reapply

This is the companion .ajs script to [Colormap wizard](Colormap%20wizard.md).

## Installation

This script requires `Colormap wizard.ajs` and associated javascript libraries.

See section installation in [Colormap wizard](Colormap%20wizard.md).

## Use cases

When a color scheme has been applied to a view, the colormap **Wizard** saves the name of the selected property for colorization among the view's properties under then name `.colormap.property`.

It is so possible for the user to reapply the color scheme associated to this selected property without going thru the **Wizard**, by launching this script. For instance, when some selected property values has been changed for visual objects present in the view, and you want to colorize according to the visual element current property values.

## Limitations

This script will automatically defer to the **Wizard** in the following cases:

1. There is no saved color scheme associated to the property (file `__DIR__/lib/colorscheme/<property>.json`)
2. None of the visual objects in the view have the property valued
3. For a Categorical color scheme, at least one visual object property value has no corresponding color
4. For a Continuous color scheme, among all the visual objects property values, the lowest or highest property value is out of range of the color scheme scale.

**NB**: if the color scheme saved definition is not the one applied on the view, because it was modified manually after saving, the color scheme reapplied by this script is based on the one saved, not the latest applied.
