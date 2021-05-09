import BaseDialogue from './dialogue'
import { stateUpdate } from './utils'

import { Agent, DialogueDefinition, DDO } from '../typings'
import { Dialogue } from '../typings/dialogue'


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
        [nodes in DialogueKey]: BaseDialogue<DialogueKey, string, MatchRuleType>
    }

    private readonly intentions: { [intent in Intent]: DDO.Item<DialogueKey, any>}
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
        this.dialogues = {} as {[nodes in DialogueKey]: BaseDialogue<DialogueKey, string, MatchRuleType>}
        Object.keys(dialogues).forEach(dk => {
            this.dialogues[dk as DialogueKey] = new BaseDialogue(dk, dialogues[dk as DialogueKey], this.context)
        })
    }

    // FIXME: remove the 'any' type param
    dialogue(dialogueKey: DialogueKey): BaseDialogue<DialogueKey, any, MatchRuleType> {
        return this.dialogues[dialogueKey]
    }

    beautifyState<T>(state?: Agent.State<T, Intent>): Agent.State<T, Intent> {
        if (state === null || state === undefined) {
            return {} as Agent.State<T, Intent>
        }

        return state
    }

    mutate(at: Agent.MutationAtType, input: string) {
        const mutate = this.mutators[at]
        return mutate !== undefined ? mutate(input) : input
    }

    chat <T extends string>(
        message: string, 
        state?: Agent.State<T, Intent>
    ): { output: string, state: Agent.State<T, Intent>} {
        const freshState = this.beautifyState(state)
        let mutatedInput = this.mutate('preprocess', message)

        // match the intent
        const matchedIntent = this.match(mutatedInput) 

        if (matchedIntent === null) {
            // output the fallback text where nothing is matched
            console.warn('Matching done. No matches found')
        } else {
            const { response, dialogueKey = null } = this.intentions[matchedIntent]
            const { sequenceDialogue } = freshState

            // select item
            let selectedDialogue = dialogueKey
            
            // check if the dialogue is a list
            if (sequenceDialogue !== null && sequenceDialogue !== undefined) {
                if (Array.isArray(dialogueKey)) {
                    let index = 0

                    const { index: iDialogue } = sequenceDialogue
                    index = iDialogue
                    
                    // choosing the dialogue
                    selectedDialogue = dialogueKey[index]
                }
                
                if (selectedDialogue !== null) {                
                    const { node: _node = null } = sequenceDialogue
                    
                    // chat in the dialogue
                    const dialogue = this.dialogue(selectedDialogue)
                    
                    // get dialogue
                    const { output, node } = dialogue.respond<any>(
                        mutatedInput, 
                        // @ts-ignore
                        _node
                    )
                    
                    return {
                        output, 
                        state: stateUpdate(freshState, { 
                            intent: matchedIntent, 
                            // pointes to the next node
                            nextSequenceDialogue: { 
                                // sending option 0 under the assumption that
                                // the dialogue traversed is the same
                                index: 0, 
                                node 
                            } 
                        }) 
                    }
                }
            } 
            
            // Making the response
            // there is a matchedIntent
            if (response !== undefined) {
                return { output: response, state: { intent: matchedIntent } }
            } else {
                console.warn(`Missing response text and dialogue for intent [${matchedIntent}]`)
                console.warn("Defaulting to 'fallbackText'")
            }
        }

        // output fallback text
        return { output: this.fallbackText, state: {} }
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
    private match<T>(mutatedInput: T) {

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
        mutatedInput: T, 
        matchList: { 
            intent: Intent,
            toMatch: DDO.Item<DialogueKey, T>['toMatch']
        }[]
    ): null | Intent {
        for (let matchItem of matchList) {
            let { toMatch, intent } = matchItem
            if (Array.isArray(toMatch)) {
                // matching each item in the intent map
                if (toMatch.includes(mutatedInput)) {
                    return intent
                }
            } else {
                if (toMatch === mutatedInput) {
                    return intent
                }
            }
        }

        return null
    }
}
