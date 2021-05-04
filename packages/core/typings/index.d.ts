import DDO from './ddo'

export default class Agent<MatchRuleType extends string> {
    constructor (ddo: DDO, context: Agent.Context<MatchRuleType>, actions: Agent.Actions<MatchRuleType>);
}

declare namespace Agent {
    export interface Context<MatchRuleType extends string> {
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
        allowExactRule: boolean

        /**
         * Extended context
         */
        [id: string]: string
    }

    export interface Actions<MatchRuleType extends string> {
        selectors: {
            [selector in MatchRuleType]: (message: string) => void
        }
    }
}