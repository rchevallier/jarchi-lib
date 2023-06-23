/**
 * Model state classes for Colormap*.ajs script
 * 
 * @license Apache-2.0 cf LICENSE-2.0.txt
 * @author rchevallier
 * @copyright 2023 rchevallier
 * @see {@link ./doc/Colormap%20wizard.md}
 * @see {@link ../Colormap%20wizard.ajs}
 * @see {@link ../ColormapUI.js}
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
     * @param {string} text Mandatory, cannot be undefined
     * @param {HexColor} [color] optional
     * @param {boolean} [excluded] if selected by default or not 
     */
    constructor(text, color, excluded = false) {
        assert(text != undefined, 'Color label text undefined at constructor');
        this._text = text;
        this._asNumber = parseFloat(text);
        this._color = color;
        this._excluded = excluded;
    }

    /**
     * 
     * @param {string} [text] overwrite the text label if set 
     * @returns a copy with same text, color and excluded flags
     */
    clone(text) {
        return new ColorLabel(text != undefined? text: this.text, this.color, this.excluded);
    }

    get text() {
        return this._text;
    }

    /**
     * @param {string} t
     */
    set text(t) {
        assert(t != undefined, `Setting ColorLabel text to undefined. Previously: ${this.text}`);
        this._text = t;
        this._asNumber = parseFloat(t);
    }

    get color() {
        return  this._color;
    }

    set color(c) {
        // FIXME allow other type than HexColor? String? RGB? int ?
        this._color = c;
    }

    get textAsNumber() {
        return isNaN(this._asNumber) ? null : this._asNumber
    }

    get isNumeric() {
        return !isNaN(this._asNumber);
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
     * a Map between a label string and a ColorLabel. The Map also has extra properties: a name, a flag
     * 
     * @param {string} pname property name
     * @param {string[]} [labels] initial set of labels
     * @param {HexColor?} [color] color for all labels, can be undefined
     * @param {boolean} [resetDefault]  default is True
     * @param {typeof CategoricalScale} [scaleClass] type of ColorMap, default Categorical
     */
    constructor (pname, labels, color, resetDefault = true, scaleClass = CategoricalScale) {
        super();
        assert (pname != undefined, "Property name cannot be undefined");
        this._model = undefined;
        this._pname = pname;
        this._resetDefault = resetDefault;
        if (labels != undefined)
        for (const l of labels) {
            this.set(l, new ColorLabel(l, color));
        }
        this._scale = new scaleClass(this); 
    }

    get name() {
        return this._pname;
    }


    /**
     * @param {typeof CategoricalScale | typeof ContinuousScale} clazz
     */
    set scaleClass(clazz) {
        assert (this._scale != undefined)
        if (clazz != this.scaleClass) {
            log.debug(`Setting ScaleClass ${clazz.name} for ${this.name}... (from ${this.scaleClass.name})`)
            try {
                this._scale = new clazz(this);
            } catch (err) {
                log.error(err.toString())
            }
            log.debug(`ScaleClass set to ${clazz.name} for ${this.name} => ${this.scaleClass.name}`)
        } else {
            log.trace(`No ScaleClass change for ${this.name}=${this.scaleClass.name} (${clazz.name})`)
        }
    }

    /**
     * @returns {typeof CategoricalScale | typeof ContinuousScale}
     */
    get scaleClass(){
        // @ts-ignore
        return this._scale.constructor
    }

    get scale() {
        return this._scale;
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

    /**
     * Returns the associated ColorModel, maybe undefined
     */
    get model() {
        return this._model;
    }

    /** 
     * Associate the ColorMap to the ColorModel
     * @param {ColorModel} v 
     */
    set model(v) {
        this._model = v
    }

    /**
     * Helper function - fire change event on model
     * @param {string[]} labels 
     */
    _fireEvent(labels) {
        if (this.model != undefined)
            this.model.notifyModelChange(labels)
        else 
            log.debug("No associated model, not firing event");
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
     *  - At least one label are included
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
     * @param {boolean} [selectedOnly] allow to filter with only selected labels
     * @returns {string[]} labels text
     */
    labels(selectedOnly = false) {
        if (!selectedOnly)
            return [...this.keys()]
        return this.selection.map(v => v.text)
    }

    /**
     * @returns {ColorLabel[]} the ColorLabels selected
     */
    get selection() {
        return [...this.values()].filter( (v) => v.included )
    }

    /**
     * Define the inclusion for colorization for labels, and fire change event
     * @param {string[]} labels current property labels
     * @param {boolean} selected if false, elements with this property label is not expected to be colorized
     */
    setSelection(labels, selected)
    {
        log.debug(`changing selection for ${labels} to ${selected}`)
        for (const label of labels) 
            this.get(label).included = selected;
        this._fireEvent(labels);
    }
    
    /**
     * Set a color for one or many labels, and fire change event
     * @param {string[]} labels 
     * @param {HexColor} color 
     */
    setColor(labels, color){
        log.debug(`changing color for ${labels} to ${color}`)
        for (const label of labels) {
            this.get(label).color = color;
        }
        this._fireEvent(labels);
    }

    /**
     * @private
     * @returns {string} the path to the color scheme saved file
     */
    _schemePath() {
        return __SCRIPTS_DIR__ + 'lib/colormap/scheme/' + this.name.toLowerCase() + '.json'
    }

    /**
     * Load if found the saved color scheme
     */
    loadColorScheme() {
        log.debug(`trying to load scheme for ${this.name}`);
        try {
            const scheme = readAsJson(this._schemePath())
            log.info(`Color scheme for ${this.name} loaded`);
            if (scheme.resetDefault)
                this.resetDefault = scheme.resetDefault;
            this.forEach((_, label) => {
                if (scheme.colormap[label]) 
                    {this.get(label).color = new HexColor(scheme.colormap[label]) }
            });
            assert (scheme.type != undefined, "Scheme has no type")
            this.scaleClass = scheme.type == ContinuousScale.label ? ContinuousScale : CategoricalScale;
            if (this.scale instanceof ContinuousScale && scheme.Continuous.middle != undefined) {
                this.scale.middle.text = `${scheme.Continuous.middle.value} - middle color`;
                this.scale.middle.color = new HexColor(scheme.Continuous.middle.color);
                this.scale.enableMiddleColor(true);
                log.trace(`Middle color enabled and loaded: ${this.scale.middle.textAsNumber}: ${this.scale.middle.color.toString()}`)
            }
            this._fireEvent(this.labels());
        } catch (err) {
            log.warn("Cannot load scheme for " + this.name + "\n" + err.toString());
        }
    }
    
    /**
     * Save the current color map
     */
    saveColorScheme() {
        const json = JSON.stringify(this.getColorScheme(), undefined, 2);
        log.info(`Saving scheme ${this.name}: ${json}`);
        jArchi.fs.writeFile(this._schemePath(), json);
    }


    /**
     * @typedef {{name: string, type: string, resetDefault: boolean, colormap: {[x: string]: string}}} ColorScheme
     * @returns {ColorScheme} the color scheme as simple JSON objects
     */
    getColorScheme() {
        const colormap = this.selection.map(((cl) => [cl.text, cl.color.toString()]));
        const scheme = {
            name:  this.name,
            type: this.scale.name,
            resetDefault: this.resetDefault,
            colormap: Object.fromEntries(colormap) // NB: order of labels are undetermined
        }
        // handle continuous scale extremities 
        if (this.scale instanceof ContinuousScale) {
            scheme.Continuous = {
                start: {
                    value: this.scale.start.textAsNumber, 
                    color: this.scale.start.color.toString()
                }, 
                end: {
                    value: this.scale.end.textAsNumber,
                    color: this.scale.end.color.toString()
                }
            }
            if (this.scale.isMiddleColorEnabled()) {
                scheme.Continuous.middle = {
                    value: this.scale.middle.textAsNumber,
                    color: this.scale.middle.color.toString()
                }
            }
        }
        return scheme;
    }
}



/**
 * The default basic Scale, no color 
 * calculation, only assignment
 */
class CategoricalScale {

    static get label() {
        return "Categorical"
    }
    
    /**
     * @param {ColorMap} colormap 
     */
    constructor (colormap) {
        this._colormap = colormap
    }

    get name() {
        return CategoricalScale.label
    }

    get colormap() {
        return this._colormap;
    }

    _calcSelectionColors() {
        // default do nothing
    }

    isDefined() {
        return true
    }
}


/**
 * For now the only intelligent scale available, based on 1 or 2 contiguous color gradients
 * Possible other scales to be implemented oneday:
 *   - StepScale: continuous, but with discrete step ranges
 * 
 */
class ContinuousScale extends CategoricalScale {

    static get label() {
        return "Continuous";
    }

    get name() {
        return ContinuousScale.label
    }

    // match indexes of this._edges[]
    static EDGE = { START: 0, MIDDLE: 1, END: 2};

    /**
     * function to calculate a colormap from a linear color scale
     * based on the model selected labels at creation time.
     * @param {ColorMap} colormap 
     */
    constructor(colormap) {
        super(colormap);
        this._middle = new ColorLabel("undefined", undefined, true); // no color, excluded by default
        this.resetEdges();
    }

    /**
     * Precalculate sort and edges
     */
    resetEdges() {
        log.trace(`resetting continuous scale edges`);
        this._selection = this.colormap.selection.sort((a, b) => a.textAsNumber - b.textAsNumber);
        this._start = this._selection[0].clone();
        this._end = this._selection[this._selection.length - 1].clone();
        assert (this.start.isNumeric && this.end.isNumeric, "Extreme edge label is not numeric");
        if (this.middle.isNumeric) {
            // we keep it, otherwise we calculate an acceptable default value (dependent on start, end)
        } else if (this.start.textAsNumber < 0 && this.end.textAsNumber > 0) {
            // set to 0 if 0 between start and end
            this._middle = this.middle.clone("0 - middle color");
        } else {
            // set to middle point  otherwise
            const middleValue = (this.start.textAsNumber +  this.end.textAsNumber) / 2;
            this._middle = this.middle.clone(middleValue.toExponential(2) + " - middle color");
        }
        this._edges = [this._start, this._middle, this._end];
        this._applyColors();
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
     * @returns {ColorLabel?} the color label or 
     */
    get middle() {
        return this._middle;
    }

    /**
     * 
     * @param {boolean} b 
     */
    enableMiddleColor(b) {
        log.debug(`middle included <- ${b}`)
        this.middle.included = b;
        this._applyColors();
    }

    isMiddleColorEnabled(){
        return this.middle.included;
    }

    /**
     * Set the middle color value
     * 
     * @param {number} x the relative position in the gradient scale
     * @param {boolean} absolute if true value is absolute otherwise a ratio (between 0 and 1)
     */
    setMiddlePosition(x, absolute) {
        if (this.isMiddleColorEnabled()) {
            log.trace(`Setting ${absolute ? "absolute" : "relative"} position for ${x}`);
            const value = absolute ? x : this.ratioToValue(x);
            this.middle.text = `${value} - middle color`;
            log.debug(`Middle position <- ${this.middle.textAsNumber}`)
            this._applyColors();
        } else {
            log.trace("Middle color not enabled, not changing position")
        }
    }

    /**
     * 
     * @returns {ColorLabel[]} the enabled edges color labels: start, end and middle if enabled
     */
    get edges() {
        return this._edges.filter(e => e.included);
    }

    /**
     * 
     * @returns {Edge[]} the edges as relative % position from extremities. Does not include Middle if not enabled
     */
    relativeEdges() {
        return this.edges.map((cl) => {return {color: cl.color, x: this.valueToRatio(cl.textAsNumber)}})
    }
    
    /**
     * Check if the scale is properly defined = start and end colors exists, and if middle color optionally define, also 
     * @returns {boolean} 
     */
    isDefined() {
        return this.start.color != undefined 
            && this.end.color != undefined 
            && ( !this.isMiddleColorEnabled() || this.middle.color != undefined )
    }

    /**
     * Return the absolute value from a relative position in the scale
     * @param {number} ratio a number between 0 and 1 
     * @returns {number} the value in the current scale
     */
    ratioToValue(ratio) {
        return this.start.textAsNumber + ratio * (this.end.textAsNumber - this.start.textAsNumber)
    }

    /**
     * Calculate the relative position of the value in the scale as %
     * @param {number} value 
     * @returns {number} value between 0 and 1
     */
    valueToRatio(value) {
        return ((value - this.start.textAsNumber) / (this.end.textAsNumber - this.start.textAsNumber))
    }
    
    /**
     * Event listener, change one of the extremity color for the gradient (start, middle, end)
     * @param {HexColor} color 
     * @param {number} edge
     */
    setGradientColor(color, edge) {
        this.edges[edge].color = color;
        log.trace(`edge #${edge}: ${this.edges[edge].color.toString()}`);
        this._applyColors();
    }

    _calcSelectionColors() {
        // calculate colors for all labels   
        if  (this.isDefined()) {
            const edges = this.edges;
            for (let i = 1; i < edges.length; i++) {
                const start = edges[i-1];
                const end = edges[i];
                const [sr, sg, sb] = start.color.toRGB();
                const [er, eg, eb] = end.color.toRGB();
                const delta = end.textAsNumber - start.textAsNumber;
                log.trace(`End = ${end.textAsNumber}, Start = ${start.textAsNumber}, Delta = ${delta}`);
                for (const l of this.selection) {
                    if (l.textAsNumber >= start.textAsNumber && l.textAsNumber <= end.textAsNumber) {
                        const ratio = (l.textAsNumber - start.textAsNumber) / delta;
                        const r = Math.round(er * ratio + sr * (1 - ratio));
                        const g = Math.round(eg * ratio + sg * (1 - ratio));
                        const b = Math.round(eb * ratio + sb * (1 - ratio));    
                        const hexColor = HexColor.fromRGB(r, g, b);
                        log.trace(`Ratio for ${l.text}: ${l.textAsNumber} = ${ratio.toPrecision(4)} => ${hexColor}`);
                        l.color = hexColor;
                    }
                }
            }
        } else {
            log.info("Undefined color at gradient extremity. Gradient colors not calculated");
            for (const l of this.selection) {
                l.color = undefined;
            }
        }
    }

    /**
     * Recalculate colors for the current Colormap selection, in the sorted numeric order
     * recalculate if necessary the start, end, middle and sort the selection
     * @private
     */
    _applyColors() {
        this._calcSelectionColors();
        this.colormap._fireEvent(this.colormap.labels(true));
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
     * @param {string} [property] default selected property, may not match the collected
     */
    constructor (collected, property) {
        super(Object.entries(collected).map(([name,labels]) => [name, new ColorMap(name, labels)]));
        this.forEach(colormap => colormap.model = this);
        // Set default property as 1st in list
        assert(this.size >0, "No property found");
        // default property is 1st of list
        this._colormap = this.entries().next().value[1];
        log.debug(`properties collected: ${[...this.keys()]}`);
        this.forEach((colormap, _) => log.info(`property '${colormap.name}' labels: ${[...colormap.values()].map((cl) => cl.text)}`));
        /** @type {Set<ObserverCallback>} */
        this._observers = new Set();
        // load default color schemes if exist
        this.forEach((colormap, _) => colormap.loadColorScheme());
        // override default if possible
        if (property != undefined) {
            if (this.has(property)) {
                this.property = property
                log.info(`Property ${this.property} selected`);
            } else {
                log.warn(`Requested property '${property}' does not exist among the collected`)
            }
        }
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
        if (this._observers.size> 0) {
            const changed = this.colormap.subset(labels);
            log.debug(`Firing event for ${[...changed.keys()]}`);
            this._observers.forEach(
                (f) => {
                    log.trace(`... handled by callback for ${f.name}`);
                    f(changed);
                }
            )
        } else {
            log.trace('No observers declared for event firing')
        }
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
     * Change the current property if possible
     * @param {string} name
     */
    set property(name) {
        if (this.has(name))
            this._colormap = this.get(name);
    }
    
    /**
     * The current ColorMap
     * @returns {ColorMap}
     */
    get colormap() {
        return this._colormap;
    }

}

/**
 * @type {ColorModel}
 * 
 * Global variable :-( singleton to manage the state thru the Wizard
 * FIXME!
 */
var cModel;

