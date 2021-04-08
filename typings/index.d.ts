
type Message = string
interface ResponseMessage {
    message: string
}

interface BaseHookedChatService {
    description: {
        title: string,
        description: string,
        name: string
    }    
}

/**
 * Describe the service
 * to register
 */
export interface HookedChatService  extends BaseHookedChatService {
    messageHandler: (message: string) => Promise<void>
}

/**
 * Information containing previous chat Interactions
 */
type ChatHistory = { actions?: Array<string> }

interface ChatState<ChatActionType, ChatActionSequence, AllDialogueNodeType> {
    history?: ChatHistory

    /**
     * The current actions for the chat sequence
     */
    action?: ChatActionType | null
    
    /**
     * Identifies staticly defined sequence
     */
    prevSequenceDialogue?: null | DialogueSequenceMarker<AllDialogueNodeType>

    /**
     * included `string` to account for dynamic matching of the sequences.
     * This would include using something like seq-${number}-var
     */
    sequenceDialogue?: null | DialogueSequenceMarker<AllDialogueNodeType | string>
}

export type DialogueSequenceMarker<DNodeType> = {
    index: number,
    node?: DNodeType,
}

export interface HookedStatefulChatService<ChatState> extends BaseHookedChatService {
    messageHandler: (message: string, state: ChatState) => Promise<{ message: string, state: ChatState}>
}

