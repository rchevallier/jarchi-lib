"use strict";

load(__SCRIPTS_DIR__ + "lib/ImageRegistry.js")

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
 * Store the shared variables between wizards pages and inside page, as not possible to add attributes to 
 * an extended JavaClass instance in JS GraalVM (allows only overriden method)
 */
const wizardUI = {
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
    endBtn: undefined
};


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
const PropertyColorMapPage = Java.extend(Java.type('org.eclipse.jface.wizard.WizardPage'));
const ColorMapWizardModel = Java.extend(Java.type('org.eclipse.jface.wizard.Wizard'));
const imageRegistry = new ImageRegistry(40, 16);

const pagePropertySelection = new PropertyColorMapPage("pageProperty", {

    createControl(parent) 
    {
        const container = new Composite(parent, SWT.NONE);
        GridLayoutFactory.swtDefaults().numColumns(2).margins(20, 10).spacing(20, 10).applyTo(container);
        WidgetFactory.label(SWT.NONE).text("Properties: ").layoutData(GridDataFactory.fillDefaults().create()).create(container);
        const list = new ListBox(container, SWT.BORDER | SWT.SINGLE);
        list.addSelectionListener(SelectionListener.widgetSelectedAdapter((e) => {
            wizModel.property = list.getSelection()[0];
            log.info(`${wizModel.property} selected`);
            pageLabelsSelection.setPageComplete(false);
            }));
        list.setItems(Java.to(wizModel.properties, StringArray));
        list.setLayoutData(new GridData(GridData.FILL_BOTH));
        list.setSelection(0);

        pagePropertySelection.setTitle('Select a property');
        pagePropertySelection.setDescription('Among the properties found in current view to be used to colorize the elements');
        pagePropertySelection.setControl(container);
        pagePropertySelection.setPageComplete(wizModel.hasProperty); // should never be false
    }

});


