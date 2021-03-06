import ConverseDialogue, { Node, Dialogue } from './dialogue'

declare class ConverseAgent<Intent extends string, DialogueKey extends string, DialogueMatchRuleType extends string, AgentExtendedConfig> {
    public static DIALOGUE_GOTO_SELF: Dialogue.GoTo.Self
    protected mutators: { 
        [mutatorId in Agent.MutationAtType]?: Agent.Mutator<any>
    }

    protected readonly config: Agent.Config<DialogueMatchRuleType, AgentExtendedConfig>;
    protected readonly context: Agent.Context;

    /**
     * This stores the dialogue objects
     */
    protected dialogues: {
        // FIXME: remove the 'any' type param
        [nodes in DialogueKey]: ConverseDialogue<DialogueKey, string, DialogueMatchRuleType>
    }

    protected readonly intentions: { [intent in Intent]: DDO.Item<DialogueKey, any> }
    protected readonly fallbackText: string

    /**
     * This would contain the matcher Function needed
     * to match the items in the intentions object 
     */
    protected matcher?: <T>(
        input: T, 
        matchMap: {
            intent: Intent,
            toMatch: DDO.Item<DialogueKey, T>['toMatch']
        }[],
        ...args: any | undefined) => null | Intent

    constructor (ddo: DialogueDefinition<Intent, DialogueKey, DialogueMatchRuleType>, config: Partial<Agent.Config<DialogueMatchRuleType, AgentExtendedConfig>>, context: Agent.Context);
    setMutation<T>(at: Agent.MutationAtType, mutator: Agent.Mutator<T>);
    removeMutation(at: Agent.MutationAtType);
    dialogue<T extends string>(dialogueKey: DialogueKey): ConverseDialogue<DialogueKey, T, DialogueMatchRuleType>
    
    setMatcher<K>(
        matcher: (
            input: K, 
            matchMap: Array<{ intent: Intent, toMatch: DialogueDefinition<Intent, DialogueKey, DialogueMatchRuleType>['intentions'][Intent]['toMatch']}>, 
            _agent: Readonly<{ context: Agent.Context, config: Agent.Config<DialogueMatchRuleType, AgentExtendedConfig> }>
        ) => Promise<null | Intent>
    )
    
    chat <T extends string, AT, MatchCallback extends Function>(
        message: string, 
        state?: Agent.State<T, Intent>,
        use?: {actionData?: AT, matchCallback?: MatchCallback}
    ): Promise<{output: string, state: Agent.State<T, Intent>}>

    /**
     * Agent's logic for matching the input
     * // this would use the setMatcher to match the inputs
     */
    protected match<K>(input: K);
    protected getMatchItemList<T>(): Array<{ 
        intent: Intent,
        toMatch: DDO.Item<DialogueKey, T>['toMatch']
    }>;
    protected exactMatch<T>(
        mutatedInput: T, 
        matchList: { 
            intent: Intent,
            toMatch: DDO.Item<DialogueKey, T>['toMatch']
        }[]
    ): null | Intent;
}

export default ConverseAgent

export declare namespace Agent {
    export interface DialogueMarker<Node extends string> {
        index: number,
        node?: Node,
    }
    interface State<Node extends string, Intent> {
        intent?: Intent | null

        /**
         * included `string` to account for dynamic matching of the sequences.
         * This would include using something like seq-${number}-var
         */
        sequenceDialogue?: null | DialogueMarker<Node>
    }
    
    // actions responsible in modifying the data shape
    // ----------------------------------------------
    type MutationAtType = 'preprocess' | 'postprocess'
    type Mutator<T> =  (input: string) => T


    export type Config<MatchRuleType extends string, AgentExtendedConfig> = BaseConfig<MatchRuleType> & AgentExtendedConfig 
    interface BaseConfig<MatchRuleType extends string> {
        /**
         * Rules used in decision points
         */
        matchRules?: MatchRuleType[]

        /**
         * Makes [exact] string matching 
         * in decision points
         * 
         * default: true
         * FUTURE-FEAT: if false, then matchRules 'MUST' exist
         */
        enableExactMatchRule: boolean
    }

    export interface Context {
        [id: string]: any
    }

    export interface Actions<MatchRuleType extends string> {
        selectors: {
            [selector in MatchRuleType]?: (message: string) => void
        }
    }
}


type MultValType<T> = T 

/**
 * Main definition of the dialogue
 */
export declare interface DialogueDefinition<
    IntentType extends string,
    DialogueKey extends DDO.DialogueKeyType,
    MatchRuleType extends string
> {
    /**
     * Dialogues
     */
    dialogues: { [key in DialogueKey]: Dialogue.Object<string, MatchRuleType> }
    
    /**
     * Intentions
     */
    intentions: { [intent in IntentType]: DDO.Item<DialogueKey, any> }

    /**
     * Response Text for when there are no intentions matched
     */
    fallbackText: string
}

export declare namespace DDO {
    /**
     * Item description for the DDO
     */
    interface Item<DialogueKey extends string | number, T> {
        /**
         * This is skipped when there is dialogue
         */
        response?: string
    
        /**
         * string(s) to match the intention
         */
        toMatch: T[] | T
    
        /**
         * Dialogue keys from the dialogue object
         */
        dialogueKey?: MultValType<DialogueKey>
    }

    /**
     * Expected Key type
     */
    type DialogueKeyType = string | number
    
    type ItemResponse<DialogueKey extends DialogueKeyType, T> = Omit<Item<DialogueKey, T>, "dialogueKey">
    type ItemDKey<DialogueKey extends DialogueKeyType, T> = Omit<Item<DialogueKey, T>, "response">
}

