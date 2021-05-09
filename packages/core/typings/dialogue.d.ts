import ConverseAgent, { Agent } from '.'

/**
 * General options exposed for the rest of the interfaces
 */
interface GeneralOptions {
    verbose: boolean
}

/**
 * The main dialogue object interface.
 */
export declare class BaseNode<Option extends string, MatchRuleType extends string> {
    private readonly options: Node.Options

    constructor (node: Dialogue.Node<Option, MatchRuleType>, options?: Node.Options);
    get object(): Dialogue.Node<Option, MatchRuleType>;

    setMutatorId(at: Node.MutationType, id: string)
    removeMutator(at: Node.MutationType)
    
    setActionId(on: Node.ActionType, id: string)
    removeActionId(on: Node.ActionType)

    mutateId(at: Node.MutationType): string
    actionId(on: Node.ActionType): string

    next($?: string): Option | null | Dialogue.GoTo.Self
}


declare class ConverseDialogue<DialogueKey extends string, NodeOption extends string, MatchRuleType extends string> {
    constructor (id: DialogueKey, object: Dialogue.Object<NodeOption, MatchRuleType>, agentContext: Agent.Context, options?: Partial<Dialogue.Options>)
    // DIALOGUE related operations
    // ------------------------------------

    /**
     * Creates a function that mutates the 
     * string that enters the dialogue
     * @returns mutatorId
     */
    setMutation<T>(at: Dialogue.MutationType, mutator: Dialogue.Mutator<T>): ConverseDialogue<DialogueKey, NodeOption, MatchRuleType>;

    /**
     * Removes the mutation
     */
    removeMutation(at: Dialogue.MutationType);

    /**
     * Action that should execute when and action is triggered
     */
    setAction(on: Dialogue.ActionType, action: Dialogue.Action): ConverseDialogue<DialogueKey, NodeOption, MatchRuleType>;

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
    setMatcher<K, T>(matchRule: MatchRuleType, matcher: Dialogue.MatchFunction<K, T, NodeOption>): ConverseDialogue<DialogueKey, NodeOption, MatchRuleType>

    /**
     * agent reponder
     * @param message 
     * @param state 
     */
    respond<AgentMutatedType>(
        message: AgentMutatedType, 
        node: NodeOption | null
    ): {
        output: string, 
        node: NodeOption | string | null | number
    }
}

export default ConverseDialogue

export declare namespace Node {
    export type ActionId = { on: ActionType, key: string }
    export type ActionType = 'enter' | 'exit'
    export type Action <NodeOption extends string> = (dialogueContext: Dialogue.Context<NodeOption>) => Promise<void>

    export type MutatorId = { at: MutationType, key: string }
    export type MutationType = 'preprocess' // | 'postprocess'
    export type Mutator<T> = <DialogueMutatedType>(input: DialogueMutatedType) => T

    export interface Options extends GeneralOptions {}
}

/**
 * [namespace] Dialogue
 */
export declare namespace Dialogue {
    export type MatchFunction<K, T, NodeOption> = (input: K, options: T, context: Agent.Context) => null | string | Dialogue.GoTo | NodeOption
    export type ActionType = 'enter' | 'exit'
    export type Action = () => Promise<void>

    // actions responsible in modifying the data shape
    export type MutationType = 'preprocess' // | 'postprocess'
    export type Mutator<T> = <AgentMutatedType>(input: AgentMutatedType) => T

    export interface NodeMarker<Node> {
        node: Node,
    }

    export interface Context<NodeOption extends string> {
        /**
         * Inputs of all the nodes in the dialogues
         */
        inputs: {
            [node in NodeOption]?: any
        }

        agentContext: Agent.Context
    }

    export interface Base {
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

    export interface Options extends GeneralOptions {
        id: string
    }

    export enum GoTo {
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
