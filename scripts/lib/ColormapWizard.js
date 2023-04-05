/**
 * SWT UI Wizard classes for Colormap.ajs script
 * 
 * @license Apache-2.0 cf LICENSE-2.0.txt
 * @author rchevallier
 * @copyright 2023 rchevallier
 * @see {@link ./doc/Colormap.md}
 * @see {@link ../Colormap.ajs}
 */


load(__DIR__ + "ImageRegistry.js")

const SWT = Java.type('org.eclipse.swt.SWT');
const Composite = Java.type('org.eclipse.swt.widgets.Composite');
const Group = Java.type('org.eclipse.swt.widgets.Group');
const Button = Java.type('org.eclipse.swt.widgets.Button');
const ListBox = Java.type('org.eclipse.swt.widgets.List');
const Table = Java.type('org.eclipse.swt.widgets.Table');
const TableItem = Java.type('org.eclipse.swt.widgets.TableItem');
const GridData = Java.type('org.eclipse.swt.layout.GridData');
const GridLayout = Java.type('org.eclipse.swt.layout.GridLayout');
const WidgetFactory = Java.type('org.eclipse.jface.widgets.WidgetFactory');
const GridDataFactory = Java.type('org.eclipse.jface.layout.GridDataFactory');
const GridLayoutFactory = Java.type('org.eclipse.jface.layout.GridLayoutFactory');
const RowLayoutFactory = Java.type('org.eclipse.jface.layout.RowLayoutFactory');
const RowLayout = Java.type('org.eclipse.swt.layout.RowLayout');
const FillLayout = Java.type('org.eclipse.swt.layout.FillLayout');
const StringArray = Java.type('java.lang.String[]');
const MouseListener = Java.type('org.eclipse.swt.events.MouseListener');
const SelectionListener = Java.type('org.eclipse.swt.events.SelectionListener');


/**
 * Stringify for debug (Helper)
 * 
 * @param {JavaObject[]} items JS array of TableItem
 * @returns {String} 
 */
function tableItemStr(items) 
{
    return `{${items.map(i => i.getText()).join(",")}}`
}

const CustomColorDialog = Java.type("com.archimatetool.editor.ui.components.CustomColorDialog");
const ColorMapWizardPage = Java.extend(Java.type('org.eclipse.jface.wizard.WizardPage'));

const pagePropertySelection = new ColorMapWizardPage("pagePropertySelection", {

    createControl(parent) 
    {
        try {
            log.trace(pagePropertySelection.getName()+'...');
            const container = new Composite(parent, SWT.NONE);
            GridLayoutFactory.swtDefaults().numColumns(2).margins(20, 10).spacing(20, 10).applyTo(container);
            WidgetFactory.label(SWT.NONE).text("Properties: ").layoutData(GridDataFactory.fillDefaults().create()).create(container);
            const list = new ListBox(container, SWT.BORDER | SWT.SINGLE);
            list.addSelectionListener(SelectionListener.widgetSelectedAdapter((e) => {
                try {
                    cModel.property = list.getSelection()[0];
                    log.info(`Property ${cModel.property} selected`);
                    pagePropertySelection.setPageComplete(cModel.hasProperty); // should never be false
                } catch (err) {
                    log.error(err.toString())
                }
            }));
            list.addMouseListener(MouseListener.mouseDoubleClickAdapter((e) => {
                try {
                    // going next page
                    pagePropertySelection.getWizard().getContainer().showPage(pageLabelsSelection);
                } catch (err) {
                    log.error(err.toString())
                }
            }));
            list.setItems(Java.to(cModel.properties, StringArray));
            list.setLayoutData(new GridData(GridData.FILL_BOTH));
            list.setSelection(list.indexOf(cModel.property));
    
            pagePropertySelection.setTitle('Select a property');
            pagePropertySelection.setDescription('Among the properties found in current view to be used to colorize the elements');
            pagePropertySelection.setControl(container);
            pagePropertySelection.setPageComplete(cModel.hasProperty); // should never be false
            log.trace(` ... created`);
        } catch (error) {
            log.error(error.toString())            
        }
    }

});


