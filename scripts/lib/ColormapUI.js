/**
 * SWT UI Wizard classes for Colormap wizard.ajs script
 * 
 * @license Apache-2.0 cf LICENSE-2.0.txt
 * @author rchevallier
 * @copyright 2023 rchevallier
 * @see {@link ./doc/Colormap%20wizard.md}
 * @see {@link ../Colormap%20wizard.ajs}
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
const ControlListener = Java.type('org.eclipse.swt.events.ControlListener');
const SelectionListener = Java.type('org.eclipse.swt.events.SelectionListener');
const CustomColorDialog = Java.type('com.archimatetool.editor.ui.components.CustomColorDialog');
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

            function gotoNextPageOnDblClick() {
                return MouseListener.mouseDoubleClickAdapter( e => {
                    try {
                        pageLabelsSelection.getWizard().getContainer().showPage(pageLabelsSelection.getNextPage());
                    } catch (err) {
                        log.error(err.toString());
                    }
                })
            };

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
            wizardUI.labelsTable.addSelectionListener(SelectionListener.widgetSelectedAdapter( (e) => {
                try {
                    if (e.detail == SWT.CHECK) {
                        if (e.item == wizardUI.allLabelsCheckbox) {
                            const state = wizardUI.allLabelsCheckbox.getChecked();
                            cModel.colormap.setSelection(cModel.colormap.labels(), state);
                        } else {
                            cModel.colormap.setSelection([e.item.getText()], e.item.getChecked());
                        }
                    }
                } catch (err) {
                    log.error(err.toString());
                }
            }));

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
                .onSelect(e => cModel.colormap.scaleClass = CategoricalScale)
                .create(group);
            // wizardUI.btnCategorical.setData();
            wizardUI.btnCategorical.addMouseListener(gotoNextPageOnDblClick())            

            wizardUI.btnContinuous = WidgetFactory
                .button(SWT.RADIO)
                .text("Continuous (numeric)")
                .tooltip("Use a continuous (gradient) color scheme (for numeric labels only)")
                .onSelect(e => cModel.colormap.scaleClass = ContinuousScale)
                .create(group);
            wizardUI.btnContinuous.addMouseListener(gotoNextPageOnDblClick());

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
            try {
                assert(colormap != undefined, "Colormap undefined when calling updateLabelCheckMarks")
                log.trace(`${updateLabelCheckMarks.name}: updating check mark states`);
                const table = wizardUI.labelsTable;
                const updated = [...colormap.keys()];

                log.trace(`Setting (all labels) state`);
                table.getItem(0).setChecked(cModel.colormap.allIncluded());

                for (const i of table.getItems()) {
                    const label = i.getText();
                    if (updated.includes(label)) {
                        log.trace(`Syncing '${label}' checkbox with ${JSON.stringify(colormap.get(label))} `);
                        i.setChecked(i.getData().included);
                    }
                }

                const allNumeric = colormap.allIncludedNumeric();
                log.trace(`Enabling btnContinuous = ${allNumeric}`);
                wizardUI.btnContinuous.setEnabled(allNumeric);
                if (!allNumeric) 
                    colormap.scaleClass = CategoricalScale;
                wizardUI.btnCategorical.setSelection(cModel.colormap.scaleClass == CategoricalScale);
                wizardUI.btnContinuous.setSelection(cModel.colormap.scaleClass == ContinuousScale);
                pageLabelsSelection.setPageComplete(cModel.colormap.someIncluded());
            } catch (err) {
                log.error(err.toString())
            }
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
                pageLabelsSelection.setTitle(`Labels selection for '${cModel.property}'`)
                // set their initial state from model
                updateLabelCheckMarks(cModel.colormap); 
            } else {
                cModel.removeModelChangeObserver(updateLabelCheckMarks);
            }
        } catch (err) {   
            log.info(err.toString(), ":",  Java.isJavaObject(err) ? Java.typeName(err): typeof(err) )
        } finally {
            Java.super(pageLabelsSelection).setVisible(visible);
        }
    },


    getNextPage: function ()
	{    	
        if (cModel.colormap.scale instanceof ContinuousScale) { 
            log.info("NextPage:", pageContinuousColor.getName());
			return pageContinuousColor;
        } else {
            log.info("NextPage:", pageCategoryColor.getName());
            return pageCategoryColor;
        }
	}

});


/**
 * Helper to factorize the group for Color Scheme management
 * @param {any} container the page container
 * @param {number} verticalSpan  Grid vertical spanning
 * @returns {any} the Save button instance
 */
