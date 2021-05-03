import DDO from './ddo'

export default class Agent {
    constructor (ddo: DDO, context: Agent.Context);
}

declare namespace Agent {
    export interface Context<MatchRuleType> {
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
}