const pageLabelsSelection = new ColorMapWizardPage("pageLabelsSelection", 
{

    createControl: function (parent) 
    {
        try {
            log.trace(pageLabelsSelection.getName()+'...');
            const container = new Composite(parent, SWT.NONE);
            GridLayoutFactory.swtDefaults().numColumns(2).margins(20, 10).spacing(20, 10).applyTo(container); // spacing(10, 5).
            WidgetFactory
                .label(SWT.NONE)
                .text("Labels:")
                .layoutData(GridDataFactory.fillDefaults().create())
                .create(container);

            wizardUI.labelsTable = new Table(container, SWT.CHECK | SWT.BORDER | SWT.V_SCROLL | SWT.HIDE_SELECTION);
            wizardUI.labelsTable.setLayoutData(new GridData(GridData.FILL_BOTH));
            wizardUI.allLabelsCheckbox = new TableItem(wizardUI.labelsTable, SWT.NONE);
            wizardUI.allLabelsCheckbox.setText('(all labels)');
            wizardUI.labelsTable.addListener (SWT.Selection, (e) => {
                try {
                    const evtKind = e.detail == SWT.CHECK ? 'Check' : 'Selection';
                    log.trace("*** CLICK! ", e.item + " " + evtKind + " " + e.item.getChecked());
                    if (e.detail == SWT.CHECK) {
                        log.trace("... on ", e.item.getText(), wizardUI.allLabelsCheckbox.getText());
                        if (e.item == wizardUI.allLabelsCheckbox) {
                            const state = wizardUI.allLabelsCheckbox.getChecked();
                            log.debug("All labels handling, setting to ", state);
                            cModel.colormap.setSelection(cModel.colormap.labels(), state);
                        } else  {
                            log.trace("Single label handling");
                            log.debug(`'${e.item.getText()}' ColorLabel = ${JSON.stringify(cModel.colormap.get(e.item.getText()))} `)
                            cModel.colormap.setSelection([e.item.getText()], e.item.getChecked());
                        }
                    }
                } catch (err) {
                    log.error(err.toString());
                }
            });

            WidgetFactory
                .label(SWT.NONE)
                .text("Color scale:")
                .create(container);
            const group = new Composite(container, SWT.NONE);
            group.setLayout (new FillLayout (SWT.HORIZONTAL));
            group.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

            wizardUI.btnCategorical = WidgetFactory
                .button(SWT.RADIO)
                .text("Categorical (text)")
                .tooltip("Use a discrete color scheme")
                .onSelect(e => cModel.colormap.scaleType = e.source.getData())
                .create(group);
            wizardUI.btnCategorical.setData(ColorMap.CATEGORICAL);
            wizardUI.btnCategorical.setSelection(cModel.colormap.scaleType == ColorMap.CATEGORICAL);

            wizardUI.btnContinuous = WidgetFactory
                .button(SWT.RADIO)
                .text("Continuous (numeric)")
                .tooltip("Use a continuous (gradient) color scheme (for numeric labels only)")
                .onSelect(e => cModel.colormap.scaleType = e.source.getData())
                .create(group);
            wizardUI.btnContinuous.setData(ColorMap.CONTINUOUS);
            wizardUI.btnContinuous.setSelection(cModel.colormap.scaleType == ColorMap.CONTINUOUS)

            WidgetFactory
                .label(SWT.NONE)
                .text("You can choose a continuous scale"+
                    " only if all the selected labels start with or are a number (int or float)")
                .layoutData(GridDataFactory.fillDefaults().span(2, 1).create())
                .create(container);

            pageLabelsSelection.setDescription("Select the labels to colorize, and the type of color scale.");
            pageLabelsSelection.setPageComplete(cModel.colormap.someIncluded());
            pageLabelsSelection.setControl(container);
            log.trace(` ... created`);
        } catch (err) {
            log.error(err.toString());
        }
    },

    /**
     * @param {boolean} visible 
     */
    setVisible: function (visible)
    {
        log.trace("Showing "+ pageLabelsSelection.getName() +"property: " + cModel.property);

        /**
         * 
         * @param {ColorMap} colormap 
         */
        function updateLabelCheckMarks(colormap) {
            assert(colormap != undefined)
            log.trace(`${updateLabelCheckMarks.name}: updating check mark states`);
            const table = wizardUI.labelsTable;
            const updated = [...colormap.keys()];

            log.trace(`Setting (all labels) state`);
            table.getItem(0).setChecked(cModel.colormap.allIncluded());

            for (const i of table.getItems()) {
                const label = i.getText();
                if (updated.includes(label)) {
                    log.trace(`Syncing '${label}' checkbox with ${JSON.stringify(colormap.get(label))} `);
                    // i.setChecked(colormap.get(label).included);
                    i.setChecked(i.getData().included);
                }
            }

            log.trace(`Enabling btnContinuous = ${colormap.allIncludedNumeric()}`);
            wizardUI.btnContinuous.setEnabled(colormap.allIncludedNumeric());
            // pageLabelsSelection.setPageComplete(colormap.someIncluded());
            log.trace("Updating wizard buttons");
            pageLabelsSelection.getWizard().getContainer().updateButtons();
        }

        try {
            if (visible) {
                cModel.registerModelChangeObserver(updateLabelCheckMarks);
                const table = wizardUI.labelsTable;
                // clean all labels except '(Select all)'
                if (table.getItemCount() > 1) table.remove(1, table.getItemCount()-1);
                // fill up with current labels
                for (const cl of cModel.colormap.values()) {
                    log.trace(`adding "${cl}"`)
                    let t = new TableItem(table, SWT.NONE);
                    t.setText(cl.text);
                    t.setData(cl);  // associate the ColorLabel
                }
                // set their initial state from model
                updateLabelCheckMarks(cModel.colormap); 
                // store subset of tableItems without the 1st item "(all labels)"
                // wizardUI.labelItems = Java.from(table.getItems()).slice(1);
            } else {
                cModel.removeModelChangeObserver(updateLabelCheckMarks);
            }
        } catch (err) {   
            log.info(err.toString(), ":",  Java.isJavaObject(err) ? Java.typeName(err): typeof(err) )
        } finally {
            Java.super(pageLabelsSelection).setVisible(visible);
        }
    },

    /**
     * Check the state of the "Next >" button
     * @returns {boolean} 
     */
    // canFlipToNextPage: function() 
    // {
    //     // only if at least a value is selected
    //     return colorModel.colormap.someIncluded(); 
    // },

    getNextPage: function ()
	{    	
        if (cModel.colormap.scaleType == ColorMap.CATEGORICAL) {
            log.info("NextPage:", pageCategoryColor.getName());
            return pageCategoryColor;
		} else if (cModel.colormap.scaleType == ColorMap.CONTINUOUS) { 
            log.info("NextPage:", pageContinuousColor.getName());
			return pageContinuousColor;
		} else {
            log.info("Cannot determine next page!");
		    return null;
        }
	}

});


