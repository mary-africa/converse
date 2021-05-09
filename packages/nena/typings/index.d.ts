import BaseAgent, { Agent, DialogueDefinition } from '../../core'
import ConverseDialogue from '../../core/typings/dialogue'

class NenaConverseAgent<Intent extends string, DialogueKey extends string, DialogueMatchRuleType extends string> extends BaseAgent<Intent, DialogueKey, DialogueMatchRuleType> {
    constructor (
        ddo: NenaDialogueDefinition<Intent, DialogueKey, DialogueMatchRuleType>, 
        config: Nena.ConfigBase & Partial<Agent.Config<DialogueMatchRuleType>>, 
        context: Agent.Context
    );

    setMutation<T>(at: Agent.MutationAtType, mutator: Agent.Mutator<T>);
    removeMutation(at: Agent.MutationAtType);
    dialogue<T>(dialogueKey: DialogueKey): ConverseDialogue<DialogueKey, T, DialogueMatchRuleType>

    /**
     * [PRIVATE] this performs the intent matching
     */    
    intentMatch<K>(
        input: K, 
        matchMap: { 
            [intent in Intent]: NenaDialogueDefinition<Intent, DialogueKey, DialogueMatchRuleType>['intentions'][intent]['toMatch'] 
        }
    )

    /**
     * Agent's logic for matching the input
     * // this would use the setMatcher to match the inputs
     */
    match<K>(input: K);
}

export default NenaConverseAgent

declare namespace Nena {
    interface ConfigBase {
        apiKey: string
        baseApiUrl: string
    }
}

export declare interface NenaDialogueDefinition<
    IntentType extends string,
    DialogueKey extends DDO.DialogueKeyType,
    MatchRuleType extends string
> extends DialogueDefinition<IntentType, DialogueKey, MatchRuleType> {
    /**
     * Rules for matching with
     */
    // matchRule: 'exact' | 'swahili-intent' | 'custom'
}
