/**
 * Types for JArchi v1.2
 * 
 */

type Selector = string;
type Filter = (e: ArchiConcept & VisualObject ) => boolean;


interface Image {
    width: number;
    height: number;
}

interface Specialization {
    name: string;
    conceptType: string;
    image?: Image;
    delete(): void;
}

interface ArchiConcept {
    readonly id: string;
    type: string;
    name: string;
    documentation: string;
    specialization: string;
    prop(): string[]|undefined;
    prop(key: string, duplicate?: boolean): string|undefined;
    prop(key: string, value: string, duplicate?: boolean): void;
    removeProp(key: string, value?: string): void;
    delete(): void;
    readonly model: Model;
}

interface Folder extends ArchiConcept {
    add(e: Folder|ArchiConcept|ArchimateView): void;
    createFolder(name: string): Folder;
}

interface ArchiElement extends ArchiConcept {
    merge(other: ArchiElement): void;
}

interface JunctionElement extends ArchiElement {
    junctionType: string; // "and", "or" Junction element only
}

interface ArchiRelation extends ArchiConcept {
    source: ArchiElement;
    target: ArchiElement;
    merge(other: ArchiRelation): void;
}

interface AccessRelation extends ArchiRelation {
    accessType: string; // only for type access-relationship
}

interface InfluenceRelation extends ArchiRelation {
    influenceStrength: string; // only for type influence-relationship
}

interface AssociationRelation extends ArchiRelation {
    associationDirected: boolean; // only for type association-relationship
}

interface Rectangle {
    x: number;
    y: number;
    width?: number;
    height?: number;
    get(attr: string): number; // temp support for GraalVm
}

interface ArchimateView extends ArchiConcept {
    viewpoint: string;
    add(element: ArchiElement, x: number, y: number, width: number, height: number, autoNest?: boolean): VisualObject;
    add(relationship: ArchiRelation, source: VisualObject, target: VisualObject): VisualConnection;
    createConnection(vo1: VisualObject, vo2: VisualObject): VisualObject;
    createObject(type: string, x: number, y: number, width: number, height: number, autoNest?: boolean): VisualObject;
    createViewReference(view: ArchimateView, x: number, y: number, width: number, height: number): VisualObject;
    isAllowedConceptForViewpoint(viewpoint: string): boolean;
}

interface Model extends ArchiConcept {
    purpose: string;
    specializations: Specialization[];
    copy(): Model;
    createElement(type: string, name: string, folder?: Folder): ArchiElement;
    createRelationship(type: string, name: string, source: ArchiElement, target: ArchiElement): ArchiRelation;
    createArchimateView(name: string, folder?: Folder): ArchimateView;
    createSketchView(name: string, folder?: Folder): ArchimateView;
    createCanvasView(name: string, folder?: Folder): ArchimateView;
    createImage(filePath: string): Image;
    createSpecialization(name: string, conceptType: string, image?: Image): Specialization;
    findSpecialization(name: string, conceptType: string): Specialization;
    getPath(): string;
    openInUI(): void;
    save(path?: string): void;
    setAsCurrent(): void;
}

interface VisualObject extends ArchiConcept {
    bounds: Rectangle;
    opacity: number;
    outlineOpacity: number;
    fillColor: string;
    fontColor: string;
    lineColor: string;
    fontSize: number;
    fontName: string;
    fontStyle: string;
    gradient: number;
    concept: ArchiConcept;
    image: Image;
    imageSource: number;
    imagePosition: number;
    showIcon: number;
    readonly type: string;
    readonly view: ArchimateView;
    text?: string; // Note only
    textAlignment: number;
    textPosition: number;
    figureType?: number;
    labelExpression: string;
    readonly labelValue: string;
    borderType?: number; //0,1,2 for Note and Group only
    refview?: ArchimateView; // Only for a View Reference
    add(element: ArchiElement, x: number, y: number, width: number, height: number): VisualObject;
    createObject(type: string, x: number, y: number, width: number, height: number): VisualObject;
    createViewReference(view: ArchimateView, x: number, y: number, width: number, height: number): VisualObject;
}

const BORDER = {
    // Note
    DOGEAR: 0, RECTANGLE: 1, NONE: 2, 
    // Group
    TABBED: 0 //, RECTANGLE: 1
};

const TEXT_ALIGNMENT = {LEFT: 1, CENTER: 2, RIGHT: 4};
const TEXT_POSITION = {TOP: 0, CENTER: 1, BOTTOM: 2};
const GRADIENT = {NONE: -1, TOP:0, LEFT:1, RIGHT:2, BOTTOM:3};
const IMAGE_SOURCE = {SPECIALIZATION: 0, CUSTOM: 1};
const IMAGE_POSITION = {
    TOP_LEFT: 0, TOP_CENTER: 1, TOP_RIGHT: 2, 
    MIDDLE_LEFT: 3, MIDDLE_CENTER: 4, MIDDLE_CENTRE: 4, MIDDLE_RIGHT: 5,
    BOTTOM_LEFT: 6, BOTTOM_CENTER: 7, BOTTOM_CENTRE: 7, BOTTOM_RIGHT:8,
    FILL: 9
};
const SHOW_ICON = {IF_NO_IMAGE: 0, ALWAYS: 1, NEVER: 2};