const pageCategoryColor = new ColorMapWizardPage("pageCategoryColor", 
{
    createControl: function (parent)
    {
        try {
            log.trace(pageCategoryColor.getName()+'...');
            const container = new Composite(parent, SWT.NONE);
            GridLayoutFactory.swtDefaults().numColumns(2).margins(20, 10).spacing(20, 10).applyTo(container); // spacing(10, 5)

            function setColor(event) {
                if (wizardUI.catColorTable.getSelectionCount() == 0) {
                    log.debug("No label selected");
                } else {
                    const colorDlg = new CustomColorDialog(container.getShell());
                    try {
                        const selectedColor = colorDlg.open();
                        if (selectedColor) {
                            const hexColor = ImageRegistry.swtRGBToHex(selectedColor);
                            const labels = Java.from(wizardUI.catColorTable.getSelection()).map((item) => item.getText())
                            log.debug(`changing color for ${labels} to ${hexColor}`)
                            cModel.setColorForLabels(labels, hexColor);
                        } else {
                            log.debug("color selection cancelled");
                        }
                    } finally {
                        colorDlg.dispose();
                    }
                }
            }

            WidgetFactory
                .label(SWT.NONE)
                .text('Select one or more labels, double-click or click "Set Color" to define the color')
                .layoutData(GridDataFactory.fillDefaults().span(2, 1).create())
                .create(container);

            wizardUI.catColorTable = WidgetFactory
                .table(SWT.BORDER | SWT.MULTI | SWT.FULL_SELECTION )
                .create(container); 
            GridDataFactory.defaultsFor(wizardUI.catColorTable).align(SWT.FILL, SWT.FILL).grab(true, true).span(1,2).applyTo(wizardUI.catColorTable);
            wizardUI.catColorTable.addMouseListener(MouseListener.mouseDoubleClickAdapter(setColor));

            WidgetFactory
                .button(SWT.PUSH)
                .text("Set Color")
                .tooltip("Set color of selected labels")
                .layoutData(GridDataFactory.fillDefaults().create())
                .onSelect(setColor)
                .create(container);
                
            const layout = new FillLayout(SWT.VERTICAL);
                layout.spacing = 8;
                layout.marginHeight = 8;
                layout.marginWidth = 16;

            const group = WidgetFactory
                .group(SWT.NONE)
                .text("Color scheme")
                .layout(layout)
                .create(container);
            GridDataFactory.defaultsFor(group).align(SWT.END, SWT.END).applyTo(group);

            WidgetFactory
                .button(SWT.PUSH)
                .text("Save")
                .tooltip("Save as default color scheme")
                .onSelect((_) => {try {cModel.colormap.saveColorScheme()} catch (err) {log.error(err.toString())}})
                .create(group);

            WidgetFactory
                .button(SWT.PUSH)
                .text("Reload")
                .tooltip("Load default color scheme")
                .onSelect((_) => {try {cModel.colormap.loadColorScheme()} catch (err) {log.error(err.toString())}})
                .create(group);

            const resetDefaultCB = WidgetFactory
                .button(SWT.CHECK)
                .tooltip("Reset non-matching components to default colors")
                .text("Reset other to default color")
                .onSelect((e) => {cModel.colormap.resetDefault = resetDefaultCB.getSelection();})
                .create(container)
            resetDefaultCB.setSelection(cModel.colormap.resetDefault);

            pageCategoryColor.setDescription("Please define the color for each label");
            pageCategoryColor.setControl(container);
            pageCategoryColor.setPageComplete(cModel.colormap.isApplicable());
            log.trace("... created");
        } catch (err) {
            log.error(err.toString())
        }
    },

    canFlipToNextPage: function() 
    {
       return false;
    },

    setVisible: function (visible) 
    {
        /**
         * updating color image of table items, used as callback in the model observers
         * @param {ColorMap} colormap 
         */
        function updateColorImages(colormap) {
            assert (colormap != undefined)
            for (const item of wizardUI.catColorTable.getItems()) {
                const label = item.getText();
                if (colormap.has(label)) {
                    log.debug(`callback: setting color ${item.getData().color} to ${label}`);
                    item.setImage(imageRegistry.getImage(item.getData().color));
                }
            }
            pageCategoryColor.setPageComplete(cModel.colormap.isApplicable());
            pageCategoryColor.getWizard().getContainer().updateButtons();
        }
        
        try {
            if (visible) {
                cModel.registerModelChangeObserver(updateColorImages);
                // FIXME move to previous page when deciding the scaleType?
                wizardUI.catColorTable.removeAll();
                for (const cl of cModel.colormap.selection) {
                    let item = new TableItem(wizardUI.catColorTable, SWT.NONE);
                    item.setText(cl.text);
                    item.setData(cl);
                };
                updateColorImages(cModel.colormap)
                pageCategoryColor.setTitle(`Labels colors for '${cModel.property}'`);
            } else {
                cModel.removeModelChangeObserver(updateColorImages);
            }
        } catch (err) {
            log.info(err.toString())
        } finally {
            Java.super(pageCategoryColor).setVisible(visible);
        }       
    }

});


