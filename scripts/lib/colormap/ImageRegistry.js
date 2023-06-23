/**
 * SWT image utilities classes for ColormapWizard.js script
 * 
 * @license Apache-2.0 cf LICENSE-2.0.txt
 * @author rchevallier
 * @copyright 2023 rchevallier
 * @see {@link ./doc/Colormap%20wizard.md}
 * @see {@link ../ColormapUI.js}
 * @see {@link ./Colormap%wizard.ajs}
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
     * Create the ImageRegistry cache
     * NB: no cache cleaning feature, as live span expected to be short
     * 
     * @param {number} width optional override default width for images (24 pixel)
     * @param {number} height optional override default height for images (24 pixel)
     * @param {HexColor} unknownColor optional, default light grey
     * @param {string} unknownText optional, default question mark
     */
    constructor(width = 24, height = 24, unknownColor = new HexColor("#F0F0F0"), unknownText = '?') {
        /** @type {Map<string,JavaObject>} */
        this.cache = new Map();
        this.defaultWidth = width;
        this.defaultHeight = height;
        this.unknownColor = unknownColor;
        // Create the unknown image per default
        this.unknownImage = this._createPaletteImage(unknownColor, width, height, unknownText);
    }

    /**
     * Convert RGB color as hexadecimal string format #RRGGBB to SWT RGB object
     *
     * @param {HexColor} hex an RGB color in hexadecimal form #RRGGBB
     * @returns {JavaObject} the SWT RGB object
     */
    static hexToSwtRGB(hex) {
        const [r, g, b] = hex.toRGB();
        return new RGB(r, g, b);
    }

    /**
     * convert to hexadecimal string format #RRGGBB a tuple of 3 components colors
     *
     * @param {RGB} rgb SWT RGB object
     * @returns {HexColor} RGB value in hexadecimal string #rrggbb
     */
    static swtRGBToHex(rgb) {
        return HexColor.fromRGB(rgb.red, rgb.green, rgb.blue);
    }

    /**
     * Create a colorized rectangular shaped SWT image
     *
     * @private
     * @param {HexColor} hex in hexadecimal form "#RRGGBB"
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
     * Returns (and create if doesn't exist in cache) an colorized rectangular shaped SWT image
     * Store it in cache
     *
     * @param {HexColor} hex in hexadecimal form "#RRGGBB"
     * @returns {JavaObject} the SWT Image
     */
    getImage(hex) {
        if (hex == undefined) {
            log.trace(`Undefined color, returning unknownImage`)
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
     * @typedef {{color: HexColor, x: number}} Edge
     * 
     * @param {Edge[]} edges Gradient edges with relative position
     * @param {number} width image width
     * @param {number} height image height
     * @param {JavaObject} [device] SWT Device
     * @returns {SWTImage}
     */
    _createGradientImage(edges, width, height, device = ImageRegistry.device) {
        log.debug(`Creating Gradient image for ${JSON.stringify(edges)}`)
        assert(edges.length == 2 || edges.length == 3, "Expect 2 or 3 edges");
        assert(edges[0].x == 0, "start edge position != 0");
        assert(edges[edges.length-1].x == 1, "end edge position != 1");
        assert(edges.length == 2 || (edges[1].x > 0 && edges[1].x < 1), "middle edge relative position not between 0 and 1");
        log.trace(`gradient size is ${width}x${height} for colors ${edges.map( (s) => s.color.toString()).join('-')}`);
        const image = new SWTImage(device, width, height);
        const gc = new GC(image);
        const makerColor = device.getSystemColor(SWT.COLOR_WHITE); 
        try {
            for (let i = 0; i < edges.length-1; i++) {
                const c1 = new Color(ImageRegistry.hexToSwtRGB(edges[i].color));
                const c2 = new Color(ImageRegistry.hexToSwtRGB(edges[i+1].color));
                gc.setForeground(c1);
                gc.setBackground(c2);
                const segmentWidth = Math.trunc((edges[i+1].x - edges[i].x) * width);
                log.trace(`colorizing gradient segment #${i} of width ${segmentWidth} starting at ${Math.trunc(edges[i].x * width)}`)
                gc.fillGradientRectangle(Math.trunc(edges[i].x * width), 0, segmentWidth, height, false);
                if (i > 0) {
                    // not the last edge, we draw a marker
                    const posMarker = Math.trunc(edges[i].x * width);
                    log.trace(`Drawing middle edge at ${posMarker}`)
                    gc.setForeground(makerColor);
                    gc.setLineStyle(SWT.LINE_SOLID);
                    gc.drawLine(posMarker, 0, posMarker, height);
                    gc.setForeground(device.getSystemColor(SWT.COLOR_WIDGET_BORDER));
                    gc.setLineStyle(SWT.LINE_DOT);
                    gc.drawLine(posMarker, 0, posMarker, height);
                }
                c1.dispose();
                c2.dispose()
              }
        } finally {
            gc.dispose();
        }
        return image;
    }

 
    /**
     * Get a gradient image from 2 colors from cache, store it in cache if needs to be created
     * 
     * @param {Edge[]} edges Gradient start color, colors can be undefined
     * @param {JavaObject} bounds SWT Bound object
     * @returns {JavaObject} an SWT gradient image
     */
    getGradientImage(edges, bounds) {
        // handle undefined colors
        if (edges.map((s) => s.color).some((c) => c == undefined)) {
            // no gradient in this case, even if 1 color is defined
            edges.forEach((s) => s.color = this.unknownColor);
        }
        const colors = edges.map( (s) => `${s.color.toString()}:${s.x.toExponential(2)}`).join('-');
        log.trace(`creating gradient color ${colors}`);
        const width = bounds.width;
        const height = bounds.height;
        const key = `${colors}:${width}x${height}`
        if (!this.cache.has(key)) {
            log.trace(`Gradient image not found, creating for ${key}`);
            this.cache.set(key, this._createGradientImage(edges, width, height));
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
