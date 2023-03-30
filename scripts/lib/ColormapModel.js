/**
 * Model state classes for Colormap.ajs script
 * 
 * @license Apache-2.0 cf LICENSE-2.0.txt
 * @author rchevallier
 * @copyright 2023 rchevallier
 * @see {@link ./doc/Colormap.md}
 * @see {@link ../Colormap.ajs}
 */

/**
 * RGB encoding as hexadecimal string #RRGGBB
 */
class HexColor extends String {

    /**
     * helper method to convert integer to hexadecimal
     * @param {number} i integer value
     * @param {number} pad numbers of 0 padding 
     * @returns {string} hexadecimal value
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
     * if color not defined (yet), has value undefined
     * 
     * @param {string} text Mandatory
     * @param {HexColor} [color] optional
     * @param {boolean} [excluded] if selected by default or not 
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
     * @param {string} pname property name
     * @param {string[]} [labels] initial set of labels
     * @param {HexColor} [color] default color, can be undefined
     * @param {boolean} [resetDefault]  default is True
     * @param {string} [scaleType] type of ColorMap, default CATEGORICAL
     */
    constructor (pname, labels, color, resetDefault = true, scaleType = ColorMap.CATEGORICAL) {
        super()
        assert (pname != undefined);
        this._pname = pname;
        this._scaleType = scaleType;
        this._resetDefault = resetDefault;
        this._model = undefined;
        if (labels != undefined)
            for (const l of labels) {
                this.set(l, new ColorLabel(l, color))
        }
    }

    get name() {
        return this._pname;
    }

    static get CATEGORICAL() {
        return "Categorical";
    }

    static get CONTINUOUS() {
        return "Continuous";
    }

    /**
     * @returns {string}
     */
    get scaleType() {
        return this._scaleType;
    }

    /**
     * @param {string} t
     */
    set scaleType(t) {
        this._scaleType = t;
    }

    /**
     * @returns {boolean}
     */
    get resetDefault() {
        return this._resetDefault;
    }

    /**
     * @param {boolean} v
     */
    set resetDefault(v) {
        this._resetDefault = v;
    }

    get model() {
        return this._model;
    }

    /** @param {ColorModel} v */
    set model(v) {
        this._model = v
    }

    /**
     * Helper
     * @param {string[]} labels 
     */
    _fireEvent(labels) {
        if (this.model != undefined)
            this.model.notifyModelChange(labels)
    }

    allExcluded() {
        return Array.from(this.values()).every(v => v.excluded);
    }

    allIncluded() {
        return Array.from(this.values()).every(v => v.included);
    }

    someIncluded() {
        return Array.from(this.values()).some(v => v.included);
    }
    
    allIncludedNumeric() {
        return this.selection.every(v => v.isNumeric);
    }

    /**
     * Check if the colorMap is applicable:
     *  - Some label are included
     *  - all of these labels have a color defined
     * @returns {boolean} true if the Colormap can be applied
     */
    isApplicable() {
        const selected = this.selection;
        return selected.length > 0 && selected.every(cl => cl.color != undefined);
    }

    /**
     * return a new ColorMap filtered with only the labels passed as argument
     * @param {string[]} labels 
     * @returns {ColorMap}
     */
    subset(labels) {
        try {
            const result = new ColorMap(this.name); 
            labels.forEach(key => result.set(key, this.get(key)));
            log.trace(`ColorMap.subset: ${JSON.stringify([...result.entries()])}`);
            return result
        } catch (err) {
            log.error(err);
        }
    }

    /**
     * @param {boolean} [selectedOnly] allow to filter with selected labels
     * @returns {string[]} labels text
     */
    labels(selectedOnly = false) {
        if (!selectedOnly)
            return [...this.keys()]
        return this.selection.map(v => v.text)
    }

    /**
     * @returns {ColorLabel[]} the ColorLabel selected
     */
    get selection() {
        return [...this.values()].filter( (v) => v.included )
    }

