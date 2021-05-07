import DialogueDefinition, { DDO } from '../typings/ddo'
import { Dialogue } from '../typings/dialogue'
import { Agent } from '../typings'

import BaseDialogue from './dialogue'

export default class BaseAgent<Intent extends string, DialogueKey extends string, MatchRuleType extends string>{
    public static readonly DIALOGUE_GOTO_SELF: Dialogue.GoTo.Self = 0

    private mutators: { 
        [mutatorId in Agent.MutationAtType]?: Agent.Mutator<any>
    } = {}

    private readonly config: Agent.Config<MatchRuleType>;
    private readonly context: Agent.Context;

    /**
     * This stores the dialogue objects
     */
    private dialogues: {
        // FIXME: remove the 'any' type param
        [nodes in DialogueKey]: BaseDialogue<string, MatchRuleType>
    }

    private readonly intentions: { [intent in Intent]: DDO.ItemResponse<DialogueKey> | DDO.ItemDKey<DialogueKey> }
    private readonly fallbackText: string

    /**
     * This would contain the matcher Function needed
     * to match the items in the intentions object 
     */
    private matcher?: <T>(
        input: T, 
        matchMap: { 
            intent: Intent,
            toMatch: DDO.Item<DialogueKey, T>['toMatch']
        }[],
        ...args: any | undefined) => null | Intent

    constructor (
        ddo: DialogueDefinition<Intent, DialogueKey, MatchRuleType>, 
        config: Partial<Agent.Config<MatchRuleType>>, 
        context: Agent.Context
    ) {
        this.config = {
            // setting the default configurations
            enableExactMatchRule: true, 
            ...(config || {}) 
        }

        this.context = context
    
        const { dialogues, intentions, fallbackText } = ddo
        this.intentions = intentions 
        this.fallbackText = fallbackText

        // set dialogues
        this.dialogues = {} as {[nodes in DialogueKey]: BaseDialogue<string, MatchRuleType>}
        Object.keys(dialogues).forEach(dk => {
            this.dialogues[dk as DialogueKey] = new BaseDialogue(dialogues[dk as DialogueKey], this.context)
        })
    }

    // FIXME: remove the 'any' type param
    dialogue(dialogueKey: DialogueKey): BaseDialogue<any, MatchRuleType> {
        return this.dialogues[dialogueKey]
    }

    beautifyState<T>(state?: Agent.State<T, Intent>): Agent.State<T, Intent> {
        if (state === null || state !== undefined) {
            return {}
        }

        return {} as Agent.State<T, Intent>
    }

    chat <T>(message: string, state?: Agent.State<T, Intent>) {
        const freshState = this.beautifyState(state)
        console.log(freshState)

        // match the intent
        const matchedIntent = this.match(message) 

        if (matchedIntent === null) {
            // output the fallback text where nothing is matched
            console.warn('Matching done. No matches found')
        } else {
            const { response, dialogueKey } = this.intentions[matchedIntent]
    
            if (dialogueKey !== undefined) {
                // chat in the dialogue
                const dialogue = this.dialogue(dialogueKey)

                throw new Error(`You are moving to the Dialogue<${dialogueKey}>`)
            } else {
                // there is a matchedIntent
                if (response !== undefined) {
                    return response
                } else {
                    console.warn(`Missing response text and dialogue for intent [${matchedIntent}]`)
                    console.warn("Defaulting to 'fallbackText'")
                }
            }
        }

        // output fallback text
        return this.fallbackText
    }

    setMutation<T>(at: Agent.MutationAtType, mutator: Agent.Mutator<T>) {
        this.mutators[at] = mutator
    }

    removeMutation(at: Agent.MutationAtType) {
        this.mutators[at] = undefined
    }

    // matcher for initial dialogue
    // TODO: maybe remove this?
    setMatcher(
        matcher: <T>(
            input: T, 
            matchMap: { 
                intent: Intent,
                toMatch: DDO.Item<DialogueKey, T>['toMatch']
            }[], 
            _agent: Readonly<{ context: Agent.Context, config: Agent.Config<MatchRuleType> }>
        ) => null | Intent
    ) {
       if (this.matcher !== undefined)
            console.warn(`Replacing an existing matcher`)

        this.matcher = matcher
    }

    private getMatchItemList<T>(): Array<{ 
        intent: Intent,
        toMatch: DDO.Item<DialogueKey, T>['toMatch']
    }> {
        return Object.keys(this.intentions).map(
            // TODO: fix this bug?
            // @ts-ignore
            (intent: Intent) => {
                return ({ 
                    intent, 
                    toMatch: this.intentions[intent]['toMatch']
                })
            }
        )
    }

    /**
     * Matching logic. This takes uses a matcher, to match the 
     * [mutated] input against the `toMatch` items in each intent
     */
    private match(input: string) {
        // checking is there is a preprocessing mutation
        let mutatedInput = input

        if (this.mutators['preprocess'] !== undefined){
            mutatedInput = this.mutators['preprocess'](input)
        }

        // Perform matching
        // --------------------------

        // check if there is a matcher
        if (this.matcher !== undefined) {
            return this.matcher(mutatedInput, this.getMatchItemList())
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

    /**
     * Matching algorithm for the exact string
     * TODO: improve matching of the strings
     * 
     * @type T mutated type
     */
    private exactMatch<T>(
        input: T, 
        matchList: { 
            intent: Intent,
            toMatch: DDO.Item<DialogueKey, T>['toMatch']
        }[]
    ): null | Intent {
        for (let matchItem of matchList) {
            // matching each item in the intent map
            if (matchItem.toMatch.includes(input)) {
                return matchItem.intent
            }
        }

        return null
    }
}