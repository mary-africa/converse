import { ChatState, DialogueSequenceMarker, Responder as IResponder } from "../../@types"
import { DialogueSelector } from "./dialogue"
import { DialogueObjectType, IDialogueNode } from '../../@types/core'

/**
 * Checks if the intention has 
 * a sequence to intiate dialogue
 */
export function intentHasSequence<IntentType extends string, DialogueKey>(
    encoding: IntentType, 
    intentSequenceMap: { 
        [key in IntentType]: Array<DialogueKey> | null 
    }): boolean {
    if (encoding in intentSequenceMap) {
        if (intentSequenceMap[encoding] !== null) {
            return true
        }
    }

    return false
}

/**
 * @returns the encoded value that is need 
 *  to either build the dialogue, or simply pass as
 *  for generating output
 */
function encodedState<IntentType, SequenceMarker>(
    encoding: IntentType, 
    previousEncoding: IntentType | null | undefined, 
    sequence?: SequenceMarker | null, 
): IntentType {
    if (sequence !== undefined && sequence !== null) {
        if (previousEncoding !== undefined && previousEncoding !== null) {
            return previousEncoding
        }
    }

    return encoding
}

/**
 * Uses the response object and the encodedValue
 *  to return the response string to be displayed
 *  as the response by the chatbot
 * @returns response string
 */
function getResponse<IntentType extends string>(
    encodedValue: IntentType, 
    responseMap: { 
        [key in IntentType]: string 
    },
    defaultString: string = "Default response text"): string {
    
    if (encodedValue in responseMap) {
        return responseMap[encodedValue]
    }

    return defaultString
}

interface Response<SNodeType>{
    /**
     * Response text and created by the bot
     */
    text: string | null,

    /**
     * Function that outputs current sequence marker
     */
    sequenceDialogue: () => (DialogueSequenceMarker<SNodeType> | null)

    /**
     * Function that output the next sequence marker
     */
    nextSequenceDialogue: () => (DialogueSequenceMarker<SNodeType | string> | null)
}



/**
 * Build an object that can be used to 
 * create responses for particular conversation flow
 */
export class Responder<IntentType extends string, ActionSequenceDialogueKey extends string, AllDNodeType, ActionType extends string> implements IResponder<IntentType, ActionSequenceDialogueKey, AllDNodeType, ActionType> {
    private intentResponseMap: { [x in IntentType]: string };
    private dialogSequences: { [x in IntentType]: ActionSequenceDialogueKey[] | null };
    private dialogMap: { [x in ActionSequenceDialogueKey]: DialogueObjectType<AllDNodeType, ActionType> };
    private apiInfo: { apiKey: string, baseNenaApi: string };
    private nodeAction: <T> (actionType: ActionType, actionData?: T) => Promise<void>

    constructor (
        intentResponseMap: { [x in IntentType]: string }, 
        dialogSequences: { [x in IntentType]: ActionSequenceDialogueKey[] | null },
        dialogMap: { [x in ActionSequenceDialogueKey]: DialogueObjectType<AllDNodeType, ActionType> },
        nodeAction: <T> (actionType: ActionType, actionData?: T) => Promise<void>,
        apiInfo: { apiKey: string, baseNenaApi: string }
    ) {
        this.apiInfo = apiInfo
        this.dialogMap = dialogMap
        this.dialogSequences = dialogSequences
        this.intentResponseMap = intentResponseMap
        this.nodeAction = nodeAction
    }

    private createDefaultResponse = (encoding: IntentType): Response<AllDNodeType> => ({
        text: getResponse(encoding, this.intentResponseMap),
        sequenceDialogue: () => null,
        nextSequenceDialogue: () => null
    })

    selector = (intentWithSequence: IntentType) => {
        const { baseNenaApi, apiKey } = this.apiInfo

        return DialogueSelector(
            // @ts-ignore
            intentWithSequence,
            this.dialogMap, 
            {
                baseNenaApi, apiKey
            }
        )
    }

    baseResponse = (intent: IntentType | string, defaultString = "Default text") => {
        return this.intentResponseMap[intent as IntentType] || defaultString
    }

    buildResponse = async <T> (
        encoding: IntentType, 
        input: { message: string, state: ChatState<IntentType, ActionSequenceDialogueKey, AllDNodeType>}, 
        actionPayload?: {
            [type in ActionType]: T | undefined
        }
    ) => {
        const { message, state } = input
        
        /**
         * Information
         * needed to parse 
         * context for building response
         */
        const {
            action: prevEncoding,
            prevSequenceDialogue = null, 
            sequenceDialogue = null 
        } = state

        // Gets the proper encoded value
        //  to build response with
        const encoded = encodedState(encoding, prevEncoding, sequenceDialogue)

        // check if the intent has a sequence to build
        if (!intentHasSequence(encoded, this.dialogSequences)) {
            // there is NO sequence
            return this.createDefaultResponse(encoded)
        }

        // Select the dialogueSequence
        const selectedSequence = this.dialogSequences[encoded]

        // checks if the sequence has value
        if (selectedSequence === null) {
            return this.createDefaultResponse(encoded)
        }

        const {baseNenaApi, apiKey} = this.apiInfo

        // create dialogue selector
        const selector = DialogueSelector(
            //@ts-ignore
            selectedSequence,
            this.dialogMap, {
                baseNenaApi, apiKey
            })

        // default markers
        let marker: DialogueSequenceMarker<AllDNodeType> | null = prevSequenceDialogue
        let nextMarker: DialogueSequenceMarker<AllDNodeType | string> = { index: 0 }

        // use the previous marker to build functions
        if (sequenceDialogue !== null) { nextMarker = sequenceDialogue }

        /**
         * Check if the previous node is indicated
         */
        if (marker === null) {
            // initiate with the next node
            marker = nextMarker as DialogueSequenceMarker<AllDNodeType>
        } else {
            // execute the function of the previous node
            const dialogueNode = selector.selectNode(marker) as IDialogueNode<AllDNodeType, ActionType>

            // match the user typed input to get output object
            const dialogueOutput = await dialogueNode.matchInput(message)

            // execute the action
            if (actionPayload !== undefined) {
                const { actionType } = dialogueNode

                if (actionType !== null) {
                    // this is an async function
                    this.nodeAction(actionType, actionPayload[actionType])
                }
            }

            // gets the static key for the next node
            const nextNode: AllDNodeType | null = dialogueNode.nextStaticNodeKey(dialogueOutput)

            if (nextNode === null) {
                marker = null
            } else {
                // builds the next node
                marker = <DialogueSequenceMarker<AllDNodeType>> {
                    index: marker.index,
                    node: nextNode
                }
            }
        }

        
        const dialogueNode = marker !== null ? 
              selector.selectNode(marker) as IDialogueNode<AllDNodeType, ActionType>
            : undefined
        
        // This is where you have reached
        // console.log("Reached the base of the pipeline!")

        // the next node
        return ({
            text: dialogueNode !== undefined ? dialogueNode.getText(): null,
            sequenceDialogue: () => marker,
            nextSequenceDialogue: () => marker === null ? null : selector.nextNodeMarker(marker)
        })
    }
}

export default Responder
