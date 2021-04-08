import { IDialogueDefinitionObject } from '../typings/ddo'
import { encode as Encode } from './core/encoder'
import { Responder } from './core/decoder'
import { DialogueObjectType } from '../typings/core'
import { DialogueObject } from './core'
import { ChatState, DialogueSequenceMarker } from '../typings'

import produce from 'immer'
import { Draft } from 'immer/dist/internal'
  
export * from './utils'

export default function ConverseAgent <IntentType extends string, NevermindIntentType extends IntentType, AllDialogueNode> (
    ddo: IDialogueDefinitionObject<IntentType, NevermindIntentType>, 
    apiInfo: {
        baseNenaApi: string, 
        apiKey: string
    }) {
    // code to make sure that the needed values exist
    /// if !('intentions' in ddo)
    /**
     * Encodes the message using nena
     * @param message Message to encode
     * @returns Matched intent
     */
    const encodeMessage = async (message: string): Promise<IntentType> => {
        const { baseNenaApi, apiKey } = apiInfo
        const _encoding = await Encode<IntentType>(message, ddo.intentionTexts, baseNenaApi, apiKey)

        if (_encoding === null) {
            throw new Error("Encode the data")
        }

        return _encoding
    }

    // Build the DialogSequences + DialogMap
    // -------------------------------------

    type SequenceDialogueKey = string

    // @ts-ignore
    const DialogueSequences: { [key in IntentType]: Array<SequenceDialogueKey> } = {}
    const DialogueMap: { [x in SequenceDialogueKey]: DialogueObjectType<unknown> } = {}

    ddo.intentions.forEach(v => {
        const dialogue = ddo.sequences[v as IntentType]

        if(dialogue !== undefined && dialogue !== null) {            
            const SEQUENCE_DIALOG_KEY: SequenceDialogueKey= `${v}-DIALOGUE`

            if (!(v in DialogueSequences)) 
                DialogueSequences[v] = [SEQUENCE_DIALOG_KEY]

            if (DialogueMap[SEQUENCE_DIALOG_KEY] === undefined) {
                DialogueMap[SEQUENCE_DIALOG_KEY] = DialogueObject(dialogue)
            }
        }
    })

    // Build a responder
    // -------------------------------------

    const responder = Responder(ddo.responses, DialogueSequences, DialogueMap, apiInfo)
    type StatefulMessage<IntentType, SequenceDialogueKey, AllDialogueNode> = { message: string, state: ChatState<IntentType, SequenceDialogueKey, AllDialogueNode> }

    return ({
        respond: async (message: string, state: ChatState<IntentType, SequenceDialogueKey, AllDialogueNode> = {}): Promise<StatefulMessage<IntentType, SequenceDialogueKey, AllDialogueNode>> => {
            let _encoded = await encodeMessage(message)

            const { prevSequenceDialogue: prevSequence = null, action, history } = state

            if (prevSequence !== null) {
                // checks first if the intent is NEVER_MIND
                if (_encoded === ddo.nevermindIntent) {
                    // Reset the context
                    return {
                        message: responder.baseResponse(ddo.nevermindIntent, "Default text for Nevermind statement"),
                        state: chatStateUpdater(state, { action: ddo.nevermindIntent }, true)
                    }
                }

                if (action !== undefined && action !== null) {
                    _encoded = action
                } else {
                    console.log("there is previous sequence but no action?? how? defaulting to data")
                }
            } 

            const decodedResponse = await responder.buildResponse(_encoded, message, state)
            const { text } = decodedResponse
            
            return {
                message: (text !== null ? text : responder.baseResponse(ddo.nevermindIntent, "Default text for Nevermind statement")),
                state: chatStateUpdater(state, { 
                    action: _encoded,
                    currentDialogueNode: decodedResponse.sequenceDialogue(),
                    nextDialogueNode: decodedResponse.nextSequenceDialogue()
                })
            }
        }
    })
}

function chatStateUpdater <IntentType extends string, SequenceDialogueKey, AllDialogueNodes> (
    oldState: ChatState<IntentType, SequenceDialogueKey, AllDialogueNodes>, 
    data: { 
        action: IntentType,
        currentDialogueNode?: DialogueSequenceMarker<unknown> | null
        nextDialogueNode?: DialogueSequenceMarker<unknown> | null
    },
    reset: boolean = false
): ChatState<IntentType, SequenceDialogueKey, AllDialogueNodes> {
    return produce(oldState, draft => {
        draft.action = data.action as Draft<IntentType>

        // Update the history
        // -------------------------------
        if (draft.history === undefined) {
            draft.history = {}
        }

        if (draft.history?.actions === undefined) {
            // update action history
            draft.history['actions'] = []
        } 
        
        // if (!draft.history?.actions.includes(_enc)){
        //     console.log("Encoding is in the history")
        // }
        if (draft.prevSequenceDialogue === null) {
            // action stack
            draft.history?.actions.push( data.action)
        }

        if (reset) {
            // resets the state information
            draft.prevSequenceDialogue = null
            draft.sequenceDialogue = null
        } else {
            // @ts-ignore
            draft.prevSequenceDialogue = data.currentDialogueNode || null
            // @ts-ignore
            draft.sequenceDialogue = data.nextDialogueNode || null
        }

        // state with updated information
        return draft
    })
}
