import DDO from './ddo'
import Dialogue, { Dialogue as NsDialogue } from './dialogue'

export default class Agent<Intent extends string, DialogueKey extends string, MatchRuleType extends string> {
    constructor (ddo: DDO<Intent, DialogueKey>, config: Agent.Config<MatchRuleType>, context: Agent.Context);
    setMutation(at: Agent.MutationAtType, mutator: Agent.Mutator);
    removeMutation(at: Agent.MutationAtType);
    dialogue<T>(dialogueKey: DialogueKey): Dialogue<T, MatchRuleType>/* NsDialogue.Object<T, MatchRuleType> */

    // matcher for initial dialogue
    // TODO: maybe remove this?
    setMatcher<K, T>(matchRule: MatchRuleType, matcher: (input: K, options: T, context: Agent.Context) => null | NodeOption)
    
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
        enableExactMatchRule?: boolean
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