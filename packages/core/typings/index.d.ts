import DDO, { DDO as NsDDO } from './ddo'
import Dialogue, { Dialogue as NsDialogue } from './dialogue'

export default class Agent<Intent extends string, DialogueKey extends string, DialogueMatchRuleType extends string> {
    public static DIALOGUE_GOTO_SELF: NsDialogue.GoTo.Self

    constructor (ddo: DDO<Intent, DialogueKey, AgentRuleType>, config: Partial<Agent.Config<DialogueMatchRuleType>>, context: Agent.Context);
    setMutation<T>(at: Agent.MutationAtType, mutator: Agent.Mutator<T>);
    removeMutation(at: Agent.MutationAtType);
    dialogue<T>(dialogueKey: DialogueKey): Dialogue<T, DialogueMatchRuleType>/* NsDialogue.Object<T, MatchRuleType> */

    // matcher for initial dialogue
    // TODO: maybe remove this?
    setMatcher<K>(
        matcher: (
            input: K, 
            matchMap: { [intent in Intent]: DDO<Intent, Dialogue>['intentions'][intent]['toMatch'] }, 
            _agent: Readonly<{ context: Agent.Context, config: Agent.Config<DialogueMatchRuleType> }>
        ) => null | Intent
    )

    /**
     * Agent's logic for matching the input
     * // this would use the setMatcher to match the inputs
     */
    match<K>(input: K);
}

export declare namespace Agent {
    export interface DialogueMarker<Node extends string> {
        index: number,
        node?: Node,
    }

    interface State<Node, Intent> {
        intent?: Intent | null
    
        /**
         * Identifies staticly defined sequence
         */
        prevSequenceDialogue?: null | DialogueMarker<Node>
    
        /**
         * included `string` to account for dynamic matching of the sequences.
         * This would include using something like seq-${number}-var
         */
        sequenceDialogue?: null | DialogueMarker<Node | string>
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