const pageContinuousColor = new ColorMapWizardPage("pageContinuousColor", {

    createControl(parent)
    {
        try {
            log.trace(pageContinuousColor.getName() + "...");
            const container = new Composite(parent, SWT.NONE);
            GridLayoutFactory.swtDefaults().numColumns(4).margins(20, 10).spacing(2, 6).applyTo(container); 

            // FIXME refactor to share this with categorical if possible
            function setColor(event) {
                const colorDlg = new CustomColorDialog(container.getShell());
                try {
                    const selectedColor = colorDlg.open();
                    if (selectedColor) {
                        const hexColor = ImageRegistry.swtRGBToHex(selectedColor);
                        log.info(`Setting color ${hexColor} for ${ event.source == wizardUI.endBtn ? 'end' : 'start'}Button`)
                        // FIXME create the scale instead on Visible in the context of the UI? or Model ?
                        cModel.scale.setColor(hexColor, event.source === wizardUI.endBtn)
                    } else {
                        log.debug("color selection cancelled");
                    }
                } catch (err) {
                    log.error(err.toString());
                } finally {
                    colorDlg.dispose();
                }
            }

            // Labels for gradient 
            WidgetFactory
                .label(SWT.CENTER)
                .text("Start")
                .layoutData(GridDataFactory.swtDefaults().create())
                .create(container);

            WidgetFactory.label(SWT.CENTER)
                .text("Color gradient")
                .layoutData(GridDataFactory.fillDefaults().create())
                .create(container);
        
            WidgetFactory    
                .label(SWT.CENTER)
                .text("End")
                .layoutData(GridDataFactory.swtDefaults().align(SWT.END, SWT.CENTER).create())
                .create(container);

            // Color scheme default management group
            const layout = new FillLayout(SWT.VERTICAL);
                layout.spacing = 8;
                layout.marginHeight = 8;
                layout.marginWidth = 16;

            const group = WidgetFactory
                .group(SWT.NONE)
                .text("Color scheme")
                .layout(layout)
                .create(container);
            GridDataFactory.defaultsFor(group).span(1, 3).indent(16, 0).align(SWT.END, SWT.END).applyTo(group);

            WidgetFactory
                .button(SWT.PUSH)
                .text("Save")
                .tooltip("Save as default color scheme")
                .layoutData(GridDataFactory.swtDefaults().create())
                .onSelect((_) => {cModel.colormap.saveColorScheme()})
                .create(group);

            WidgetFactory
                .button(SWT.PUSH)
                .text("Reload")
                .tooltip("Load default color scheme")
                .layoutData(GridDataFactory.swtDefaults().create())
                .onSelect((_) => {cModel.colormap.loadColorScheme()})
                .create(group);

            // Gradient management
            wizardUI.startBtn = WidgetFactory
                .button(SWT.PUSH)
                // need undefined image for correct size FIXME use size hit ?
                .image(imageRegistry.unknownImage)
                .tooltip("Click to set start color")
                .layoutData(GridDataFactory.swtDefaults().create())
                .onSelect(setColor)
                .create(container);     
            
            wizardUI.gradientLabel = WidgetFactory
                .label(SWT.BORDER)
                .tooltip("change it by changing colors at extremities")
                .layoutData(GridDataFactory.fillDefaults().grab(true, false).create())
                .create(container);   
                
            wizardUI.endBtn = WidgetFactory
                .button(SWT.PUSH)
                // need image for correct size
                .image(imageRegistry.unknownImage)
                .tooltip("Click to set end color")
                .layoutData(GridDataFactory.swtDefaults().create())
                .onSelect(setColor)
                .create(container);

            // Preview
                const preview = WidgetFactory
                .group(SWT.NONE)
                .text("Result preview")
                .layoutData(GridDataFactory.fillDefaults().span(3, 1).grab(true, true).create())
                .layout(new FillLayout())
                .create(container);

            wizardUI.gradientTable = WidgetFactory
                .table(SWT.SINGLE | SWT.HIDE_SELECTION)
                .background(container.getDisplay().getSystemColor(SWT.COLOR_WIDGET_BACKGROUND))
                .create(preview)        

            // reset to default
            const resetDefaultCB = WidgetFactory
                .button(SWT.CHECK)
                .tooltip("Reset non-matching components to default colors")
                .text("Reset other to default color")
                .onSelect((_) => {cModel.colormap.resetDefault = resetDefaultCB.getSelection();})
                .layoutData(GridDataFactory.fillDefaults().span(3, 1).create())
                .create(container)
            resetDefaultCB.setSelection(cModel.colormap.resetDefault);

            pageContinuousColor.setControl(container);
            pageContinuousColor.setPageComplete(cModel.colormap.isApplicable());
            log.trace("... created");
        } catch (err) {
            log.error(err.toString())
        }
    },

    /**
     * @override
     * @param {boolean} visible 
     */
    setVisible: function (visible) 
    {
        /**
         * 
         * @param {ColorMap} colormap 
        */
        function updateColorsPreview(colormap) {
            // No need to use colormap as all except one at most shall be updated
            log.trace(`buttons colors update...`)
            wizardUI.startBtn.setImage(imageRegistry.getImage(cModel.scale.start.color));
            wizardUI.endBtn.setImage(imageRegistry.getImage(cModel.scale.end.color));
            log.trace(`gradient update...`)
            wizardUI.gradientLabel.setImage(
                imageRegistry.getGradientImage(
                    cModel.scale.start.color,
                    cModel.scale.end.color,
                    wizardUI.gradientLabel.getBounds()
                    )
                )
            log.info("updating preview colors")
            for (const i of wizardUI.gradientTable.getItems()) {
                i.setImage(imageRegistry.getImage(i.getData().color));
            }
            pageContinuousColor.setPageComplete(cModel.colormap.isApplicable() && cModel.scale.isDefined());
            pageContinuousColor.getWizard().getContainer().updateButtons();
        }

        try {
            if (visible) {
                cModel.registerModelChangeObserver(updateColorsPreview);

                // creating the scale for current selection
                cModel.scale = new ContinuousScale(cModel);

                // creating the preview labels
                wizardUI.gradientTable.removeAll();
                for (const l of cModel.scale.selection) {
                    const item = new TableItem(wizardUI.gradientTable, SWT.NONE);
                    item.setText(l.text);
                    item.setImage(imageRegistry.getImage(l.color));
                    item.setData(l); // associate to model
                }
                // force colormap scale recalculation 
                cModel.scale.applyColors();

                pageContinuousColor.setTitle(`Continuous color scale for '${cModel.property}'`);
                pageContinuousColor.setDescription(`Select start ('${cModel.scale.start.text}') and end ('${cModel.scale.end.text}') colors to define gradient`);

                // Using this property as meaning "has been shown at least once"
                // pageContinuousColor.setPageComplete(true);
            } else {
                cModel.removeModelChangeObserver(updateColorsPreview)
            }
        } catch(err) {
            log.info(err.toString())
        } finally {
            Java.super(pageContinuousColor).setVisible(visible);
        }
    }
});

