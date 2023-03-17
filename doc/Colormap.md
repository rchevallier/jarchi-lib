# Colormap User's Guide

Inspired from **Steven Mileham** [script](https://gist.github.com/smileham/4bbca832d8fe629b72beb4e2b9a4b7ea)[^1]
, a completely redesigned Heatmap/Colormap function as a SWT Wizard to set a visual element background color based on it's property value.

## Installation
Following files and directory structure MUST be copied to the jArchi scripting root directory.

```
Colormap.ajs - Script entry point, to be launched
lib/
    misc.js - scripts common utilities
    ColorModel.js 
    ColorWizard.js
    ImageRegistry.js
    Colormap.scheme/ - directory to store/retrieve default property color schemes
```

## Execution
The Wizard is organized in 3 steps. As with any wizard, it is possible to go back and forth between pages with `< Back` and `Next >` buttons. `Cancel` will stop the Wizard. `Finish` will execute the colorization, if all necessary choices are made.

### 1) Property selection step
All properties found in any element displayed in the selected view are listed for selection.

![Property selection](./img/Property%20list.png)

Selecting `Next >` will lead to ...

### 2) Labels selection step
the page shows all possible labels associated with the selected property, and used in the selected view. It is possible to select only subset of the values using the checkbox.
The `(all labels)` checkbox is a short cut to mark or unmark all labels in the list.

![Labels selection](./img/Property%20labels%20selection.png)

As long as at least one label is selected, it is possible to progress to next page.

if all labels selected are or starts with a number, it is possible to use a continuous color scheme instead of the standard categorical (= discrete) color scheme.

![Numeric Labels](./img/Property%20labels%20selection%202.png)

### 3.a) Categorical scheme 

in this page, you can set a specific color per property label, by either double clicking the color, or using the `Set color` button.

![Categorical](./img/Category%20scheme%20colors.png)

Multiple selection is possible in the list.

the `Reset non-matching ... default colors` checkbox will instruct to reset to default color all visual elements in the view which don't have the property or a property label color defined.

the `Default scheme` section is explained below

### 3.b) Continuous scheme 

In this scheme, you define the colors for the lowest and hight numerical values of the property labels. A gradient color scheme is applied to each label numerical value.

![Continuous](./img/Continuous%20scheme%20colors.png)

#### Saving or reloading default color scheme

In step 3), for both color schemes, you can save the current color settings as the default using the `Save` button. `Reload` will reapply the saved color scheme to the current label selection

![default scheme](./img/Default%20Color.png)

## Finish and Legend creation

If extecution is asked (button `Finish` pressed), defined colors wil be applied to all elements in the view. 

A legend will be created (positionned by default in the top left corner of the view). If a previous legend was created, it will be replaced.

#### Exemple For categorical scale
![](./img/Category%20Scheme%20Result.png)

#### Exemple For continuous scale
![Continuous result](./img/Continuous%20color%20output.png)

If the result doesn't fit, you can can cancel the modification by just selecting `Edit | Undo (CTRL-Z)` menu item (Reselect the view first).

[^1] cf https://smileham.co.uk/2022/06/15/archi-jarchi-and-rag-status-maps/

