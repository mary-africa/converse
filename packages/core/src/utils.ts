import produce from 'immer'
import { Draft } from 'immer/dist/internal'

import { Agent } from '../typings/index'

export function stateUpdate<Node extends string, Intent extends string>(
    old: Agent.State<Node, Intent>,
    data: {
        intent: Intent,
        nextSequenceDialogue?: Agent.DialogueMarker<Node> | null
    },
    reset?: boolean
): Agent.State<Node, Intent> {
    return produce(old, draft => {
        draft.intent = data.intent as Draft<Intent>
        
        if (Boolean(reset)) {
            draft.sequenceDialogue = null
        } else {
            // @ts-ignore
            draft.sequenceDialogue = data.nextSequenceDialogue || null
        }

        // state with updated information
        return draft
    })
}
