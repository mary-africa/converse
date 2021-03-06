import BaseDialogue from './dialogue'
import { stateUpdate } from './utils'

import { Agent, DialogueDefinition, DDO } from '../typings'
import { Dialogue } from '../typings/dialogue'


export default class BaseAgent<Intent extends string, DialogueKey extends string, MatchRuleType extends string, AgentExtendedConfig>{
    public static readonly DIALOGUE_GOTO_SELF: Dialogue.GoTo.Self = 0
    protected mutators: { 
        [mutatorId in Agent.MutationAtType]?: Agent.Mutator<any>
    } = {}

    protected readonly config: Agent.Config<MatchRuleType, AgentExtendedConfig>;
    protected readonly context: Agent.Context;

    /**
     * This stores the dialogue objects
     */
    protected dialogues: {
        // FIXME: remove the 'any' type param
        [nodes in DialogueKey]: BaseDialogue<DialogueKey, string, MatchRuleType>
    }

    protected readonly intentions: { [intent in Intent]: DDO.Item<DialogueKey, any>}
    protected readonly fallbackText: string

    /**
     * This would contain the matcher Function needed
     * to match the items in the intentions object 
     */
    protected matcher?: <T>(
        input: T, 
        matchMap: { 
            intent: Intent,
            toMatch: DDO.Item<DialogueKey, T>['toMatch']
        }[],
        ...args: any | undefined) => Promise<null | Intent>

    constructor (
        ddo: DialogueDefinition<Intent, DialogueKey, MatchRuleType>, 
        config: Partial<Agent.Config<MatchRuleType, AgentExtendedConfig>>, 
        context: Agent.Context
    ) {
        this.config = {
            // setting the default configurations
            enableExactMatchRule: true,
            ...(config || {}) 
        } as Agent.Config<MatchRuleType, AgentExtendedConfig>

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

    beautifyState<T extends string>(state?: Agent.State<T, Intent>): Agent.State<T, Intent> {
        if (state === null || state === undefined) {
            return {} as Agent.State<T, Intent>
        }

        return state
    }

    mutate(at: Agent.MutationAtType, input: string) {
        const mutate = this.mutators[at]
        return mutate !== undefined ? mutate(input) : input
    }

    private normalizeIntentionData(matchedIntent: Intent) {
        const { response = null, dialogueKey = null} = this.intentions[matchedIntent]

        return { response, dialogueKey }
    }

    async chat <T extends string, AT, MatchCallback extends Function>(
        message: string, 
        state?: Agent.State<T, Intent>,

        // TODO NEXT: make sure that the `use` operation has 
        //  `action` and `callback` information, both of which have { data: D, callback: F }
        use?: {actionData?: AT, matchCallback?: MatchCallback}
    ): Promise<{output: string, state: Agent.State<T, Intent>}> {
        const freshState = this.beautifyState(state)
        let mutatedInput = this.mutate('preprocess', message)

        const { sequenceDialogue = null } = freshState
        
        // match the intent
        let matchedIntent = freshState.intent || null

        if (sequenceDialogue === undefined || sequenceDialogue === null) {
            matchedIntent = await this.match(mutatedInput) 
        }

        if (matchedIntent === null) {
            // output the fallback text where nothing is matched
            console.warn('Matching done. No matches found')
        } else {
            const { response, dialogueKey } = this.normalizeIntentionData(matchedIntent)

            if (dialogueKey !== null) {
    
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
                }
    
                if (selectedDialogue !== null) {                    
                    // chat in the dialogue
                    const dialogue = this.dialogue(selectedDialogue)
                    
                    // console.log("dialogue :> ", sequenceDialogue)
    
                    // get dialogue
                    const out = dialogue.respond<any, AT, MatchCallback>(
                        mutatedInput,
                        // @ts-ignore
                        sequenceDialogue !== null ? sequenceDialogue.node: null,
                        use
                    )
    
                    /**
                     * LEAVING DIALOGUE
                     */
    
                    // DIALOGUE EXIT-ACTION: if the node is the last node... then exit
                    // MOVE TO AGENT
                    if (out === null) {
                        // TODO: navigate to the next item in sequence
                        //  not currently supported
                        await dialogue.performAction('exit', use?.actionData)
    
                        // since the output for the node is the last node in the list..
                        // Eject and process the text regularly
                        return this.chat(message, {}, use)
                    }
    
                    const { output, node } = out
                    
                    if (output !== null) {
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
                

            } else {
                // Making the response
                // there is a matchedIntent
                if (response !== null) {
                    return { output: response, state: { intent: matchedIntent } }
                }
            }
        }

        // console.warn(`Missing response text and dialogue for intent [${matchedIntent}]`)
        // console.warn("Defaulting to 'fallbackText'")

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
            _agent: Readonly<{ context: Agent.Context, config: Agent.Config<MatchRuleType, AgentExtendedConfig> }>
        ) => Promise<null | Intent>
    ) {
        // TODO: Enforce this not to happen is already set.
        //  to establish proper rules for creating thesee things
    //    if (this.matcher !== undefined)
    //         console.warn(`Replacing an existing matcher`)

        this.matcher = matcher
    }

    protected getMatchItemList<T>(): Array<{ 
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
    protected async match<T>(mutatedInput: T) {

        // Perform matching
        // --------------------------

        // check if there is a matcher
        if (this.matcher !== undefined) {
            const matchedIntent = await this.matcher(mutatedInput, this.getMatchItemList(), this.context)
            if (matchedIntent !== null) {
                return matchedIntent
            }
        } 
        
        // check if exact matching is enabled
        if (this.config.enableExactMatchRule) {
            return this.exactMatch(mutatedInput, this.getMatchItemList())
        } else {
            // console.warn(`Agent is missing a matcher Function, and configuration for agent has 'enableExactMatchRule=false'. This will default to returning 'nul'`)
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
    protected exactMatch<T>(
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
