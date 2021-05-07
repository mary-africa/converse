import DDO, { DDO as NsDDO } from './ddo'
import Dialogue, { Dialogue as NsDialogue } from './dialogue'

export default class Agent<Intent extends string, DialogueKey extends string, DialogueMatchRuleType extends string> {
    constructor (ddo: DDO<Intent, DialogueKey, AgentRuleType>, config: Partial<Agent.Config<DialogueMatchRuleType>>, context: Agent.Context);
    setMutation(at: Agent.MutationAtType, mutator: Agent.Mutator);
    removeMutation(at: Agent.MutationAtType);
    dialogue<T>(dialogueKey: DialogueKey): Dialogue<T, DialogueMatchRuleType>/* NsDialogue.Object<T, MatchRuleType> */

    // matcher for initial dialogue
    // TODO: maybe remove this?
    setMatcher<K, T>(
        matcher: (
            input: K, 
            matchMap: { [intent in Intent]: DDO<Intent, Dialogue, AgentRuleType>['intentions'][intent]['toMatch'] }, 
            _agent: Readonly<{ context: Agent.Context, config: Agent.Config<DialogueMatchRuleType> }>
        ) => null | Intent
    )

    /**
     * Agent's logic for matching the input
     * // this would use the setMatcher to match the inputs
     */
    match(input: K);

    /**
     * Matching algorithm for the exact string
     */
    private exactMatch<K>(input: K);
    
    // get the next item
    next(input?: string) // Get the next node 
}

export declare namespace Agent {
    
    // actions responsible in modifying the data shape
    // ----------------------------------------------
    type MutationAtType = 'preprocess' | 'postprocess'
    type Mutator = <T> (input: string) => T

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