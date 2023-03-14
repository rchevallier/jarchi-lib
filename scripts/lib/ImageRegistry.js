"use strict";

const RGB = Java.type('org.eclipse.swt.graphics.RGB');
const Color = Java.type('org.eclipse.swt.graphics.Color');
const SwtImage = Java.type('org.eclipse.swt.graphics.Image');
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
     * @param {HexColor[]} rgbs optional initial image(s) created to fill the cache, in format #RRGGBB
     */
    constructor(width = 24, height = 24, ...rgbs) {
        /** @type {Map<string,JavaObject>} */
        this.cache = new Map();
        this.defaultWidth = width;
        this.defaultHeight = height;
        for (const rgb of rgbs) {
            this.getImage(rgb);
        }
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
     * @param {JavaObject} device  the SWT device
     * @returns {JavaObject} the SWT Image
     */
    _createPaletteImage(hex, width, height, device = ImageRegistry.device) {
        const image = new SwtImage(device, width, height);
        const trio = hex.toRGB();
        const lineColor = device.getSystemColor(SWT.COLOR_WIDGET_BORDER);
        const fillColor = new Color(device, ...trio);
        const gc = new GC(image);
        try {
            gc.setBackground(fillColor);
            gc.setForeground(lineColor);
            gc.fillRectangle(1, 1, width - 2, height - 2);
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
     * @param {number} width in pixel (use default)
     * @param {number} height in pixel (use default)
     * @returns {JavaObject} the SWT Image
     */
    getImage(hex, width = this.defaultWidth, height = this.defaultHeight) {
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

        log.trace(`gradient size is ${width}x${height}`);
        const image = new SwtImage(device, width, height);
        const gc = new GC(image);
        const col1 = new Color(ImageRegistry.hexToSwtRGB(color1));
        const col2 = new Color(ImageRegistry.hexToSwtRGB(color2));
        try {
            gc.setForeground(col1);
            gc.setBackground(col2);
            gc.fillGradientRectangle(0, 0, width, height, false);
        } finally {
            gc.dispose();
            col1.dispose();
            col2.dispose();
        }
        return image;
    }


    /**
     * Create a gradient image from 2 colors, store it in cache
     * 
     * @param {HexColor} color1 Gradient start color
     * @param {HexColor} color2 Gradient end color
     * @param {JavaObject} bounds SWT Bound object
     * @returns {JavaObject} an SWT gradient image
     */
    getGradientImage(color1, color2, bounds) {
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