function createColorSchemeWidgets(container, verticalSpan) {
    const layout = new FillLayout(SWT.VERTICAL);
    layout.spacing = 4;
    layout.marginHeight = 8;
    layout.marginWidth = 8;

    const group = WidgetFactory
        .group(SWT.NONE)
        .text("Color scheme")
        .layout(layout)
        .create(container);
    GridDataFactory.defaultsFor(group).span(1, verticalSpan).indent(16, 0).align(SWT.END, SWT.END).applyTo(group);

    const btnSave = WidgetFactory
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

    return btnSave;
}

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
                            cModel.colormap.setColor(labels, hexColor);
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
        
            wizardUI.btnSave1 = createColorSchemeWidgets(container, 2);

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
            assert (colormap != undefined, "Colormap undefined when calling updateColorImages")
            for (const item of wizardUI.catColorTable.getItems()) {
                const label = item.getText();
                if (colormap.has(label)) {
                    log.debug(`callback: setting color ${item.getData().color} to ${label}`);
                    item.setImage(imageRegistry.getImage(item.getData().color));
                }
            }
            wizardUI.btnSave1.setEnabled(cModel.colormap.isApplicable());
            pageCategoryColor.setPageComplete(cModel.colormap.isApplicable());
            pageCategoryColor.getWizard().getContainer().updateButtons();
        }
        
        try {
            if (visible) {
                cModel.registerModelChangeObserver(updateColorImages);
                // FIXME move to previous page when deciding the scaleClass?
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
            log.trace(pageContinuousColor.getName()+'...');
            const container = new Composite(parent, SWT.NONE);

            // FIXME factorize these settings for all page containers
            GridLayoutFactory.swtDefaults().numColumns(5).margins(20, 4).spacing(4, 4).applyTo(container); 

            function setColor(event) {
                const colorDlg = new CustomColorDialog(container.getShell());
                try {
                    const selectedColor = colorDlg.open();
                    if (selectedColor) {
                        const hexColor = ImageRegistry.swtRGBToHex(selectedColor);
                        log.info(`Setting color ${hexColor} for button #${event.source.getData()}`)
                        if (cModel.colormap.scale instanceof ContinuousScale)
                            cModel.colormap.scale.setGradientColor(hexColor, event.source.getData());
                        else
                            log.error(`Invalid scale type: ${cModel.colormap.scaleClass}`)
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
                .layoutData(GridDataFactory.swtDefaults().align(SWT.CENTER, SWT.END).create())
                .create(container);

            wizardUI.startValue = WidgetFactory
                .label(SWT.LEFT)
                .text("")
                .layoutData(GridDataFactory.fillDefaults().grab(true, false).create())
                .create(container);
      
            wizardUI.endValue = WidgetFactory
                .label(SWT.RIGHT)
                .text("")
                .layoutData(GridDataFactory.fillDefaults().grab(true, false).create()) // .align(SWT.END, SWT.CENTER)
                .create(container);

            WidgetFactory    
                .label(SWT.CENTER)
                .text("End")
                .layoutData(GridDataFactory.swtDefaults().align(SWT.CENTER, SWT.END).create())
                .create(container);

            // Color scheme default management group
            wizardUI.btnSave2 = createColorSchemeWidgets(container, 5);

            // Gradient management
            wizardUI.startBtn = WidgetFactory
                .button(SWT.PUSH)
                .image(imageRegistry.unknownImage)
                .tooltip("Click to set start color")
                .layoutData(GridDataFactory.swtDefaults().create())
                .onSelect(setColor)
                .create(container);
            wizardUI.startBtn.setData(ContinuousScale.EDGE.START);
            
            wizardUI.gradientLabel = WidgetFactory
                .label(SWT.BORDER)
                .tooltip("click to set middle color position, if enabled")
                .layoutData(GridDataFactory.fillDefaults().span(2, 1).grab(true, false).create())
                .create(container);   
            
            wizardUI.gradientLabel.addMouseListener(MouseListener.mouseDownAdapter(
                (e) => {
                    try {
                        log.trace(`Click received ${e.button == 1 ? "Left" : e.button == 2 ? "Right" : "Other"}-click on ${e.x},${e.y}`);
                        const scale = cModel.colormap.scale;
                        if (scale instanceof ContinuousScale) { /// syntax checking purpose
                            const position = e.x / wizardUI.gradientLabel.getBounds().width;
                            log.trace(`Setting relative middle position at ${position}`);
                            scale.setMiddlePosition(position, false);
                        }
                    } catch (err) {
                        log.error(err.toString())
                    }
                }));

            wizardUI.gradientLabel.addControlListener(ControlListener.controlResizedAdapter(
                (e) => {
                    try {  
                        const bounds = wizardUI.gradientLabel.getBounds();
                        // take into account the border
                        bounds.width += -2;
                        bounds.height += -2;
                        const width = bounds.width;
                        log.debug(`gradientLabel resized: ${bounds.width}x${bounds.height}`);
                        const scale = cModel.colormap.scale;
                        if (scale instanceof ContinuousScale) {
                            wizardUI.gradientLabel.setImage( imageRegistry.getGradientImage(scale.relativeEdges(), bounds) );
                        }
                    } catch (err) {
                        log.error(err.toString())
                    }
                }));
    
            wizardUI.endBtn = WidgetFactory
                .button(SWT.PUSH)
                // need image for correct default size of control
                .image(imageRegistry.unknownImage)
                .tooltip("Click to set end color")
                .layoutData(GridDataFactory.swtDefaults().create())
                .onSelect(setColor)
                .create(container);
            wizardUI.endBtn.setData(ContinuousScale.EDGE.END);

            //FIXME create a container for middle color controls
            const middleGroup = new Composite(container, SWT.NONE);
            RowLayoutFactory.fillDefaults().center(true).applyTo(middleGroup);
            middleGroup.setLayoutData(GridDataFactory.swtDefaults().span(4, 1).create());

            wizardUI.cbMiddleColor = WidgetFactory
                .button(SWT.CHECK)
                .tooltip(`Add a middle color definition`)
                .text("Middle color")
                .onSelect((e) => {
                    if (cModel.colormap.scale instanceof ContinuousScale) {
                        cModel.colormap.scale.enableMiddleColor(wizardUI.cbMiddleColor.getSelection())
                    }})
                .create(middleGroup);
            wizardUI.cbMiddleColor.setSelection(false); 

            wizardUI.middleBtn = WidgetFactory
                .button(SWT.PUSH)
                .image(imageRegistry.unknownImage)
                .tooltip("Click to set middle color")
                .onSelect(setColor)
                .create(middleGroup);
            wizardUI.middleBtn.setEnabled(false); 
            wizardUI.middleBtn.setData(ContinuousScale.EDGE.MIDDLE);

            WidgetFactory
                .label(SWT.NONE)
                .text(" at value:")
                .create(middleGroup);

            wizardUI.middlePosition = WidgetFactory
                .spinner(SWT.BORDER)
                .tooltip("Also click on gradient bar to set position")
                .onSelect((e) => {
                    const scale = cModel.colormap.scale;
                    if (scale instanceof ContinuousScale) {
                        const spinner = wizardUI.middlePosition;
                        const position = spinner.getSelection()/(Math.pow(10, spinner.getDigits()));
                        log.trace(`Setting middle position ${spinner.getSelection()} (=> ${position})`);
                        scale.setMiddlePosition(position, true)
                    } 
                })
                .create(middleGroup);

            // reset to default
            const resetDefaultCB = WidgetFactory
                .button(SWT.CHECK)
                .tooltip("Reset non-matching components to default colors")
                .text("Reset other to default color")
                .onSelect((_) => {cModel.colormap.resetDefault = resetDefaultCB.getSelection();})
                .layoutData(GridDataFactory.fillDefaults().span(4, 1).create())
                .create(container)
            resetDefaultCB.setSelection(cModel.colormap.resetDefault);

            // Preview
            const preview = WidgetFactory
                .group(SWT.NONE)
                .text("Result preview")
                .layoutData(GridDataFactory.fillDefaults().span(4, 1).indent(0, 16).grab(true, true).create())
                .layout(new FillLayout())
                .create(container);

            wizardUI.gradientTable = WidgetFactory
                .table(SWT.SINGLE | SWT.HIDE_SELECTION)
                .background(container.getDisplay().getSystemColor(SWT.COLOR_WIDGET_BACKGROUND))
                .create(preview)        

            pageContinuousColor.setControl(container);
            pageContinuousColor.setPageComplete(cModel.colormap.isApplicable());
            pageContinuousColor.setDescription(`Select start, end and optionally middle colors to define gradient`);
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
        function updateGradientColors(colormap) {
            // No need to use colormap as all except one at most shall be updated
            log.trace(`updateGradientColors update...`)
            const scale = cModel.colormap.scale;
            if (scale instanceof ContinuousScale) { // for IDE type checking mostly
                wizardUI.startBtn.setImage(imageRegistry.getImage(scale.start.color));
                wizardUI.endBtn.setImage(imageRegistry.getImage(scale.end.color));
                wizardUI.cbMiddleColor.setSelection(scale.isMiddleColorEnabled());
                wizardUI.middleBtn.setEnabled(scale.isMiddleColorEnabled());
                log.trace(`middle color ? ${JSON.stringify(scale.middle)}`);
                wizardUI.middleBtn.setImage(imageRegistry.getImage(scale.isMiddleColorEnabled() ? scale.middle.color: undefined));
                log.trace(`gradient update...`);
                const bounds = wizardUI.gradientLabel.getBounds();
                // take into account the border
                bounds.width += -2;
                bounds.height += -2;
                wizardUI.gradientLabel.setImage( imageRegistry.getGradientImage(scale.relativeEdges(), bounds) );
                wizardUI.middlePosition.setEnabled(scale.isMiddleColorEnabled());
                const factor = Math.pow(10, wizardUI.middlePosition.getDigits());
                wizardUI.middlePosition.setSelection(scale.isMiddleColorEnabled() ? Math.round(scale.middle.textAsNumber * factor) : 0); 
            } else {
                log.error(`Scale type invalid: ${scale.name}`)
            }
            log.info("... updating preview colors ...")
            for (const i of wizardUI.gradientTable.getItems()) {
                i.setImage(imageRegistry.getImage(i.getData().color));
            }
            wizardUI.btnSave2.setEnabled(cModel.colormap.isApplicable() && cModel.colormap.scale.isDefined());
            pageContinuousColor.setPageComplete(cModel.colormap.isApplicable() && cModel.colormap.scale.isDefined());
            pageContinuousColor.getWizard().getContainer().updateButtons();
            log.trace(`... updated`);
        }

        try {
            if (visible) {
                cModel.registerModelChangeObserver(updateGradientColors);
                // forcing the scale type if necessary
                cModel.colormap.scaleClass = ContinuousScale;
                const scale = cModel.colormap.scale;
                // Following if Just to avoid TS validation errors (implicit cast)
                if (scale instanceof ContinuousScale) {
                    // recalculating colors and selection
                    scale.resetEdges();
                    // creating the preview labels
                    wizardUI.gradientTable.removeAll();
                    for (const cl of scale.selection) {
                        const item = new TableItem(wizardUI.gradientTable, SWT.NONE);
                        item.setText(cl.text);
                        item.setImage(imageRegistry.unknownImage); //imageRegistry.getImage(cl.color)); FIXME
                        item.setData(cl); // associate to model
                    }
                    wizardUI.startValue.setText(scale.start.text);
                    // wizardUI.startValue.pack();
                    wizardUI.endValue.setText(scale.end.text);
                    // wizardUI.endValue.pack();
                    if (scale.isMiddleColorEnabled()) {
                        const spinner = wizardUI.middlePosition;
                        let exp = Math.log10(scale.end.textAsNumber - scale.start.textAsNumber)-2;
                        exp = exp < 0 ? Math.floor(exp) : Math.ceil(exp);
                        const digits = exp < 0 ? -exp+1 : 0;
                        const limit = exp < 0 ? -exp+4 : exp +1;
                        const factor = Math.pow(10, digits);
                        const pageInc = Math.pow(10, exp);
                        const inc = pageInc/10;
                        log.trace(`delta = ${Math.log10(scale.end.textAsNumber - scale.start.textAsNumber)} Exp = ${exp}. Setting Middle spinner digits to ${digits}`);
                        spinner.setDigits(digits);
                        spinner.setIncrement(inc);
                        spinner.setPageIncrement(pageInc);
                        spinner.setTextLimit(limit)
                        spinner.setMinimum(scale.start.textAsNumber * factor +1);
                        spinner.setMaximum(scale.end.textAsNumber * factor -1);
                        spinner.getParent().pack();
                    }
                    // pageContinuousColor.getControl().pack();
                    updateGradientColors(cModel.colormap);
                } else {
                    log.error(`Scale type invalid: ${cModel.colormap.scale.name}`)
                }
                pageContinuousColor.setTitle(`Continuous color scale for '${cModel.property}'`);

            } else {
                cModel.removeModelChangeObserver(updateGradientColors)
            }
        } catch(err) {
            log.error(err.toString())
        } finally {
            Java.super(pageContinuousColor).setVisible(visible);
        }
    }
});

const WIZARD_SUBCLASS_EXTENSION = {

    performFinish: function() 
    {
        log.trace(`Wizard type ${cModel.colormap.scale.name} : finished`);
        // the whole enchilada is done outside, so this SWT method doesn't have to know about jArchi .ajs script
        return true;
    },

    canFinish: function() 
    {
        const result = cModel.hasProperty // has property selected
            && cModel.colormap.isApplicable()
            && cModel.colormap.scale.isDefined();
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
    /** @type {JavaObject} */
    btnSave1: undefined,
    // ContinuousColorPage
    /** @type {JavaObject} */
    startValue: undefined, 
    /** @type {JavaObject} */
    endValue: undefined,
    /** @type {JavaObject} */
    gradientLabel: undefined,
    /** @type {JavaObject} */
    gradientTable: undefined,
    /** @type {JavaObject} */
    startBtn: undefined,
    /** @type {JavaObject} */
    endBtn: undefined,
    /** @type {JavaObject} */
    middleBtn: undefined,
    /** @type {JavaObject} */
    middlePosition: undefined,
    /** @type {JavaObject} */
    btnSave2: undefined,

    /**
     * @param {ColorModel} model 
     * FIXME embed the ColorModel as local and also the ImageRegistry ?
     */
    execute: function(model) {
        wizardUI.model = model;
        // do something
        return true
    }
};

/** @type {ImageRegistry} */
let imageRegistry; // shared global

/**
 * Execute the Wizard to update colorModel
 * FIXME merge with WizardUI ?
 * @param {{[x:string]: string[]}} properties array of properties with for each the associated labels
 * @param {string} [defaultProperty] the default property name to be selected on the Wizard 1st page
 * @returns {ColorScheme} if Wizard finished, null if cancelled
 */
function wizardExecute(properties, defaultProperty = undefined) 
{
    // FIXME change to a local variable?
    cModel = new ColorModel(properties, defaultProperty);
    const ColorMapWizard = Java.extend(Java.type('org.eclipse.jface.wizard.Wizard'));
    const colorMapWizard = new ColorMapWizard (WIZARD_SUBCLASS_EXTENSION);
    colorMapWizard.setHelpAvailable(false);
    colorMapWizard.addPage(pagePropertySelection);
    colorMapWizard.addPage(pageLabelsSelection);
    colorMapWizard.addPage(pageCategoryColor);
    colorMapWizard.addPage(pageContinuousColor);
    colorMapWizard.setWindowTitle("Property Colormap");
    try {
        // FIXME change to a local variable?
        imageRegistry = new ImageRegistry(40, 16);
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

