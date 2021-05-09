import ConverseDialogue from './dialogue'

declare class ConverseAgent<Intent extends string, DialogueKey extends string, DialogueMatchRuleType extends string> {
    public static DIALOGUE_GOTO_SELF: Dialogue.GoTo.Self

    constructor (ddo: DialogueDefinition<Intent, DialogueKey, DialogueMatchRuleType>, config: Partial<Agent.Config<DialogueMatchRuleType>>, context: Agent.Context);
    setMutation<T>(at: Agent.MutationAtType, mutator: Agent.Mutator<T>);
    removeMutation(at: Agent.MutationAtType);
    dialogue<T>(dialogueKey: DialogueKey): ConverseDialogue<DialogueKey, T, DialogueMatchRuleType>
    setMatcher<K>(
        matcher: (
            input: K, 
            matchMap: { [intent in Intent]: DialogueDefinition<Intent, DialogueKey, DialogueMatchRuleType>['intentions'][intent]['toMatch'] }, 
            _agent: Readonly<{ context: Agent.Context, config: Agent.Config<DialogueMatchRuleType> }>
        ) => null | Intent
    )

    /**
     * Agent's logic for matching the input
     * // this would use the setMatcher to match the inputs
     */
    match<K>(input: K);
}

export default ConverseAgent

export declare namespace Agent {
    export interface DialogueMarker<Node extends string> {
        index: number,
        node?: Node,
    }
    interface State<Node, Intent> {
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

    export interface Config<MatchRuleType extends string> {
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