const CONNECTION_STYLE = {
	LINE_SOLID : 0,
	ARROW_FILL_TARGET : 1,      // 1 << 0
    LINE_DASHED : 2,            // 1 << 1
    LINE_DOTTED : 4,            // 1 << 2
    
    ARROW_NONE : 0,
    ARROW_FILL_SOURCE : 8,      // 1 << 3
    ARROW_HOLLOW_TARGET : 16,   // 1 << 4
    ARROW_HOLLOW_SOURCE : 32,   // 1 << 5
    ARROW_LINE_TARGET : 64,     // 1 << 6
    ARROW_LINE_SOURCE : 128     // 1 << 7
};

interface Bendpoint {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    get(attr: string): number; // temp support for GraalVm
}

interface VisualConnection extends VisualObject {
    source: VisualObject;
    target: VisualObject;
    lineWidth: number;
    readonly relativeBendpoints: Bendpoint[];
    addRelativeBendpoint(pos: Bendpoint, ix: number): void;
    deleteAllBendpoints(): void;
    deleteBendpoint(ix: number): void;
    labelVisible: boolean;
}

type ModelObject = (ArchiElement & ArchiRelation & VisualObject & VisualConnection & ArchimateView & Folder);

interface Collection {
    
    parent(selector?: Selector): OCollection;
    parents(selector?: Selector): OCollection;
    find(selector?: Selector):OCollection;
    children(selector?: Selector): OCollection;
    viewRefs(selector?: Selector): OCollection;
    objectRefs(selector?: Selector): OCollection;

    rels(selector?: Selector): OCollection;
    inRels(selector?: Selector): OCollection;
    outRels(selector?: Selector): OCollection;
    ends(selector?:Selector): Collection;
    sourceEnds(selector?: Selector): Collection;
    targetEnds(selector?: Selector): Collection;

    filter(f: Filter|Selector): OCollection;
    not(selector:Selector): OCollection;
    has(selector: Selector): OCollection;
    add(c: Selector|Collection): OCollection;

    attr(key: string): any;
    attr(key: string, value: any): void;
    prop(): string[];
    prop(key: string, duplicate?: boolean): string[];
    prop(key: string, value: string, duplicate?:boolean): void;
    removeProp(key: string): void;

    each(f: (o: ArchiConcept & VisualObject) => void): void;
    clone(): Collection;
    first(): ModelObject | null;
    get(n: number): ModelObject | null;
    size(): number;
    is(selector: Selector): boolean;
    delete(): void;
}

// optional Collection
type OCollection = Collection | null

interface RenderOption {
    scale: number;
    margin: number;
}

interface GlobalModel {
    create(name: string): Model;
    load(path: string): Model;
    isAllowedRelationship(relType: string, sourceType: string, targetType: string): boolean;
    renderViewAsBase64(view: ArchimateView, format: string, options?: RenderOption): string;
    isModelLoaded(model: Model): boolean;
    getLoadedModels(): Model[];
}

interface FileSystem {
    writeFile(path:string, content:string);
}

interface jArchi {
    (selector?: Selector|Collection|ArchiConcept): OCollection;
    model: GlobalModel;
    fs: FileSystem;
}

declare const $: jArchi;
declare const jArchi = $;
declare const selection: OCollection; // current selection
declare const model: Model; // current model

declare function load(path: string): void;
declare function exit(): never;
declare function getArgs(): string[];
declare function exec(...args: string): void;
declare const shell: any;

declare const __DIR__: string;
declare const __FILE__: string;
declare const __LINE__: number;
declare const __SCRIPTS_DIR__: string;

interface Console {
    show(): void;
    hide(): void;
    clear(): void;
    setText(t: string): void;
    setTextColor(r: number, g: number, b: number): void;
    setDefaultTextColor(): void;
    log(...m: any): void;
    error(...m: any): void;
    print(...m: any): void;
    println(...m: any): void;
}

declare const console: Console;

interface Window {
    alert(msg: string): void;
    confirm(msg: string): boolean;
    prompt(msg: string, def: string): string;
    promptOpenFile(options?: OpenFileOptions): string;
    promptOpenDirectory(options?: OpenFileOptions): string;
    promptSaveFile(options?: OpenFileOptions): string;
}

declare const window: Window;

// GraalVM specific

type JavaObject = any;

type JavaClass = any;
// class JavaObject {
// }

// class JavaClass {
//     constructor ();
//     constructor (...args: any);
//     constructor (subclass: {}); 
// }

interface Java {
    type(s: string): JavaClass;
    extend(c: JavaClass): JavaObject;
    super(o: JavaObject): JavaObject;
    from(o: JavaObject): Array<any>;
    to(o: Array[any], j: JavaClass): JavaObject;
    typeName(o: JavaObject): string;
    isType(o: any): boolean;
    isJavaObject(o: any): boolean;
}


// function read(io: string): string;

declare var Java: Java;
// Predefined packages
declare var org: any;
declare var Packages: any;
declare var java: any;
declare var javafx: any;
declare var javax: any;
declare var com: any;
declare var org: any;
declare var edu: any;


interface MessageDialog {
    constructor (shell: JavaObject, title: string, dialogTitleImage: JavaObject, msg: string, dialogImageType: number, dialogButtonLabels: string[], defaultIndex:number);
    openError(shell: JavaObject, title: string, msg: string);
    openInformation(shell: JavaObject, title: string, msg: string);
    openWarning(shell: JavaObject, title: string, msg: string);
    openConfirm(shell: JavaObject, title: string, msg: string): boolean;
    openQuestion(shell: JavaObject, title: string, msg: string): boolean;
    NONE: number = 0;
    ERROR: number = 1;
    INFORMATION: number = 2;
    QUESTION :number = 3;
    WARNING: number = 4;
}