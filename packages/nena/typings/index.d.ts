import { IncomingHttpHeaders } from 'node:http'
import BaseAgent, { Agent, DialogueDefinition as BaseDialogueDefinition, DDO } from 'converse-core'
import ConverseDialogue from 'converse-core/dialogue'


declare class NenaConverseAgent<Intent extends string, DialogueKey extends string, DialogueMatchRuleType extends string> extends BaseAgent<Intent, DialogueKey, DialogueMatchRuleType, Nena.ConfigBase> {
    constructor (
        ddo: DialogueDefinition<Intent, DialogueKey, DialogueMatchRuleType>, 
        config: Partial<Agent.Config<DialogueMatchRuleType, Nena.ConfigBase>>, 
        context: Agent.Context
    );

    setMutation<T>(at: Agent.MutationAtType, mutator: Agent.Mutator<T>);
    removeMutation(at: Agent.MutationAtType);
    dialogue<T extends string>(dialogueKey: DialogueKey): ConverseDialogue<DialogueKey, T, DialogueMatchRuleType>
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
