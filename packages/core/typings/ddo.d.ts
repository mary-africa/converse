import { Dialogue } from './dialogue'

type MultValType<T> = T 

/**
 * Main definition of the dialogue
 */
export default interface DDO<
    IntentType extends string,
    DialogueKey extends DDO.DialogueKeyType
> {
    /**
     * Dialogues
     */
    dialogues: { [key in DialogueKey]: Dialogue.Object<unknown> }
    
    /**
     * Intentions
     */
    intentions: { [intent in IntentType]: DDO.ItemResponse<DialogueKey> | DDO.ItemDKey<DialogueKey> }

    /**
     * Response Text for when there are no intentions matched
     */
    fallbackText: string
}

declare namespace DDO {
    /**
     * Item description for the DDO
     */
    export interface Item<DialogueKey extends string | number> {
        /**
         * This is skipped when there is dialogue
         */
        response: string
    
        /**
         * string(s) to match the intention
         */
        toMatch: MultValType<string>
    
        /**
         * Dialogue keys from the dialogue object
         */
        dialogueKey: MultValType<DialogueKey>
    }

    /**
     * Expected Key type
     */
    type DialogueKeyType = string | number
    
    export type ItemResponse<DialogueKey extends DialogueKeyType> = Omit<Item<DialogueKey>, "dialogueKey">
    export type ItemDKey<DialogueKey extends DialogueKeyType> = Omit<Item<DialogueKey>, "response">
}
