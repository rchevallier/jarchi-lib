
/**
 * RGB encoding as hexadecimal string #RRGGBB
 */
class HexColor extends String {

    /**
     * helper method to convert integer to Hexa
     * @param {number} i integer value
     * @param {number} pad numbers of 0 padding 
     * @returns {string} hexa value
     */
    static intToHex(i, pad = 2) {
        return i.toString(16).toUpperCase().padStart(pad, '0')
    }
    
    /**
     * Convert to integer value
     * 
     * @returns {number}
    */
   toInt() {
       return parseInt(this.slice(1), 16)
    }
    
    /**     
    * Convert to tuple of integer components
    *
    * @returns {number[]} array of [r, g, b] as smallint (0..255)
    */
    toRGB() {
        return [
            parseInt(this.substring(1, 3), 16),
            parseInt(this.substring(3, 5), 16),
            parseInt(this.substring(5), 16)
        ];
    }

    /**
     * create from RGB color encoded as integer value
     * 
     * @param {number} i 32bits integer value 
    */
    static fromInt(i) {
       return new HexColor( `#${this.intToHex(i, 6)}` );
    }

    /**
     * create from RGB color 3 components (0..255)
     * @param {number} r Red component
     * @param {number} g Green component
     * @param {number} b Blue component
     */
    static fromRGB(r, g, b) {
        return new HexColor(`#${this.intToHex(r)}${this.intToHex(g)}${this.intToHex(b)}`)
    }
}


class ColorLabel {
    /**
     * Association of a label with a color, and a selection flag
     * 
     * @param {string} text 
     * @param {HexColor} color
     * @param {boolean} [excluded]
     */
    constructor(text, color, excluded = false) {
        this._text = text;
        this._color = color;
        this._excluded = excluded;
    }

    get text() {
        return this._text;
    }

    get color() {
        return  this._color;
    }

    set color(c) {
        // FIXME allow other type than HexColor? String? RGB? int ?
        this._color = c;
    }

    get textAsNumber() {
        const result = parseFloat(this._text);
        return isNaN(result) ? null : result
    }

    get isNumeric() {
        return !isNaN(parseFloat(this._text));
    }

    get excluded() {
        return this._excluded
    }

    get included() {
        return !this.excluded
    }

    set included(v) {
        this._excluded = !v
    }

    set excluded(v) {
        this._excluded = v
    }

}


class ColorMap extends Map {
    /**
     * @param {Set<string>} [labels] 
     * @param {HexColor} [defaultColor] FIXME move to ColormapWizard.js?
     */
    constructor (labels, defaultColor) {
        super()
        if (labels != undefined)
            // sorting properties values alphabetically
            for (const l of [...labels].sort()) {
                this.set(l, new ColorLabel(l, defaultColor))
        }
    }

    get allExcluded() {
        return Array.from(this.values()).every(v => v.excluded)
    }

    get allIncluded() {
        return Array.from(this.values()).every(v => v.included)
    }

    get someIncluded() {
        return !this.allExcluded
    }
    
    get allIncludedNumeric() {
        return Array.from(this.values()).filter(v => v.included).every(v => v.isNumeric)
    }

    // get labelsAsNumbers() {
    //     return Array.from(this.values()).map(c => c.textAsNumber)
    // }

    /**
     * return the ColorMap with only the labels 
     * @param {string[]} labels 
     * @returns {ColorMap}
     */
    subset(labels) {
        try {
            const result = new ColorMap(); 
            labels.forEach(key => result.set(key, this.get(key)))
            log.debug(`ColorMap.subset: ${JSON.stringify([...result.entries()])}`)
            return result
        } catch (err) {
            log.error(err);
        }
    }

    /**
     * @param {boolean} [selectedOnly] allow to filter on selection
     * @returns {string[]} all labels text
     */
    labels(selectedOnly = false) {
        if (!selectedOnly)
            return [...this.keys()]
        return [...this.values()].filter(v => v.included).map(v => v.text)
    }

    /**
     * @returns {ColorLabel[]} the ColorLabel selected
     */
    get selection() {
        return [...this.values()].filter( (v) => v.included )
    }
}