const pageLabelsSelection = new PropertyColorMapPage("pageLabelsSelection", 
{

    createControl: function (parent) 
    {
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
                log.trace("*** CLIC! ", e.item + " " + evtKind + " " + e.item.getChecked());
                if (e.detail == SWT.CHECK) {
                    log.trace("... on ", e.item.getText(), wizardUI.allLabelsCheckbox.getText());
                    if (e.item == wizardUI.allLabelsCheckbox) {
                        const state = wizardUI.allLabelsCheckbox.getChecked();
                        log.debug("All labels handling, setting to ", state);
                        wizModel.setSelection(wizModel.colormap.labels(), state);
                    } else  {
                        log.trace("Single label handling");
                        log.debug(`'${e.item.getText()}' ColorLabel = ${JSON.stringify(wizModel.colormap.get(e.item.getText()))} `)
                        wizModel.setSelection([e.item.getText()], e.item.getChecked());
                    }
                    log.trace("Updating wizard buttons");
                    pageLabelsSelection.getWizard().getContainer().updateButtons();
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
        wizardUI.btnCategorical = new Button(group, SWT.RADIO);
        wizardUI.btnCategorical.setSelection(true);
        wizardUI.btnCategorical.setText("Categorical (text)")
        wizardUI.btnContinuous = new Button(group, SWT.RADIO);
        wizardUI.btnContinuous.setSelection(false);
        wizardUI.btnContinuous.setText("Continuous (numeric)")

        WidgetFactory
            .label(SWT.NONE)
            .text("You can choose a continuous scale"+
                " only if all the selected labels start with or are a number (int or float)")
            .layoutData(GridDataFactory.fillDefaults().span(2, 1).create())
            .create(container);

        pageLabelsSelection.setDescription(
            "Select the labels to colorize, and the type of color scale.");
        // We use this property as meaning "has been shown at least once"
        pageLabelsSelection.setPageComplete(false);
        pageLabelsSelection.setControl(container);
    },

    /**
     * @param {boolean} visible 
     */
    setVisible: function (visible)
    {
        log.trace("current property: " + wizModel.property);

        /**
         * 
         * @param {ColorMap} colormap 
         */
        function updateLabelCheckmarks(colormap) {
            log.trace(`${updateLabelCheckmarks.name}: updating checkmark states`);
            const table = wizardUI.labelsTable;
            const updated = [...colormap.keys()];

            log.trace(`Setting (all labels) state`);
            table.getItem(0).setChecked(wizModel.colormap.allIncluded);

            for (const i of table.getItems()) {
                const label = i.getText()
                if (updated.includes(label)) {
                    log.trace(`Syncing '${label}' checkbox with ${JSON.stringify(colormap.get(label))} `)
                    i.setChecked(colormap.get(label).included)
                }
            }

            log.trace(`Enabling btnContinuous = ${wizModel.colormap.allIncludedNumeric}`);
            wizardUI.btnContinuous.setEnabled(wizModel.colormap.allIncludedNumeric);
        }

        try {
            if (visible) {
                wizModel.addObserver(updateLabelCheckmarks);
                const table = wizardUI.labelsTable;
                // clean all labels except '(Select all)'
                if (table.getItemCount() > 1) table.remove(1, table.getItemCount()-1);
                // fillup with current labels
                for (const l of wizModel.colormap.labels()) {
                    log.trace(`adding "${l}"`)
                    let t = new TableItem(table, SWT.NONE);
                    t.setText(l);
                    // t.setChecked(wizModel.isSelected(value));
                }
                // set their initial state from model
                updateLabelCheckmarks(wizModel.colormap); 
                // store subset of tableItems without the 1st item "(all labels)"
                wizardUI.labelItems = Java.from(table.getItems()).slice(1);

                pageLabelsSelection.setTitle(`Labels selection for '${wizModel.property}'`);
                pageLabelsSelection.getWizard().getContainer().updateButtons();
                // We use this property as meaning "has been shown at least once"
                pageLabelsSelection.setPageComplete(true);
            } else {
                wizModel.removeObserver(updateLabelCheckmarks);
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
    canFlipToNextPage: function() 
    {
        // only if at least a value is selected
        let goNext = wizModel.colormap.someIncluded; // wizardState.valueItems.some((e) => e.getChecked());
        log.debug("Next? ", goNext, " items: ", tableItemStr(wizardUI.labelItems));
        return goNext
    },

    getNextPage: function ()
	{    		
		if (wizardUI.btnCategorical.getSelection()) {
            log.info("NextPage:", pageCategoryColor.getName());
            return pageCategoryColor;
		} else if (wizardUI.btnContinuous.getSelection()) { 
            log.info("NextPage:", pageContinuousColor.getName());
			return pageContinuousColor;
		} else {
            log.info("Cannot determine next page!");
		    return null;
        }
	}

});


const SCHEME_KIND = {CAT: 'categorical', CONT: 'continuous'};


const pageCategoryColor = new PropertyColorMapPage("CategoryColorPage", 
{
    createControl: function (parent)
    {
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
                        wizModel.setColorForLabels(labels, hexColor);
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
            .text('Select one or more label to set the color, Double-Clic or use "Set Color" button to define the color')
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
            .onSelect((_) => {try {wizModel.saveColorScheme()} catch (err) {log.error(err.toString())}})
            .create(group);

        WidgetFactory
            .button(SWT.PUSH)
            .text("Reload")
            .onSelect((_) => {try {wizModel.loadColorScheme()} catch (err) {log.error(err.toString())}})
            .create(group);

        const resetDefaultCB = WidgetFactory
            .button(SWT.CHECK)
            .text("Reset non-matching components to default colors")
            .onSelect((e) => {wizModel.resetDefault = resetDefaultCB.getSelection();})
            .create(container)
        resetDefaultCB.setSelection(wizModel.resetDefault);

        pageCategoryColor.setDescription("Please define the color for each label");
        pageCategoryColor.setControl(container);
        // We use this property as meaning "has been shown at least once"
        pageCategoryColor.setPageComplete(false);
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
            for (const item of wizardUI.catColorTable.getItems()) {
                const label = item.getText();
                if (colormap.has(label)) {
                    log.debug(`callback: setting color ${colormap.get(label).color} for ${label}`)
                    item.setImage(imageRegistry.getImage(colormap.get(label).color))
                }
            }
        }
        
        try {
            if (visible) {
                wizModel.addObserver(updateColorImages);
                // FIXME move to previous page ?
                wizardUI.catColorTable.removeAll();
                for (const value of wizModel.colormap.labels(true)) {
                    let item = new TableItem(wizardUI.catColorTable, SWT.NONE);
                    item.setText(value);
                };
                updateColorImages(wizModel.colormap)
                pageCategoryColor.setTitle(`Labels colors for '${wizModel.property}'`);
                // We use this property as meaning "has been shown at least once for this property selection"
                pageCategoryColor.setPageComplete(true);
            } else {
                wizModel.removeObserver(updateColorImages);
            }
        } catch (err) {
            log.info(err.toString())
        } finally {
            Java.super(pageCategoryColor).setVisible(visible);
        }       
    }

});


const pageContinuousColor = new PropertyColorMapPage("continuousColorPage", {

    createControl(parent)
    {
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
                    wizModel.scale.setColor(hexColor, event.source === wizardUI.endBtn)
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
            .onSelect((_) => {wizModel.saveColorScheme()})
            .create(group);

        WidgetFactory
            .button(SWT.PUSH)
            .text("Reload")
            .tooltip("Load default color scheme")
            .layoutData(GridDataFactory.swtDefaults().create())
            .onSelect((_) => {wizModel.loadColorScheme()})
            .create(group);

        // Gradient management
        wizardUI.startBtn = WidgetFactory
            .button(SWT.PUSH)
            // need image for correct size FIXME use size hit ?
            .image(imageRegistry.getImage(new HexColor("#FFFFFF")))
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
            .image(imageRegistry.getImage(new HexColor("#FFFFFF")))
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
            .text("Reset non-matching components to default colors")
            .onSelect((_) => {wizModel.resetDefault = resetDefaultCB.getSelection();})
            .layoutData(GridDataFactory.fillDefaults().span(3, 1).create())
            .create(container)
        // FIXME move to Visible ?
        resetDefaultCB.setSelection(wizModel.resetDefault);

        pageContinuousColor.setControl(container);
        // Using this property as meaning "has been shown at least once"
        pageContinuousColor.setPageComplete(false); 
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
            wizardUI.startBtn.setImage(imageRegistry.getImage(wizModel.scale.start.color));
            wizardUI.endBtn.setImage(imageRegistry.getImage(wizModel.scale.end.color));
            log.trace(`gradient update...`)
            wizardUI.gradientLabel.setImage(
                imageRegistry.getGradientImage(
                    wizModel.scale.start.color,
                    wizModel.scale.end.color,
                    wizardUI.gradientLabel.getBounds()
                    )
                )
            log.info("updating preview colors")
            for (const i of wizardUI.gradientTable.getItems()) {
                i.setImage(imageRegistry.getImage(wizModel.colormap.get(i.getText()).color))
            }
        }

        try {
            if (visible) {
                wizModel.addObserver(updateColorsPreview);

                // setting the scale for current selection
                wizModel.scale = new ContinuousScale(wizModel);

                // creating the preview labels
                wizardUI.gradientTable.removeAll();
                for (const l of wizModel.scale.selection) {
                    const item = new TableItem(wizardUI.gradientTable, SWT.NONE);
                    item.setText(l.text);
                    item.setImage(imageRegistry.getImage(l.color))
                }
                // force colormap scale recalculation 
                wizModel.scale.applyColors();

                pageContinuousColor.setTitle(`Continuous color scale for '${wizModel.property}'`);
                pageContinuousColor.setDescription(`Select start ('${wizModel.scale.start.text}') and end ('${wizModel.scale.end.text}') colors to define gradient`);
    
                // Using this property as meaning "has been shown at least once"
                pageContinuousColor.setPageComplete(true);
            } else {
                wizModel.removeObserver(updateColorsPreview)
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
        // save which scale was used
        wizModel.scaleType =  wizardUI.btnCategorical.getSelection() ? ColorModel.CATEGORICAL : ColorModel.CONTINUOUS;
        log.trace(`Wizard type ${wizModel.scaleType} : finished`);
        return true;
    },

    // performCancel: function() 
    // {
    //     log.trace("Wizard cancelled");
    //     return true;
    // },

    canFinish: function() 
    {
        // FIXME add continuous condition alternative
        const result = wizModel.hasProperty 
            && pageLabelsSelection.isPageComplete() && wizModel.colormap.someIncluded 
            && ((pageCategoryColor.isPageComplete() && wizardUI.btnCategorical.getSelection())
               || (pageContinuousColor.isPageComplete() && wizardUI.btnContinuous.getSelection()));
        return result
    }
}

const wizardModel = new ColorMapWizardModel (WIZARD_SUBCLASS_EXTENSION);
wizardModel.setHelpAvailable(false);
wizardModel.addPage(pagePropertySelection);
wizardModel.addPage(pageLabelsSelection);
wizardModel.addPage(pageCategoryColor);
wizardModel.addPage(pageContinuousColor);
wizardModel.setWindowTitle("Property Colormap");


// FIXME try to create a composition to avoid static ?
// function HeatmapWizardDialogInstance(model) {
//     this.model = model;
//     // wizModel = model;
//     this.wizard = new PropertyHeatmapWizard(WIZARD_EXTEND);
//     this.wizard.setHelpAvailable(false);
//     // this.wizard.addPage(pagePropertySelection);
//     // this.wizard.addPage(pageValuesSelection);
//     // this.wizard.addPage(pageCategoryScale);
//     // this.wizard.addPage(pageContinuousScale);
//     this.wizard.setWindowTitle("Property Colormap");
// }

