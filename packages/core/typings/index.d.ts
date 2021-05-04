import DDO from './ddo'

export default class Agent<Intent extends string, DialogueKey extends string, MatchRuleType extends string> {
    /**
     * Mutators for agent
     */
    private mutators: { 
        [mutatorId in Agent.MutationAtType]?: Agent.Mutator
    }

    /**
     * Configutations for setting up 
     * the agent's behaviour
     */
    private config: Agent.Config<MatchRuleType>

    /**
     * Contextual information used across the 
     * entire agent
     */
    private context: Agent.Context

    constructor (ddo: DDO<Intent, DialogueKey>, config: Agent.Config<MatchRuleType>, context: Agent.Context);
    setMutation(at: Agent.MutationAtType, mutator: Agent.Mutator);
    removeMutation(at: Agent.MutationAtType);
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