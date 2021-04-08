import { IntentionTexts, Responses } from './core'
import { Dialogue } from './dialogue';

export interface IDialogueDefinitionObject<IntentType extends string, NeverMindIntentType extends IntentType> {
    intentions: Required<Exclude<IntentType, NeverMindIntentType>[]>
    intentionTexts: Required<IntentionTexts<IntentType>>
    responses: Required<Responses<IntentType>>
    nevermindIntent: Required<NeverMindIntentType>
    sequences: Required<{
        [intent in IntentType]: Dialogue<unknown>
    }>
}
