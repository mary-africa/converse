import { Dialogue } from './dialogue'

type MultValType<T> = T | T[]

/**
 * Main definition of the dialogue
 */
export default interface DDO<
    IntentType extends string,
    DialogueKey extends DDO.DialogueKeyType,
    NodeOption extends string
> {
    /**
     * Dialogues
     */
    dialogues: { [key in DialogueKey]: Dialogue.Object<NodeOption> }
    
    /**
     * Intentions
     */
    intentions: { [intent in IntentType]: DDO.ItemResponse<DialogueKey> | DDO.ItemDKey<DialogueKey> }

    /**
     * Definition when dialogue is 'exit'
     */
    exit: {
        response?: string
        match: MultValType<string>
        method?: 'exact'
    }

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
        match: MultValType<string>
    
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
