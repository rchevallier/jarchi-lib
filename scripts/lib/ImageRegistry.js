/**
 * SWT image utilities classes for ColormapWizard.js script
 * 
 * @license Apache-2.0 cf LICENSE-2.0.txt
 * @author rchevallier
 * @copyright 2023 rchevallier
 * @see {@link ./doc/Colormap.md}
 * @see {@link ../Colormap.ajs}
 * @see {@link ./ColormapWizard.ajs}
 */

const RGB = Java.type('org.eclipse.swt.graphics.RGB');
const Color = Java.type('org.eclipse.swt.graphics.Color');
const SWTImage = Java.type('org.eclipse.swt.graphics.Image');
const GC = Java.type('org.eclipse.swt.graphics.GC');

/**
 * Class to encapsulate SWT graphics and creation of color palette images
 */
class ImageRegistry {

    /**
     * Simple helper for SWT graphics parameter
     */
    static get device() {
        return shell.getDisplay();
    }

    /**
     * @param {number} width optional override default width for images (24 pixel)
     * @param {number} height optional override default height for images (24 pixel)
     */
    constructor(width = 24, height = 24, unknownColor, unknownText) {
        /** @type {Map<string,JavaObject>} */
        this.cache = new Map();
        this.defaultWidth = width;
        this.defaultHeight = height;
        this.unknownColor = unknownColor;
        // Create the unknown image per default
        this.unknownImage = this._createPaletteImage(unknownColor, width, height, unknownText);
    }

    /**
     * Convert RGB color as hexa string format #RRGGBB to SWT RGB object
     *
     * @param {HexColor} hex an RGB color in hexa form #RRGGBB
     * @returns {JavaObject} the SWT RGB object
     */
    static hexToSwtRGB(hex) {
        const [r, g, b] = hex.toRGB();
        return new RGB(r, g, b);
    }

    /**
     * convert to Hexa string format #RRGGBB a tuple of 3 components colors
     *
     * @param {RGB} rgb SWT RGB object
     * @returns {HexColor} RGB value in hexa string #rrggbb
     */
    static swtRGBToHex(rgb) {
        return HexColor.fromRGB(rgb.red, rgb.green, rgb.blue);
    }

    /**
     * Create a colorized rectangular shaped SWT image
     *
     * @private
     * @param {HexColor} hex in hexa form "#RRGGBB"
     * @param {number} width in pixel
     * @param {number} height in pixel
     * @param {string} [text] optional short text, centered inside image
     * @param {JavaObject} [device]  the SWT device
     * @returns {JavaObject} the SWT Image
     */
    _createPaletteImage(hex, width, height, text, device = ImageRegistry.device) {
        const image = new SWTImage(device, width, height);
        const trio = hex.toRGB();
        const lineColor = device.getSystemColor(SWT.COLOR_WIDGET_BORDER);
        const fillColor = new Color(device, ...trio);
        const gc = new GC(image);
        try {
            gc.setBackground(fillColor);
            gc.fillRectangle(1, 1, width - 2, height - 2);
            if (text !== undefined) {
                const textWidth = gc.stringExtent(text).x;
                gc.setForeground(device.getSystemColor(SWT.COLOR_DARK_RED));
                gc.drawText(text, Math.floor(Math.abs(width - textWidth) / 2), 0);
            }
            gc.setForeground(lineColor);
            gc.drawRectangle(0, 0, width - 1, height - 1);
        } finally {
            gc.dispose();
            fillColor.dispose();            
        }
        return image;
    }

    /**
     * Returns and create if doesn't exist an colorized rectangular shaped SWT image
     * Store it in cache
     *
     * @param {HexColor} hex in hexa form "#RRGGBB"
     * @param {string} text the text content if any
     * @returns {JavaObject} the SWT Image
     */
    getImage(hex) {
        if (hex == undefined) {
            log.trace(`Undefined color, returning unknowImage`)
            return this.unknownImage;
        }
        const width = this.defaultWidth;
        const height = this.defaultHeight;
        const key = `${hex}:${width}x${height}`;
        if (!this.cache.has(key)) {
            log.trace(`Image not found, creating ${key}`);
            this.cache.set(key, this._createPaletteImage(hex, width, height));
        } else {
            log.trace(`Image ${key} found in cache`);
        }
        return this.cache.get(key);
    }


    /**
     * 
     * @param {HexColor} color1 Gradient start color
     * @param {HexColor} color2 Gradient end color
     * @param {number} width image width
     * @param {number} height image height
     * @param {JavaObject} [device] SWT Device
     * @returns {SwtImage}
     */
    _createGradientImage(color1, color2, width, height, device = ImageRegistry.device) {

        log.trace(`gradient size is ${width}x${height} for colors ${color1} to ${color2}`);
        const image = new SWTImage(device, width, height);
        const gc = new GC(image);
        const c1 = new Color(ImageRegistry.hexToSwtRGB(color1));
        const c2 = new Color(ImageRegistry.hexToSwtRGB(color2));
        try {
            gc.setForeground(c1);
            gc.setBackground(c2);
            gc.fillGradientRectangle(0, 0, width, height, false);
        } finally {
            gc.dispose();
            c1.dispose();
            c2.dispose();
        }
        return image;
    }


    /**
     * Get a gradient image from 2 colors from cache, store it in cache if needs to be created
     * 
     * @param {HexColor} color1 Gradient start color, can be undefined
     * @param {HexColor} color2 Gradient end color, can be undefined
     * @param {JavaObject} bounds SWT Bound object
     * @returns {JavaObject} an SWT gradient image
     */
    getGradientImage(color1, color2, bounds) {
        // handle undefined colors
        if (!color1 || !color2) {
            // no gradient in this case, even if 1 extremity color is defined
            color1 = this.unknownColor;
            color2 = this.unknownColor;
        }
        log.trace(`creating gradient color ${color1} to ${color2} `)
        const width = bounds.width;
        const height = bounds.height;
        const key = `${color1}-${color2}:${width}x${height}`;
        if (!this.cache.has(key)) {
            log.trace(`Gradient image not found, creating for ${key}`);
            this.cache.set(key, this._createGradientImage(color1, color2, width, height));
        } else {
            log.trace(`Gradient image ${key} found in cache`);
        }
        return this.cache.get(key);
    }

    /**
     * Clear the cache
     */
    clear() {
        this.cache.forEach((i) => i.dispose());
        this.cache.clear();
    }

    /**
     * Must be called at end of program to dispose SWT graphics resources
     */
    dispose() {
        this.clear();
    }
}