const WIZARD_SUBCLASS_EXTENSION = {

    performFinish: function() 
    {
        log.trace(`Wizard type ${cModel.colormap.scaleType} : finished`);
        // the whole enchilada is done outside, so this SWT method doesn't have to know about jArchi .ajs script
        return true;
    },

    canFinish: function() 
    {
        const result = cModel.hasProperty // has property selected
            && cModel.colormap.isApplicable()
            && (cModel.colormap.scaleType == ColorMap.CATEGORICAL || (cModel.scale != undefined && cModel.scale.isDefined() ));// and the associated colorMap is applicable
            // && pageLabelsSelection.isPageComplete() && colorModel.colormap.someIncluded() // selection page viewed and selection not empty
            // && ((pageCategoryColor.isPageComplete() && colorModel.scaleType == ColorModel.CATEGORICAL)  // cat color page viewed 
            //    || (pageContinuousColor.isPageComplete() && colorModel.scaleType == ColorModel.CONTINUOUS)); // or cont color page viewed
        return result;
    }
}


/**
 * Store the shared variables between wizards pages and inside a page, as not possible to add attributes to 
 * an extended JavaClass instance in JS GraalVM (allows only overridden method)
 */
const wizardUI = {
    /**
     * @type {ColorModel}
     */
    model: undefined,
    /**
     * @type {ImageRegistry}
     */
    imageRegistry: undefined,

    // LabelSelectionPage
    /** @type {JavaObject} */
    labelsTable: undefined,
    /** @type {JavaObject[]} subset of labelsTable TableItem without the "(all labels)" */
    labelItems: undefined,
    /** @type {JavaObject} the tableItem "(all labels)" */
    allLabelsCheckbox: undefined,
    /** @type {JavaObject} */
    btnCategorical: undefined,
    /** @type {JavaObject} */
    btnContinuous: undefined,
    /** @type {JavaObject} */
    // CategoryColorPage
    /** @type {JavaObject} */
    catColorTable: undefined,
    // ContinuousColorPage
    /** @type {JavaObject} */
    gradientLabel: undefined,
    /** @type {JavaObject} */
    gradientTable: undefined,
    /** @type {JavaObject} */
    startBtn: undefined,
    /** @type {JavaObject} */
    endBtn: undefined,

    /**
     * @param {ColorModel} model 
     */
    execute: function(model) {
        wizardUI.model = model;
        // do something
        return true
    }
};