/**
 * For now the only scale available
 * Possible other scales to be implemented:
 *   - DivergingScale: 3 colors, middle white (at 0 per default?)
 *   - StepScale: continuous, but with discrete step ranges
 * 
 */
class ContinuousScale {

    /**
     * function to calculate a colormap from a linear color scale
     * based on the model selected labels at creation time.
     * @param {ColorModel} model 
     */
    constructor(model) {
        this.model = model;
        // sort numerically
        this._selection = model.colormap.selection.sort((a, b) => a.textAsNumber - b.textAsNumber);
        this._start = this._selection[0];
        this._end = this._selection[this._selection.length - 1]
    }

    get selection() {
        return this._selection
    }

    get start() {
        return this._start
    }

    get end() {
        return this._end
    }

    /**
     * Change one of the extremity color
     * @param {HexColor} color 
     * @param {boolean} end 
     */
    setColor(color, end) {
        if (end) {
            this.end.color = color;
            log.trace(`end: new color ${JSON.stringify(this.end)}`)
        } else {
            this.start.color = color;
            log.trace(`start: new color ${JSON.stringify(this.start)}`)
        }
        this.applyColors();
    }

    /**
     * Recalculate colors for the current Colormap selection, in the sorted numeric order
     */
    applyColors() {
        // calculate colors for all labels      
        const [sr, sg, sb] = this.start.color.toRGB();
        const [er, eg, eb] = this.end.color.toRGB();
        const delta = this.end.textAsNumber - this.start.textAsNumber
        log.trace(`End = ${this.end.textAsNumber}, Start = ${this.start.textAsNumber}, Delta = ${delta}`)
        for (const l of this.selection) {
            const ratio = (l.textAsNumber - this.start.textAsNumber) / delta;
            const r = Math.round(er * ratio + sr * (1 - ratio));
            const g = Math.round(eg * ratio + sg * (1 - ratio));
            const b = Math.round(eb * ratio + sb * (1 - ratio));    
            const hexColor = HexColor.fromRGB(r, g, b);
            log.trace(`Ratio for ${l.text}: ${l.textAsNumber} = ${ratio.toPrecision(4)} => ${hexColor}`)
            l.color = hexColor
        }
        this.model.fireEvent(this.model.colormap.labels(true))
    }

}


/**
 * @typedef {Map <string, ColorMap>} PropertiesColorMaps
 * @typedef {(c: ColorMap) => void}  ObserverCallback triggered when any change on the current colorMap
 */


/**
 * Store the properties and associated labels colors to be managed visualy thru the Wizard
 * Responsibility is to be the bridge between the Jscript Archi actions and the SWT Wizard
 */
class ColorModel {
    /**
     * 
     * @param {Map<string,Set<string>>} propertiesCollected 
     * @param {HexColor} [defaultColor] Default color #RRGGBB if not found in a scheme, optional
     * @param {boolean} [resetDefault] flag, reset all other elements to their default color
     */
    constructor (propertiesCollected, defaultColor= new HexColor("#F0F0F0"), resetDefault=true) {
        log.debug(`properties collected: ${[...propertiesCollected.keys()]}`);
        this.undefinedColor = defaultColor;
        this.resetDefault = resetDefault;
        this.scaleType = ColorModel.CATEGORICAL;
        /** @type {ContinuousScale} */
        this.scale = undefined;
        /** @type {Set<ObserverCallback>} */
        this._observers = new Set();
        /** @type {PropertiesColorMaps} */
        this._properties = new Map([...propertiesCollected].sort().map(([name,labels]) => [name, new ColorMap(labels, defaultColor)]));
        this._properties.forEach((colormap, prop) => log.info(`property '${prop}' labels: ${[...colormap.values()].map((cl) => cl.text)}`));
        // load color schemes 
        this._properties.forEach((_, prop) => this.loadColorScheme(prop));
        // Set default property as 1st in list (FIXME alphabetically ordered ?)
        if (this._properties.size > 0) {
            this.property = this.properties[0];
        } else {
            this.property = null;
        }
        log.trace(`current property is ${this.property}`)
        log.info(this.property, " => ", this.colormap.labels());
    }

    static get CATEGORICAL() {
        return "Categorical"
    }

    static get CONTINUOUS() {
        return "Continuous"
    }