    /**
     * @param {string[]} labels current property labels
     * @param {boolean} doit if false, elements with this property label is not expected to be colorized
     */
    setSelection(labels, doit)
    {
        for (const l of labels) 
            this.get(l).included = doit;
        this._fireEvent(labels);
    }
        

    /**
     * Load if found the default colors
     */
    loadColorScheme() {
        log.debug(`trying to load scheme for ${this.name}`);
        // FIXME handle case of ContinuousScale (scaleType)
        try {
            const content = read(__SCRIPTS_DIR__ + 'lib/Colormap.scheme/' + this.name.toLowerCase() + '.json');
            let scheme = JSON.parse(content);
            log.info(`Color scheme for ${this.name} loaded`);
            log.debug(content);
            if (scheme.resetDefault)
                this.resetDefault = scheme.resetDefault;
            if (scheme.colormap !== undefined) {
                // new structure for color scheme
                scheme = scheme.colormap;
            }
            this.forEach((_, label) => {
                if (scheme[label]) 
                    {this.get(label).color = new HexColor(scheme[label]) }
                });
            this._fireEvent(this.labels());
        } catch (err) {
            log.warn("Cannot load scheme for " + this.name + "\n" + err.toString());
        }
    }
    
    /**
     * Save the current color map
     * @param {string} scaleType the scaleType, default is current
     */
    saveColorScheme(scaleType = this.scaleType) {
        const scheme = {
            colormap: this._getColorScheme(),
            type: this.scaleType,
            resetDefault: this.resetDefault
        }
        const json = JSON.stringify(scheme, undefined, 2);
        log.info(`Saving scheme ${this.name}: ${json}`);
        jArchi.fs.writeFile(__SCRIPTS_DIR__ + 'lib/Colormap.scheme/' + this.name.toLowerCase() + ".json", json);
    }

