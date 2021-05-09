import { IncomingHttpHeaders } from 'node:http'
import BaseAgent, { Agent, DialogueDefinition as BaseDialogueDefinition } from '../../core'
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
    setApiFetcher (fetcher: Nena.Fetcher<Intent>)
}

export default NenaConverseAgent

export declare namespace Nena {
    interface ConfigBase {
        apiKey: string
        baseApiUrl: string,
    }

    type Fetcher<Intent extends string> = (
        url: string, 
        data: {
            apiKey: string,
            payload: {
                text: string
                intentions: Intent[],
                intent_texts: string[][]
            }
        },
        header: IncomingHttpHeaders
    ) => Promise<{
        output: { 
            results: number | null, 
            info: {
                intents: string[]
            } 
        }
    }>
}

export declare interface DialogueDefinition<
    IntentType extends string,
    DialogueKey extends DDO.DialogueKeyType,
    MatchRuleType extends string
> extends BaseDialogueDefinition<IntentType, DialogueKey, MatchRuleType> {
    /**
     * Rules for matching with
     */
    // matchRule: 'exact' | 'swahili-intent' | 'custom'
}
