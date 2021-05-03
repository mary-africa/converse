/**
 * The main dialogue object interface.
 */
export class Node<Option extends string> {
    constructor (node: Dialogue.Node<Option>);
}

export default class Dialogue <NodeOption extends string> {
    /**
     * action handler when we enter the dialogue
     */
    private onEnter: Function

    /**
     * action handler when exit the dialogue
     */
    private onExit: Function

    constructor(object: Dialogue.Object<NodeOption>, options: { onEnter: Function, onExit: Function });
    next(): Node<NodeOption>
}

export declare namespace Dialogue {
    // Dialogue object as structure in a .ddo file
    export interface Object<NodeOption extends string> {
        start: NodeOption
    
        nodes: {
            [node in NodeOption]: Dialogue.Node<NodeOption>
        }
    }
    
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