    /**
     * @private
     * @returns {{[x:string]: HexColor}} the color scheme of the color map as as simple object (for JSON serialization)
     */
    _getColorScheme() {
        return Object.fromEntries(
                    Array.from(this)
                        .map(([label, colorLabel]) => [label, colorLabel.color]));
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
     * // FIXME changer to ColorMap or morph from a ColorMap ?
     * @param {ColorModel} model 
     */
    constructor(model) {
        this.model = model;
        // sort numerically
        this._selection = model.colormap.selection.sort((a, b) => a.textAsNumber - b.textAsNumber);
        this._start = this._selection[0];
        this._end = this._selection[this._selection.length - 1];
    }

    get selection() {
        return this._selection;
    }

    get start() {
        return this._start;
    }

    get end() {
        return this._end;
    }

    /**
     * Check if the scale is properly defined = start and end colors exists
     * @returns {boolean} 
     */
    isDefined() {
        return this.start.color != undefined && this.end.color != undefined
    }


    /**
     * Event listener, change one of the extremity color
     * @param {HexColor} color 
     * @param {boolean} end 
     */
    setColor(color, end) {
        if (end) {
            this.end.color = color;
            log.trace(`end: new color ${JSON.stringify(this.end)}`);
        } else {
            this.start.color = color;
            log.trace(`start: new color ${JSON.stringify(this.start)}`);
        }
        this.applyColors();
    }

    /**
     * Recalculate colors for the current Colormap selection, in the sorted numeric order
     */
    applyColors() {
        // calculate colors for all labels   
        if  (this.isDefined()) {
            const [sr, sg, sb] = this.start.color.toRGB();
            const [er, eg, eb] = this.end.color.toRGB();
            const delta = this.end.textAsNumber - this.start.textAsNumber;
            log.trace(`End = ${this.end.textAsNumber}, Start = ${this.start.textAsNumber}, Delta = ${delta}`);
            for (const l of this.selection) {
                const ratio = (l.textAsNumber - this.start.textAsNumber) / delta;
                const r = Math.round(er * ratio + sr * (1 - ratio));
                const g = Math.round(eg * ratio + sg * (1 - ratio));
                const b = Math.round(eb * ratio + sb * (1 - ratio));    
                const hexColor = HexColor.fromRGB(r, g, b);
                log.trace(`Ratio for ${l.text}: ${l.textAsNumber} = ${ratio.toPrecision(4)} => ${hexColor}`);
                l.color = hexColor;
            }
        } else {
            log.info("Undefined color at extremities. Gradient not calculated")
        }
        this.model.notifyModelChange(this.model.colormap.labels(true));
    }

}


/**
 * @typedef {(c: ColorMap) => void}  ObserverCallback triggered when any change on the current colorMap
 */


/**
 * Store the properties and associated labels colors to be managed visually thru the Wizard
 * Responsibility is to be the bridge between the JArchi script actions and the SWT Wizard
 * @type {Map<string, ColorMap>}
 */
class ColorModel extends Map {
    /**
     * @param {{[x:string]: string[]}} collected 
     */
    constructor (collected) {
        super(Object.entries(collected).map(([name,labels]) => [name, new ColorMap(name, labels)]));
        this.forEach(colormap => colormap.model = this);
        // Set default property as 1st in list
        assert(this.size >0, "No property found");
        // default is 1st of list
        this._colormap = this.entries().next().value[1];
        log.debug(`properties collected: ${[...this.keys()]}`);
        this.forEach((colormap, _) => log.info(`property '${colormap.name}' labels: ${[...colormap.values()].map((cl) => cl.text)}`));
        /** @type {Set<ObserverCallback>} */
        this._observers = new Set();
        /** @type {ContinuousScale} */
        this.scale = undefined;
        // load default color schemes if exist
        this.forEach((colormap, _) => colormap.loadColorScheme());
        log.info("selected: " + this.property, " => ", [...this.colormap.entries()]);
        log.trace(`HasProperty: ${this.hasProperty}`)
    }

    
    // Event Observer pattern, called by Wizard pages for updating widgets state
    /**
     * @param {ObserverCallback} f 
     * @param {boolean} removeOther Force cleaning of observers. 
     * NB: Added as the Wizard usually call the visible(false) to previous tab *AFTER* the visible(true) for current tab
     */
    registerModelChangeObserver(f, removeOther = true) {
        if (removeOther) this._observers.clear();
        log.debug(`Adding observer ${f.name}`);
        this._observers.add(f);
    }

    /**
     * @param {ObserverCallback} f
     */
    removeModelChangeObserver(f) {
        log.debug(`Removing observer ${f.name}`);
        this._observers.delete(f);
    }
    
    /**
     * shall be triggered on LabelColor changes 
     * @package
     * @param {string[]} labels 
     */
    notifyModelChange(labels) {
        log.trace(`Firing event...`);
        const changed = this.colormap.subset(labels);
        log.debug(`Firing event for ${[...changed.keys()]}`);
        this._observers.forEach(
            (f) => {
                log.trace(`... callback for ${f.name}`);
                f(changed);
            }
        )
    }

    /**
     * 
     * @returns {string[]} all properties known
     */
    get properties() {
        return [...this.keys()];
    }
    
    /**
     * Check if there is a current property (= ColorMap) 
     */
    get hasProperty() {
        return this._colormap != undefined;
    }
    
    /**
     * Return the current property name
     * @returns {string}
     */
    get property() {
        return this._colormap.name;
    } 

    /**
     * Change the current property
     * @param {string} name
     */
    set property(name) {
        assert (this.has(name))
        this._colormap = this.get(name);
    }
    
    /**
     * The current ColorMap
     * @returns {ColorMap}
     */
    get colormap() {
        return this._colormap;
    }


    /**
     * FIXME! Move to ColorMap ? idem ColorMap.setColor?
     * @param {string[]} labels 
     * @param {HexColor} color 
     */
    setColorForLabels(labels, color) {
        for (const label of labels) {
            this.colormap.get(label).color = color;
        }
        this.notifyModelChange(labels);
    }

}

/**
 * @type {ColorModel}
 * 
 * Global variable :-( singleton to manage the state thru the Wizard
 */
var cModel;

