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

export default class Dialogue <NodeOption extends string, MatchRuleType extends string> {
    private options: Dialogue.Options
    private readonly ac: Agent.Context
    private readonly self: Dialogue.Object<NodeOption>

    private mutators: { [mutatorId in Dialogue.MutationType]?: Dialogue.Mutator }
    private actions: { [action in Dialogue.ActionType]?: Dialogue.Action }

    private actionMutationIds: { [mutatorId in Node.MutatorId]?: Node.Mutator }
    private nodeActionIds: { [actionId in Node.ActionId]?: Node.Action }

    constructor(object: Dialogue.Object<NodeOption, MatchRuleType>, agentContext: Agent.Context, options?: Dialogue.Options);

    // DIALOGUE related operations
    // ------------------------------------

    /**
     * Creates a function that mutates the 
     * string that enters the dialogue
     * @returns mutatorId
     */
    setMutation<T>(at: Dialogue.MutationType, mutator: Dialogue.Mutator<T>): Dialogue<NodeOption, MatchRuleType>;

    /**
     * Removes the mutation
     */
    removeMutation(at: Dialogue.MutationType);

    /**
     * Action that should execute when and action is triggered
     */
    setAction<T>(on: Dialogue.ActionType, action: Dialogue.Action<T>): Dialogue<NodeOption, MatchRuleType>;

    /**
     * Removes an action
     */
    removeAction(on: Dialogue.ActionType);

    // Dialogue NODE related operations
    // ------------------------------------

    /**
     * Mutation
     */
    setNodeMutation<T>(node: NodeOption, at: Node.MutationType, mutator: Node.Mutator<T>): string;
    removeNodeMutation(mutatorId: Node.MutatorId)

    /**
     * Actions
     */
    setNodeAction(node: NodeOption, on: Node.ActionType, action: Node.Action<NodeOption>): string;
    removeNodeAction(actionId: Node.ActionId)

    // matcher for initial dialogue
    setMatcher<K, T>(matchRule: MatchRuleType, matcher: (input: K, options: T, context: Agent.Context) => null | NodeOption): Dialogue<NodeOption, MatchRuleType>
}

export declare namespace Node {
    type ActionId = { on: ActionType, key: string }
    type ActionType = 'enter' | 'exit'
    // FIXME: fixing the data
    type Action <NodeOption extends string> = (dialogueContext: Dialogue.Context<NodeOption>) => Promise<void>

    type MutatorId = { at: MutationType, key: string }
    type MutationType = 'preprocess' | 'postprocess'
    type Mutator<T> = (input: string) => T

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
    type Mutator<T> = (input: string) => T

    interface Context<NodeOption extends string> {
        /**
         * Inputs of all the nodes in the dialogues
         */
        inputs: {
            [node in NodeOption]?: any
        }

        agentContext: Agent.Context
    }

    interface Base {
        actions?: {
            [on in ActionType]?: string
        }

        mutations?: {
            [at in MutationType]?: string
        }
    }

    // Dialogue object as structure in a .ddo file
    export interface Object<NodeOption extends string, MatchRuleType extends string> extends Base {
        start: NodeOption
    
        nodes: {
            [node in NodeOption]: Node<NodeOption, MatchRuleType>
        }
    }

    export interface Options extends GeneralOptions {}

    enum GoTo {
        /**
         * This would point the node
         */
        Self = 0
    }
    
    /**
     * Information about the dialog node.
     */
    export interface Node<NodeOption extends string, MatchRuleType extends string> extends Base {
        /**
         * The text to show as text
         */
        text: string

        /**
         * Function that matches the node to the next node
         * // DEFAULT null (if null then go to immediate?)
         */
        matcher?: MatchRuleType

        /**
         * Customs 
         */
        with?: { [x: string]: any }

        // go to the next item
        immediate?: boolean
    
        /**
         * Nature: Static / Dynamic
         * 
         * This can either be the next sequence node to work from
         * 
         * To enforce dynamic node: $
         * enforce after postprocess mutation
         * 
         * Returns:
         *  NodeOption - static node identifier
         *  string - dynamic node identifier w/ $
         *  undefined | null - close (end the dialogue)
         *  GoTo.Self (boolean) - this (but dont expect message printing)
         */
        goTo?: NodeOption | string | GoTo.Self | null
    }
}
