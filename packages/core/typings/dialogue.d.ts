/**
 * The main dialogue object interface.
 */
export class Node<Option extends string> {
    private options?: NodeOptions
    
    constructor (node: Dialogue.Node<Option>, options?: NodeOptions);
    next(): Node<Option>
}

interface GeneralOptions { 
    onEnter: Function 
    onExit: Function 
    preprocess: <T> (input: string) => T, 
    postprocess: <T> (input: string) => T  
}
interface NodeOptions extends GeneralOptions {}

export default class Dialogue <NodeOption extends string> {
    private options?: Dialogue.Options

    constructor(object: Dialogue.Object<NodeOption>, options?: Dialogue.Options);
}

export declare namespace Dialogue {
    // Dialogue object as structure in a .ddo file
    export interface Object<NodeOption extends string> {
        start: NodeOption
    
        nodes: {
            [node in NodeOption]: Dialogue.Node<NodeOption>
        }
    }

    export interface Options extends GeneralOptions {}
    
    /**
     * Information about the dialog node.
     */
    export interface Node<NodeOption> {
        /**
         * The text to show as text
         */
        text: string
    
        input?: {
            /**
             * Indentifier of the input
             */
            name: string
        }
    
        /**
         * Nature: Static / Dynamic
         * 
         * This can either be the next sequence node to work from
         */
        next?: NodeOption | string
    }
}
