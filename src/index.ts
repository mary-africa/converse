import { ChatState, StatefulMessage, DialogueSequenceMarker, ConverseAgent as IConverseAgent, Responder as IResponseBuilder, SequenceDialogueKey} from '../@types'
import { IDialogueDefinitionObject } from '../@types/ddo'
import { DialogueObjectType } from '../@types/core'

import { DialogueObject } from './core'
import { encode as Encode } from './core/encoder'
import { Responder } from './core/decoder'

import produce from 'immer'
import { Draft } from 'immer/dist/internal'
  
export * from './utils'

class ConverseAgent <IntentType extends string, NevermindIntentType extends IntentType, AllDialogueNode> implements IConverseAgent<IntentType, NevermindIntentType, AllDialogueNode> {
    public ddo: IDialogueDefinitionObject<IntentType, NevermindIntentType>
    public responder: IResponseBuilder<IntentType, SequenceDialogueKey, AllDialogueNode>
    private nodeAction: <T> (intentDotNode: string, reducerArgs?: T) => Promise<void>

    private apiInfo: {
        baseNenaApi: string,
        apiKey: string
    } 

    // @ts-ignore
    private DialogueSequences: { [key in IntentType]: SequenceDialogueKey[] | null } = {}
    private DialogueMap: { [x in SequenceDialogueKey]: DialogueObjectType<AllDialogueNode> } = {}


    constructor (
        ddo: IDialogueDefinitionObject<IntentType, NevermindIntentType>, 
        nodeAction: <T> (intentDotNode: string, reducerArgs?: T) => Promise<void>,
        apiInfo: {
            baseNenaApi: string, 
            apiKey: string
        }
    ) {
        this.ddo = ddo
        this.apiInfo = apiInfo
        this.nodeAction = nodeAction
        // Building the ConverseAgent components

        this.ddo.intentions.forEach(v => {
            const dialogue = ddo.sequences[v as IntentType]

            if(dialogue !== undefined && dialogue !== null) {            
                const SEQUENCE_DIALOG_KEY: SequenceDialogueKey= `${v}-DIALOGUE`

                if (!(v in this.DialogueSequences)) 
                    this.DialogueSequences[v] = [SEQUENCE_DIALOG_KEY]

                if (this.DialogueMap[SEQUENCE_DIALOG_KEY] === undefined) {
                    this.DialogueMap[SEQUENCE_DIALOG_KEY] = DialogueObject(dialogue) as DialogueObjectType<AllDialogueNode>
                }
            }
        })

        this.responder = new Responder(this.ddo.responses, this.DialogueSequences, this.DialogueMap, this.nodeAction, apiInfo)
    }

    selector = (intentWithSequence: IntentType) => this.responder.selector(intentWithSequence)

    async encodeMessage (message: string) {
        const { baseNenaApi, apiKey } = this.apiInfo
        
        const _encoding = await Encode<IntentType>(message, this.ddo.intentionTexts, baseNenaApi, apiKey)

        if (_encoding === null) {
            throw new Error(`Unable to encode for <message: ${message}>`)
        }

        return _encoding
    }

    async respond (
        input: {
            message: string, 
            state: ChatState<IntentType, SequenceDialogueKey, AllDialogueNode>
        }, 
        reducerArgs?: any
    ): Promise<StatefulMessage<IntentType, SequenceDialogueKey, AllDialogueNode>> {
        const { message, state = {} } = input
        let _encoded = await this.encodeMessage(message)

        const { prevSequenceDialogue: prevSequence = null, action, history } = state

        if (prevSequence !== null) {
            // checks first if the intent is NEVER_MIND
            if (_encoded === this.ddo.nevermindIntent) {
                // Reset the context
                return {
                    message: this.responder.baseResponse(this.ddo.nevermindIntent, "Default text for Nevermind statement"),
                    state: chatStateUpdater(state, { action: this.ddo.nevermindIntent }, true)
                }
            }

            if (action !== undefined && action !== null) {
                _encoded = action
            }
        }

        const decodedResponse = await this.responder.buildResponse(_encoded, message, state)
        const { text } = decodedResponse

        const newState = chatStateUpdater(state, { 
            action: _encoded,
            currentDialogueNode: decodedResponse.sequenceDialogue(),
            nextDialogueNode: decodedResponse.nextSequenceDialogue()
        })
        
        if (text === null) {
            return await this.respond(message, newState)
        }

        return {
            message: text,
            state: newState
        }
    }
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

export default ConverseAgent