    set scaleType (t) {
        this._scaleType = t;
    }

    get scaleType () {
        return this._scaleType;
    }

    // Event Observer pattern, called by Wizard pages for updating widgets state
    /**
     * @param {ObserverCallback} f 
     * @param {boolean} removeOther Force cleraning of observers. 
     * NB: Added as the Wizard usually call the visible(false) to previous tab *AFTER* the visible(true) for current tab
     */
    addObserver(f, removeOther = true) {
        if (removeOther) this._observers.clear()
        log.debug(`Adding observer ${f.name}`)
        this._observers.add(f)
    }

    /**
     * @param {ObserverCallback} f
     */
    removeObserver(f) {
        log.debug(`Removing observer ${f.name}`)
        this._observers.delete(f)
    }
    
    /**
     * shall be triggered on LabelColor changes 
     * @package
     * @param {string[]} labels 
     * @param {ColorMap} colormap default is current one
     */
    fireEvent(labels, colormap = this.colormap) {
        const changed = colormap.subset(labels)
        log.debug(`Firing event for ${[...changed.keys()]}`)
        // if (this._observers.size > 0)
        this._observers.forEach(
            (f) => {
                log.trace(`... callback for ${f.name}`)
                f(changed);
            }
        )
    }

    /**
     * 
     * @returns {string[]} all properties known
     */
    get properties() {
        return [...this._properties.keys()];
    }
    
    get hasProperty() {
        return this.property != null
    }
    
    /** @returns {string} */
    get property()       { return this._currentProperty;} 

    /** @param {string} value */
    set property(value)  { this._currentProperty = value;}
    
    
    /**
     * @param {string[]} labels current property labels
     * @param {boolean} doit if false, elements with this property label is not expected to be colorized
     */
    setSelection(labels, doit)
    {
        for (const l of labels) 
            this.colormap.get(l).included = doit;
        this.fireEvent(labels);
    }


    /**
     * Load if found the color map for the  property
     * @param {string} [property] property name, default is current
     */
    loadColorScheme(property = this.property) {
        log.debug(`trying to load scheme for ${property}`);
        try {
            const content = read(__SCRIPTS_DIR__ + 'lib/Colormap.scheme/' + property.toLowerCase() + '.json')
            const scheme = JSON.parse(content);
            log.info(`Color scheme for ${property} loaded`);
            log.debug(content)
            const colormap = this._properties.get(property);
            colormap.forEach((_, label) => {
                if (scheme[label]) 
                    {colormap.get(label).color = new HexColor(scheme[label]) }
                });
            this.fireEvent(colormap.labels(), colormap)
        } catch (err) {
            log.warn("Cannot load scheme for " + property + "\n" + err.toString());
        }
    }

    /**
     * Save the current color map
     * @param {string} property the property name, default is current
     */
    saveColorScheme(property = this.property) {
        const json = JSON.stringify(this.getColorScheme(property), undefined, 2);
        log.info(`Saving scheme ${property}: ${json}`);
        jArchi.fs.writeFile(__SCRIPTS_DIR__ + 'lib/Colormap.scheme/' + property.toLowerCase() + ".json", json);
    }

    /**
     * @private
     * @param {string} property the property name
     * @returns {{colormap: {}}} the color scheme of the current property as as simple object (for JSON serialization)
     */
    getColorScheme(property) {
        return Object.fromEntries(
            Array.from(this._properties.get(property))
                .map(([k, v]) => [k, v.color]))
    }

    /**
     * 
     * @param {string[]} labels 
     * @param {HexColor} color 
     */
    setColorForLabels(labels, color) {
        for (const label of labels) {
            this.colormap.get(label).color = color;
        }
        this.fireEvent(labels)
    }

    /**
     * @param {boolean} b
     */
    set resetDefault(b) {
        this._resetDefault = b;
    }

    /**
     * @returns {boolean}
     */
    get resetDefault() {
        return this._resetDefault
    }

    /**
     * @returns {ColorMap}
     */
    get colormap() {
        return this._properties.get(this.property)
    }
}

/**
 * @type {ColorModel}
 * 
 * Global variable :-( to manage the state thru the Wizard
 */
var wizModel

