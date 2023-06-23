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
                    Wizard.cm.property = list.getSelection()[0];
                    log.info(`Property ${Wizard.cm.property} selected`);
                    pagePropertySelection.setPageComplete(Wizard.cm.hasProperty); // should never be false
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
            list.setItems(Java.to(Wizard.cm.properties, StringArray));
            list.setLayoutData(new GridData(GridData.FILL_BOTH));
            list.setSelection(list.indexOf(Wizard.cm.property));
    
            pagePropertySelection.setTitle('Select a property');
            pagePropertySelection.setDescription('Among the properties found in current view to be used to colorize the elements');
            pagePropertySelection.setControl(container);
            pagePropertySelection.setPageComplete(Wizard.cm.hasProperty); // should never be false
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

            Wizard.labelsTable = new Table(container, SWT.CHECK | SWT.BORDER | SWT.V_SCROLL | SWT.HIDE_SELECTION);
            Wizard.labelsTable.setLayoutData(new GridData(GridData.FILL_BOTH));
            Wizard.allLabelsCheckbox = new TableItem(Wizard.labelsTable, SWT.NONE);
            Wizard.allLabelsCheckbox.setText('(all labels)');
            Wizard.labelsTable.addSelectionListener(SelectionListener.widgetSelectedAdapter( (e) => {
                try {
                    if (e.detail == SWT.CHECK) {
                        if (e.item == Wizard.allLabelsCheckbox) {
                            const state = Wizard.allLabelsCheckbox.getChecked();
                            Wizard.cm.colormap.setSelection(Wizard.cm.colormap.labels(), state);
                        } else {
                            Wizard.cm.colormap.setSelection([e.item.getText()], e.item.getChecked());
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

            Wizard.btnCategorical = WidgetFactory
                .button(SWT.RADIO)
                .text("Categorical (text)")
                .tooltip("Use a discrete color scheme")
                .onSelect(e => Wizard.cm.colormap.scaleClass = CategoricalScale)
                .create(group);
            // wizardUI.btnCategorical.setData();
            Wizard.btnCategorical.addMouseListener(gotoNextPageOnDblClick())            

            Wizard.btnContinuous = WidgetFactory
                .button(SWT.RADIO)
                .text("Continuous (numeric)")
                .tooltip("Use a continuous (gradient) color scheme (for numeric labels only)")
                .onSelect(e => Wizard.cm.colormap.scaleClass = ContinuousScale)
                .create(group);
            Wizard.btnContinuous.addMouseListener(gotoNextPageOnDblClick());

            WidgetFactory
                .label(SWT.NONE)
                .text("You can choose a continuous scale"+
                    " only if all the selected labels start with or are a number (int or float)")
                .layoutData(GridDataFactory.fillDefaults().span(2, 1).create())
                .create(container);

            pageLabelsSelection.setDescription("Select the labels to colorize, and the type of color scale.");
            pageLabelsSelection.setPageComplete(Wizard.cm.colormap.someIncluded());
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
        log.trace("Showing "+ pageLabelsSelection.getName() +"property: " + Wizard.cm.property);

        /**
         * 
         * @param {ColorMap} colormap 
         */
        function updateLabelCheckMarks(colormap) {
            try {
                assert(colormap != undefined, "Colormap undefined when calling updateLabelCheckMarks")
                log.trace(`${updateLabelCheckMarks.name}: updating check mark states`);
                const table = Wizard.labelsTable;
                const updated = [...colormap.keys()];

                log.trace(`Setting (all labels) state`);
                table.getItem(0).setChecked(Wizard.cm.colormap.allIncluded());

                for (const i of table.getItems()) {
                    const label = i.getText();
                    if (updated.includes(label)) {
                        log.trace(`Syncing '${label}' checkbox with ${JSON.stringify(colormap.get(label))} `);
                        i.setChecked(i.getData().included);
                    }
                }

                const allNumeric = colormap.allIncludedNumeric();
                log.trace(`Enabling btnContinuous = ${allNumeric}`);
                Wizard.btnContinuous.setEnabled(allNumeric);
                if (!allNumeric) 
                    colormap.scaleClass = CategoricalScale;
                Wizard.btnCategorical.setSelection(Wizard.cm.colormap.scaleClass == CategoricalScale);
                Wizard.btnContinuous.setSelection(Wizard.cm.colormap.scaleClass == ContinuousScale);
                pageLabelsSelection.setPageComplete(Wizard.cm.colormap.someIncluded());
            } catch (err) {
                log.error(err.toString())
            }
            log.trace("Updating wizard buttons");
            pageLabelsSelection.getWizard().getContainer().updateButtons();
        }

        try {
            if (visible) {
                Wizard.cm.registerModelChangeObserver(updateLabelCheckMarks);
                const table = Wizard.labelsTable;
                // clean all labels except '(Select all)'
                if (table.getItemCount() > 1) table.remove(1, table.getItemCount()-1);
                // fill up with current labels
                for (const cl of Wizard.cm.colormap.values()) {
                    log.trace(`adding "${cl}"`)
                    let t = new TableItem(table, SWT.NONE);
                    t.setText(cl.text);
                    t.setData(cl);  // associate the ColorLabel
                }
                pageLabelsSelection.setTitle(`Labels selection for '${Wizard.cm.property}'`)
                // set their initial state from model
                updateLabelCheckMarks(Wizard.cm.colormap); 
            } else {
                Wizard.cm.removeModelChangeObserver(updateLabelCheckMarks);
            }
        } catch (err) {   
            log.info(err.toString(), ":",  Java.isJavaObject(err) ? Java.typeName(err): typeof(err) )
        } finally {
            Java.super(pageLabelsSelection).setVisible(visible);
        }
    },


    getNextPage: function ()
	{    	
        if (Wizard.cm.colormap.scale instanceof ContinuousScale) { 
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
        .onSelect((_) => {Wizard.cm.colormap.saveColorScheme()})
        .create(group);

    WidgetFactory
        .button(SWT.PUSH)
        .text("Reload")
        .tooltip("Load default color scheme")
        .layoutData(GridDataFactory.swtDefaults().create())
        .onSelect((_) => {Wizard.cm.colormap.loadColorScheme()})
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
                if (Wizard.catColorTable.getSelectionCount() == 0) {
                    log.debug("No label selected");
                } else {
                    const colorDlg = new CustomColorDialog(container.getShell());
                    try {
                        const selectedColor = colorDlg.open();
                        if (selectedColor) {
                            const hexColor = ImageRegistry.swtRGBToHex(selectedColor);
                            const labels = Java.from(Wizard.catColorTable.getSelection()).map((item) => item.getText())
                            Wizard.cm.colormap.setColor(labels, hexColor);
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

            Wizard.catColorTable = WidgetFactory
                .table(SWT.BORDER | SWT.MULTI | SWT.FULL_SELECTION )
                .create(container); 
            GridDataFactory.defaultsFor(Wizard.catColorTable).align(SWT.FILL, SWT.FILL).grab(true, true).span(1,2).applyTo(Wizard.catColorTable);
            Wizard.catColorTable.addMouseListener(MouseListener.mouseDoubleClickAdapter(setColor));

            WidgetFactory
                .button(SWT.PUSH)
                .text("Set Color")
                .tooltip("Set color of selected labels")
                .layoutData(GridDataFactory.fillDefaults().create())
                .onSelect(setColor)
                .create(container);
        
            Wizard.btnSave1 = createColorSchemeWidgets(container, 2);

            const resetDefaultCB = WidgetFactory
                .button(SWT.CHECK)
                .tooltip("Reset non-matching components to default colors")
                .text("Reset other to default color")
                .onSelect((e) => {Wizard.cm.colormap.resetDefault = resetDefaultCB.getSelection();})
                .create(container)
            resetDefaultCB.setSelection(Wizard.cm.colormap.resetDefault);

            pageCategoryColor.setDescription("Please define the color for each label");
            pageCategoryColor.setControl(container);
            pageCategoryColor.setPageComplete(Wizard.cm.colormap.isApplicable());
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
            for (const item of Wizard.catColorTable.getItems()) {
                const label = item.getText();
                if (colormap.has(label)) {
                    log.debug(`callback: setting color ${item.getData().color} to ${label}`);
                    item.setImage(Wizard.ir.getImage(item.getData().color));
                }
            }
            Wizard.btnSave1.setEnabled(Wizard.cm.colormap.isApplicable());
            pageCategoryColor.setPageComplete(Wizard.cm.colormap.isApplicable());
            pageCategoryColor.getWizard().getContainer().updateButtons();
        }
        
        try {
            if (visible) {
                Wizard.cm.registerModelChangeObserver(updateColorImages);
                // FIXME move to previous page when deciding the scaleClass?
                Wizard.catColorTable.removeAll();
                for (const cl of Wizard.cm.colormap.selection) {
                    let item = new TableItem(Wizard.catColorTable, SWT.NONE);
                    item.setText(cl.text);
                    item.setData(cl);
                };
                updateColorImages(Wizard.cm.colormap)
                pageCategoryColor.setTitle(`Labels colors for '${Wizard.cm.property}'`);
            } else {
                Wizard.cm.removeModelChangeObserver(updateColorImages);
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
                        if (Wizard.cm.colormap.scale instanceof ContinuousScale)
                            Wizard.cm.colormap.scale.setGradientColor(hexColor, event.source.getData());
                        else
                            log.error(`Invalid scale type: ${Wizard.cm.colormap.scaleClass}`)
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

            Wizard.startValue = WidgetFactory
                .label(SWT.LEFT)
                .text("")
                .layoutData(GridDataFactory.fillDefaults().grab(true, false).create())
                .create(container);
      
            Wizard.endValue = WidgetFactory
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
            Wizard.btnSave2 = createColorSchemeWidgets(container, 5);

            // Gradient management
            Wizard.startBtn = WidgetFactory
                .button(SWT.PUSH)
                .image(Wizard.ir.unknownImage)
                .tooltip("Click to set start color")
                .layoutData(GridDataFactory.swtDefaults().create())
                .onSelect(setColor)
                .create(container);
            Wizard.startBtn.setData(ContinuousScale.EDGE.START);
            
            Wizard.gradientLabel = WidgetFactory
                .label(SWT.BORDER)
                .tooltip("click to set middle color position, if enabled")
                .layoutData(GridDataFactory.fillDefaults().span(2, 1).grab(true, false).create())
                .create(container);   
            
            Wizard.gradientLabel.addMouseListener(MouseListener.mouseDownAdapter(
                (e) => {
                    try {
                        log.trace(`Click received ${e.button == 1 ? "Left" : e.button == 2 ? "Right" : "Other"}-click on ${e.x},${e.y}`);
                        const scale = Wizard.cm.colormap.scale;
                        if (scale instanceof ContinuousScale) { /// syntax checking purpose
                            const position = e.x / Wizard.gradientLabel.getBounds().width;
                            log.trace(`Setting relative middle position at ${position}`);
                            scale.setMiddlePosition(position, false);
                        }
                    } catch (err) {
                        log.error(err.toString())
                    }
                }));

            Wizard.gradientLabel.addControlListener(ControlListener.controlResizedAdapter(
                (e) => {
                    try {  
                        const bounds = Wizard.gradientLabel.getBounds();
                        // take into account the border
                        bounds.width += -2;
                        bounds.height += -2;
                        const width = bounds.width;
                        log.debug(`gradientLabel resized: ${bounds.width}x${bounds.height}`);
                        const scale = Wizard.cm.colormap.scale;
                        if (scale instanceof ContinuousScale) {
                            Wizard.gradientLabel.setImage( Wizard.ir.getGradientImage(scale.relativeEdges(), bounds) );
                        }
                    } catch (err) {
                        log.error(err.toString())
                    }
                }));
    
            Wizard.endBtn = WidgetFactory
                .button(SWT.PUSH)
                // need image for correct default size of control
                .image(Wizard.ir.unknownImage)
                .tooltip("Click to set end color")
                .layoutData(GridDataFactory.swtDefaults().create())
                .onSelect(setColor)
                .create(container);
            Wizard.endBtn.setData(ContinuousScale.EDGE.END);

            //FIXME create a container for middle color controls
            const middleGroup = new Composite(container, SWT.NONE);
            RowLayoutFactory.fillDefaults().center(true).applyTo(middleGroup);
            middleGroup.setLayoutData(GridDataFactory.swtDefaults().span(4, 1).create());

            Wizard.cbMiddleColor = WidgetFactory
                .button(SWT.CHECK)
                .tooltip(`Add a middle color definition`)
                .text("Middle color")
                .onSelect((e) => {
                    if (Wizard.cm.colormap.scale instanceof ContinuousScale) {
                        Wizard.cm.colormap.scale.enableMiddleColor(Wizard.cbMiddleColor.getSelection())
                    }})
                .create(middleGroup);
            Wizard.cbMiddleColor.setSelection(false); 

            Wizard.middleBtn = WidgetFactory
                .button(SWT.PUSH)
                .image(Wizard.ir.unknownImage)
                .tooltip("Click to set middle color")
                .onSelect(setColor)
                .create(middleGroup);
            Wizard.middleBtn.setEnabled(false); 
            Wizard.middleBtn.setData(ContinuousScale.EDGE.MIDDLE);

            WidgetFactory
                .label(SWT.NONE)
                .text(" at value:")
                .tooltip("Also click on gradient bar to set position")
                .create(middleGroup);

            Wizard.middlePosition = WidgetFactory
                .spinner(SWT.BORDER)
                .tooltip("Also click on gradient bar to set position")
                .onSelect((e) => {
                    const scale = Wizard.cm.colormap.scale;
                    if (scale instanceof ContinuousScale) {
                        const spinner = Wizard.middlePosition;
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
                .onSelect((_) => {Wizard.cm.colormap.resetDefault = resetDefaultCB.getSelection();})
                .layoutData(GridDataFactory.fillDefaults().span(4, 1).create())
                .create(container)
            resetDefaultCB.setSelection(Wizard.cm.colormap.resetDefault);

            // Preview
            const preview = WidgetFactory
                .group(SWT.NONE)
                .text("Result preview")
                .layoutData(GridDataFactory.fillDefaults().span(4, 1).indent(0, 16).grab(true, true).create())
                .layout(new FillLayout())
                .create(container);

            Wizard.gradientTable = WidgetFactory
                .table(SWT.SINGLE | SWT.HIDE_SELECTION)
                .background(container.getDisplay().getSystemColor(SWT.COLOR_WIDGET_BACKGROUND))
                .create(preview)        

            pageContinuousColor.setControl(container);
            pageContinuousColor.setPageComplete(Wizard.cm.colormap.isApplicable());
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
            const scale = Wizard.cm.colormap.scale;
            if (scale instanceof ContinuousScale) { // for IDE type checking mostly
                Wizard.startBtn.setImage(Wizard.ir.getImage(scale.start.color));
                Wizard.endBtn.setImage(Wizard.ir.getImage(scale.end.color));
                Wizard.cbMiddleColor.setSelection(scale.isMiddleColorEnabled());
                Wizard.middleBtn.setEnabled(scale.isMiddleColorEnabled());
                log.trace(`middle color ? ${JSON.stringify(scale.middle)}`);
                Wizard.middleBtn.setImage(Wizard.ir.getImage(scale.isMiddleColorEnabled() ? scale.middle.color: undefined));
                log.trace(`gradient update...`);
                const bounds = Wizard.gradientLabel.getBounds();
                // take into account the border
                bounds.width += -2;
                bounds.height += -2;
                Wizard.gradientLabel.setImage( Wizard.ir.getGradientImage(scale.relativeEdges(), bounds) );
                Wizard.middlePosition.setEnabled(scale.isMiddleColorEnabled());
                const factor = Math.pow(10, Wizard.middlePosition.getDigits());
                const pos = scale.isMiddleColorEnabled() ? Math.round(scale.middle.textAsNumber * factor) : 0;
                if (Wizard.middlePosition.getSelection() != pos)
                    // change the value only if there is a diff (ie: definition of position by clicking on gradient)
                    // otherwise reselect in box the full content, and so cannot edit digit per digit in spinner
                    Wizard.middlePosition.setSelection(pos); 
            } else {
                log.error(`Scale type invalid: ${scale.name}`)
            }
            log.info("... updating preview colors ...")
            for (const i of Wizard.gradientTable.getItems()) {
                i.setImage(Wizard.ir.getImage(i.getData().color));
            }
            Wizard.btnSave2.setEnabled(Wizard.cm.colormap.isApplicable() && Wizard.cm.colormap.scale.isDefined());
            pageContinuousColor.setPageComplete(Wizard.cm.colormap.isApplicable() && Wizard.cm.colormap.scale.isDefined());
            pageContinuousColor.getWizard().getContainer().updateButtons();
            log.trace(`... updated`);
        }

        try {
            if (visible) {
                Wizard.cm.registerModelChangeObserver(updateGradientColors);
                // forcing the scale type if necessary
                Wizard.cm.colormap.scaleClass = ContinuousScale;
                const scale = Wizard.cm.colormap.scale;
                // Just to avoid TS validation errors (implicit cast)
                if (scale instanceof ContinuousScale) {
                    // recalculating colors and selection
                    scale.resetEdges();
                    // creating the preview labels
                    Wizard.gradientTable.removeAll();
                    for (const cl of scale.selection) {
                        const item = new TableItem(Wizard.gradientTable, SWT.NONE);
                        item.setText(cl.text);
                        item.setImage(Wizard.ir.unknownImage); //ctxt.ir.getImage(cl.color)); FIXME
                        item.setData(cl); // associate to model
                    }
                    Wizard.startValue.setText(scale.start.text);
                    Wizard.endValue.setText(scale.end.text);
                    
                    // calculating for Spinner parameters depending on start and end values 
                    const spinner = Wizard.middlePosition;
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
                    updateGradientColors(Wizard.cm.colormap);
                } else {
                    log.error(`Scale type invalid: ${Wizard.cm.colormap.scale.name}`)
                }
                pageContinuousColor.setTitle(`Continuous color scale for '${Wizard.cm.property}'`);

            } else {
                Wizard.cm.removeModelChangeObserver(updateGradientColors)
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
        log.trace(`Wizard type ${Wizard.cm.colormap.scale.name} : finished`);
        // the whole enchilada is done outside, so this SWT method doesn't have to know about jArchi .ajs script
        return true;
    },

    canFinish: function() 
    {
        const result = Wizard.cm.hasProperty // has property selected
            && Wizard.cm.colormap.isApplicable()
            && Wizard.cm.colormap.scale.isDefined();
        return result;
    }
}


/**
 * Store the shared variables between wizards pages and inside a page, as not possible to add attributes to 
 * an extended JavaClass instance in JS GraalVM (allows only overridden method)
 * Store also reference to the ColorModel and ImageRegistry
 */
const Wizard = {
    /**
     * The ImageRegistry object
     * @type {ImageRegistry}
     */
    ir: new ImageRegistry(40, 16), 
    /**
     * the ColorModel object
     * @type {ColorModel}
     */
    cm: undefined,

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
     * Execute the Wizard to update colorModel
     * @param {{[x:string]: string[]}} properties array of properties with for each the associated labels
     * @param {string} [defaultProperty] the default property name to be selected on the Wizard 1st page
     * @returns {ColorScheme} if Wizard finished, null if cancelled
     */
    execute: function (properties, defaultProperty = undefined) 
    {
        Wizard.cm = new ColorModel(properties, defaultProperty);
        const ColorMapWizard = Java.extend(Java.type('org.eclipse.jface.wizard.Wizard'));
        const colorMapWizard = new ColorMapWizard (WIZARD_SUBCLASS_EXTENSION);
        colorMapWizard.setHelpAvailable(false);
        colorMapWizard.addPage(pagePropertySelection);
        colorMapWizard.addPage(pageLabelsSelection);
        colorMapWizard.addPage(pageCategoryColor);
        colorMapWizard.addPage(pageContinuousColor);
        colorMapWizard.setWindowTitle("Property Colormap");
        try {
            const JWizardDialog = Java.type('org.eclipse.jface.wizard.WizardDialog');
            const wizardDialog = new JWizardDialog(shell, colorMapWizard);
            const FINISH = 0, CANCEL = 1;
            log.trace("Ready to open")
            if (wizardDialog.open() == FINISH) {
                return Wizard.cm.colormap.getColorScheme();
            } else {
                return null
            }
        } finally {
            colorMapWizard.dispose();
            Wizard.ir.dispose();        
        }
    }

};