let imageRegistry; // shared global

/**
 * Execute the Wizard to update colorModel
 * FIXME merge with WizardUI ?
 * @returns {ColorScheme} if Wizard finished, null if cancelled
 */
function wizardExecute() 
{
    const ColorMapWizard = Java.extend(Java.type('org.eclipse.jface.wizard.Wizard'));
    const colorMapWizard = new ColorMapWizard (WIZARD_SUBCLASS_EXTENSION);
    colorMapWizard.setHelpAvailable(false);
    colorMapWizard.addPage(pagePropertySelection);
    colorMapWizard.addPage(pageLabelsSelection);
    colorMapWizard.addPage(pageCategoryColor);
    colorMapWizard.addPage(pageContinuousColor);
    colorMapWizard.setWindowTitle("Property Colormap");
    try {
        imageRegistry = new ImageRegistry(40, 16, new HexColor("#F0F0F0"), '?');
        const JWizardDialog = Java.type('org.eclipse.jface.wizard.WizardDialog');
        const wizardDialog = new JWizardDialog(shell, colorMapWizard);
        const FINISH = 0, CANCEL = 1;
        log.trace("Ready to open")
        if (wizardDialog.open() == FINISH) {
            return cModel.colormap.getColorScheme();
        } else {
            return null
        }
    } finally {
        colorMapWizard.dispose();
        imageRegistry.dispose();        
    }

}

