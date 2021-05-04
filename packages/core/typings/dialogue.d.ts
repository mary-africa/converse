/**
 * The main dialogue object interface.
 */
export class Node<Option extends string> {
    private options?: Node.Options
    
    constructor (node: Dialogue.Node<Option>, options?: Node.Options);
    
    setMutatorId(at: Node.MutationType, id: string)
    removeMutator(at: Node.MutationType)
    
    setActionId(on: Node.ActionType, id: string)
    removeActionId(on: Node.ActionType)

    next<T>(input?: T): Node<Option>
}

interface GeneralOptions {}


export default class Dialogue <NodeOption extends string> {
    private options?: Dialogue.Options

    private mutationIds?: {
        [mutatorId in Node.MutatorId]: Node.Mutator
    }

    private actionIds?: {
        [mutatorId in Node.ActionId]: Node.Action
    }

    constructor(object: Dialogue.Object<NodeOption>, options?: Dialogue.Options);

    /**
     * Creates a function that mutates the 
     * string that enters the dialogue
     * @returns mutatorId
     */
    setMutation(at: Dialogue.MutationType, modification: Dialogue.Mutator): string;

    /**
     * Removes the mutation
     */
    removeMutation(at: string);

    /**
     * Action that should execute when and action is triggered
     * @returns actionId
     */
    setAction(on: Dialogue.ActionType, action: Dialogue.Action)

    /**
     * Removes an action
     */
    removeAction(on: string)

    // Dialogue NODE related operations
    // ------------------------------------

    /**
     * Mutation
     */
    setNodeMutation(node: NodeOption, at: Node.MutationType, mutator: Node.Mutator): string;
    removeNodeMutation(mutatorId: string)

    /**
     * Actions
     */
    setNodeAction(node: NodeOption, on: Node.ActionType, action: Node.Action): string;
    removeNodeMutation(node: NodeOption, at: Node.MutationType)
}

declare namespace Node {
    type ActionId = string
    type ActionType = 'enter' | 'exit'
    type Action = <NodeOption extends string> (dialogueContext: Dialogue.Context<NodeOption>) => Promise<void>

    type MutatorId = string
    type MutationType = 'preprocess' | 'postprocess'
    type Mutator = <T> (input: string) => T

    interface Options extends GeneralOptions {
        /**
         * Identifies what should be done 
         * when entering a node / dialog
         */
        actionIds: {
            [actionType in ActionType]: string
        }

        mutatorIds: {
            [mutationType in MutationType]: string
        }
    }
}

export declare namespace Dialogue {
    type ActionType = 'enter' | 'exit'
    type Action = () => Promise<void>

    // actions responsible in modifying the data shape
    type MutationType = 'preprocess' | 'postprocess'
    type Mutator = <T> (input: string) => T

    interface Context<NodeOption extends string> {
        /**
         * Inputs of all the nodes in the dialogues
         */
        inputs: {
            [node in NodeOption]: any
        }
    }

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
