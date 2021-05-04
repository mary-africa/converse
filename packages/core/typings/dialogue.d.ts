import { Agent } from '.'

/**
 * The main dialogue object interface.
 */
export class Node<Option extends string> {
    private options: Node.Options
    
    constructor (node: Dialogue.Node<Option>, options?: Node.Options);

    setMutatorId(at: Node.MutationType, id: string)
    removeMutator(at: Node.MutationType)
    
    setActionId(on: Node.ActionType, id: string)
    removeActionId(on: Node.ActionType)

    getStaticInput<T>(input: T): Option 
}

interface GeneralOptions {
    verbose: boolean
}

export default class Dialogue <NodeOption extends string> {
    private options: Dialogue.Options
    private ac: Agent.Context
    private self: Dialogue.Object<NodeOption>

    private mutators: { [mutatorId in Dialogue.MutationType]?: Dialogue.Mutator }
    private actions: { [action in Dialogue.ActionType]?: Dialogue.Action }

    private actionMutationIds: { [mutatorId in Node.MutatorId]?: Node.Mutator }
    private nodeActionIds: { [actionId in Node.ActionId]?: Node.Action }

    constructor(object: Dialogue.Object<NodeOption>, agentContext: Agent.Context, options?: Dialogue.Options);

    // DIALOGUE related operations
    // ------------------------------------

    /**
     * Creates a function that mutates the 
     * string that enters the dialogue
     * @returns mutatorId
     */
    setMutation(at: Dialogue.MutationType, mutator: Dialogue.Mutator);

    /**
     * Removes the mutation
     */
    removeMutation(at: Dialogue.MutationType);

    /**
     * Action that should execute when and action is triggered
     */
    setAction(on: Dialogue.ActionType, action: Dialogue.Action);

    /**
     * Removes an action
     */
    removeAction(on: Dialogue.ActionType);

    // Dialogue NODE related operations
    // ------------------------------------

    /**
     * Mutation
     */
    setNodeMutation(node: NodeOption, at: Node.MutationType, mutator: Node.Mutator): string;
    removeNodeMutation(mutatorId: Node.MutatorId)

    /**
     * Actions
     */
    setNodeAction(node: NodeOption, on: Node.ActionType, action: Node.Action): string;
    removeNodeAction(actionId: Node.ActionId)
}

export declare namespace Node {
    type ActionId = { on: ActionType, key: string }
    type ActionType = 'enter' | 'exit'
    type Action = <NodeOption extends string> (dialogueContext: Dialogue.Context<NodeOption>) => Promise<void>

    type MutatorId = { at: MutationType, key: string }
    type MutationType = 'preprocess' | 'postprocess'
    type Mutator = <T> (input: string) => T

    interface Options extends GeneralOptions {
        /**
         * Identifies what should be done 
         * when entering a node / dialog
         */
        actionIds: {
            [actionType in ActionType]?: string
        }

        mutatorIds: {
            [mutationType in MutationType]?: string
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
            [node in NodeOption]?: any
        }

        agentContext: Agent.Context
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
