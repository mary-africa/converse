import { IDialogueSelector } from "./core"

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
export type SequenceDialogueKey = string
export type StatefulMessage<IntentType, SequenceDialogueKey, AllDialogueNode> = { message: string, state: ChatState<IntentType, SequenceDialogueKey, AllDialogueNode> }

export interface ConverseAgent<IT extends string, NmIT extends IT, DN, ActionType extends string> {
    ddo: IDialogueDefinitionObject<IT, NmIT>
    responder: Responder<IT, SequenceDialogueKey, DN, ActionType>
    
    encodeMessage: (message: string) => Promise<IT>
    getSelector: (intentWithSequence: IntentType) => null | IDialogueSelector<DN>
    respond: <T> ( 
        input: {
            message: string, 
            state?: ChatState<IntentType, SequenceDialogueKey, AllDialogueNode>
        },
        actionPayload?: {
            [type in ActionType]: T | undefined
        }
    ) => Promise<StatefulMessage<IT, SequenceDialogueKey, DN>>
}

type Response<DN> = {
    text: string | null,
    sequenceDialogue: () => (DialogueSequenceMarker<DN> | null),
    nextSequenceDialogue: () => (DialogueSequenceMarker<DN> | null)
}

export interface Responder<IntentType, ActionSequenceDialogueKey, AllDNodeType, ActionType extends string> {
    getSelector: (intentWithSequence: IntentType) => null | IDialogueSelector<AllDNodeType>
    baseResponse: (encoding: IntentType | string, defaultString: string) => string
    buildResponse: <T> (
        encoding: IntentType, 
        input: { message: string, state: ChatState<IntentType, ActionSequenceDialogueKey, AllDNodeType>}, 
        actionPayload?: {
            [type in ActionType]: T | undefined
        }
    ) => Promise<Response<AllDNodeType>>
}

