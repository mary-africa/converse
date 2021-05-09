// import { Dialogue } from './dialogue'

type MultValType<T> = T 

/**
 * Main definition of the dialogue
 */
declare interface DialogueDefinition<
    IntentType extends string,
    DialogueKey extends DDO.DialogueKeyType,
    MatchRuleType extends string
> {
    /**
     * Dialogues
     */
    dialogues: { [key in DialogueKey]: Dialogue.Object<string, MatchRuleType> }
    
    /**
     * Intentions
     */
    intentions: { [intent in IntentType]: DDO.ItemResponse<DialogueKey> | DDO.ItemDKey<DialogueKey> }

    /**
     * Response Text for when there are no intentions matched
     */
    fallbackText: string
}

export default DialogueDefinition

declare namespace DDO {
    /**
     * Item description for the DDO
     */
    interface Item<DialogueKey extends string | number, T> {
        /**
         * This is skipped when there is dialogue
         */
        response: string
    
        /**
         * string(s) to match the intention
         */
        toMatch: T[]
    
        /**
         * Dialogue keys from the dialogue object
         */
        dialogueKey: MultValType<DialogueKey>
    }

    /**
     * Expected Key type
     */
    type DialogueKeyType = string | number
    
    type ItemResponse<DialogueKey extends DialogueKeyType> = Omit<Item<DialogueKey>, "dialogueKey">
    type ItemDKey<DialogueKey extends DialogueKeyType> = Omit<Item<DialogueKey>, "response">
}
