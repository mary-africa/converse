import { ChatState, DialogueSequenceMarker } from "../typings"
import { DialogueSelector } from "./dialogue"
import { DialogueCallback } from "../typings/dialogue"
import { DialogueObjectType, IDialogueNode } from '../typings/core'

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

interface IResponseBuilder<IntentType, ActionSequenceDialogueKey, AllDNodeType> {
    baseResponse: (encoding: IntentType | string, defaultString: string) => string
    buildResponse: (encoding: IntentType, message: string, state: ChatState<IntentType, ActionSequenceDialogueKey, AllDNodeType>) => Promise<Response<AllDNodeType>>
}

/**
 * Build an object that can be used to 
 * create responses for particular conversation flow
 */
export function Responder <IntentType extends string, ActionSequenceDialogueKey extends string, AllDNodeType>(
    intentResponseMap: { [x in IntentType]: string }, 
    dialogSequences: { [x in IntentType]: ActionSequenceDialogueKey[] | null },
    dialogMap: { [x in ActionSequenceDialogueKey]: DialogueObjectType<AllDNodeType> }
): IResponseBuilder<IntentType, ActionSequenceDialogueKey, AllDNodeType> {

    return ({
        baseResponse: (intent: IntentType | string, defaultString = "Default text"): string => {
            return intentResponseMap[intent as IntentType] || defaultString
        },
        buildResponse: async (encoding, message, state) => {
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


            const createDefaultResponse = (encoding: IntentType): Response<AllDNodeType> => ({
                text: getResponse(encoding, intentResponseMap),
                sequenceDialogue: () => null,
                nextSequenceDialogue: () => null
            })

            // Gets the proper encoded value
            //  to build response with
            const encoded = encodedState(encoding, prevEncoding, sequenceDialogue)

            // check if the intent has a sequence to build
            if (!intentHasSequence(encoded, dialogSequences)) {
                // there is NO sequence
                return createDefaultResponse(encoded)
            }

            // Select the dialogueSequence
            const selectedSequence = dialogSequences[encoded]
            console.log("Here! ---------")

            console.log("Encoded: ", encoded)

            // checks if the sequence has value
            if (selectedSequence === null) {
                console.log("Normally, this must never be reached")
                return createDefaultResponse(encoded)
            }

            // create dialogue selector
            // @ts-ignore
            const selector = DialogueSelector(selectedSequence, dialogMap)
            console.log("Here! PATH")

            // default markers
            let marker: DialogueSequenceMarker<AllDNodeType> | null = prevSequenceDialogue
            let nextMarker: DialogueSequenceMarker<AllDNodeType | string> = { index: 0 }

            // use the previous marker to build functions
            if (sequenceDialogue !== null) { nextMarker = sequenceDialogue }

            // Update the state for the previous sequence dialogue
            // dialogSequenceState['prev'] = prevSequenceDialogue

            // const prevDialog = selector.select(marker)
            // const dialog = selector.select()

            /**
             * Check if the previous node is indicated
             */
            if (marker === null) {
                // initiate with the next node
                marker = nextMarker as DialogueSequenceMarker<AllDNodeType>
            } else {
                // execute the function of the previous node
                const dialogueNode = selector.selectNode(marker) as IDialogueNode<AllDNodeType>
                console.log("Node has been selected")

                console.log("NODE:", dialogueNode)
                // match the user typed input to get output object
                const dialogueOutput = await dialogueNode.matchInput(message)
                console.log("node output matched")

                // execute function if execution is successful
                await dialogueNode.execute(message)
                console.log("function has been exectued")

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

            
            const dialogueNode = marker !== null ? selector.selectNode(marker) as IDialogueNode<AllDNodeType>: undefined
            
            // This is where you have reached
            console.log("Reached the base of the pipeline!")

            // the next node
            return ({
                text: dialogueNode !== undefined ? dialogueNode.getText(): null,
                sequenceDialogue: () => marker,
                nextSequenceDialogue: () => marker === null ? null : selector.nextNodeMarker(marker)
            })
        }
    })
}
