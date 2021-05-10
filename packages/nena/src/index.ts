// what's `converse-core`

import { Nena, DialogueDefinition as NenaDialogueDefinition } from '../typings'
import BaseAgent, { Agent } from 'converse-core'

// const nenaMatcher = 

class ConverseNenaAgent<Intent extends string, DialogueKey extends string, DialogueMatchRuleType extends string> extends BaseAgent<Intent, DialogueKey, DialogueMatchRuleType, Nena.ConfigBase> {
    private readonly intents: Array<Intent>

    constructor (
        nena_ddo: NenaDialogueDefinition<Intent, DialogueKey, DialogueMatchRuleType>, 
        config: Partial<Agent.Config<DialogueMatchRuleType, Nena.ConfigBase>>, 
        context: Agent.Context
    ) {
        // to extract nena specific information
        let { ...ddo } = nena_ddo

        // Create instance
        super(ddo, config, context)
        this.intents = Object.keys(this.intentions) as unknown as Array<Intent>

        // prevent from being called
        this.setMatcher = (...args: any) => {throw new Error("Missing implementation")}
    }

    /**
     * @override
     */
    setMutation(at: Agent.MutationAtType, mutator: Agent.Mutator<{ toString: () => string }>) {
        this.mutators[at] = mutator
    }

    setApiFetcher (fetcher: Nena.Fetcher<Intent>) {
        // seting the matching rule for nena
        super.setMatcher(
            async (
                input: { toString: () => string }, matchList, _agent
            ) => {
            const intents_value: Intent[] = []
            const intent_texts: string[][] = []
            
            matchList.filter((v: Nena.DDOItem<DialogueKey, any>) => v.matchRule === 'nlp').forEach((iitem => {
                intents_value.push(iitem.intent)
                let { toMatch } = iitem
                intent_texts.push(!Array.isArray(toMatch) ? [toMatch]: toMatch )
            }))

            const response = await fetcher(
                `${_agent.config.baseApiUrl}/api/tasks/intents/knn`,
                {
                    apiKey: _agent.config.apiKey,
                    payload: {
                        text: input.toString().trim().toLowerCase(),
                        intentions: intents_value,
                        intent_texts
                    }
                },
                {
                    'content-type': 'application/json; text-charset=utf-8'
                })

            const { results: intent_index, info } = response.output
            const { intents } = info
        
            if (intent_index === null) {
                return null
            }
            
            return intents[intent_index] as Intent
        })
    }

    /**
     * @override
     */
    getMatchItemList <T>(): Array<{ 
        intent: Intent,
        matchRule: Nena.IntentMatchRule,
        toMatch: Nena.DDOItem<DialogueKey, T>['toMatch']
    }> {
        return Object.keys(this.intentions).map(
            // TODO: fix this bug?
            // @ts-ignore
            (intent: Intent) => {
                const out = this.intentions[intent] as Nena.DDOItem<DialogueKey, T> 

                return ({ 
                    intent, 
                    matchRule: out['matchRule'] as Nena.IntentMatchRule || 'nlp', // default value
                    toMatch: out['toMatch']
                })
            }
        )
    }

    /**
     * @override
     * Matching logic. This takes uses a matcher, to match the 
     * [mutated] input against the `toMatch` items in each intent
     */
    protected match<T>(mutatedInput: T) {
        // check if there is a matcher
        if (this.matcher !== undefined) {
            return this.matcher(mutatedInput, this.getMatchItemList(), { config: this.config, context: this.context } )
        } else {
            // check if exact matching is enabled
            if (this.config.enableExactMatchRule) {
                return this.exactMatch(mutatedInput, this.getMatchItemList())
            } else {
                console.warn(`Agent is missing a matcher Function, and configuration for agent has 'enableExactMatchRule=false'.
This will default to returning 'null'`)
            }
        }

        // Null means there is not intent that is 
        // matched with the [mutated] input
        return null
    }
}

export default ConverseNenaAgent
