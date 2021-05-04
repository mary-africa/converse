import DialogueDefinition, { DDO } from '../typings/ddo'
import { Agent } from '../typings'

import BaseDialogue from './dialogue'

interface State<Node> {
    /**
     * Identifies staticly defined sequence
     */
    prevSequenceDialogue?: null | NodeMarker<Node>

    /**
     * included `string` to account for dynamic matching of the sequences.
     * This would include using something like seq-${number}-var
     */
    sequenceDialogue?: null | NodeMarker<Node | string>
}

export type NodeMarker<Node> = {
    index: number,
    node?: Node,
}

export default class BaseAgent<Intent extends string, DialogueKey extends string, MatchRuleType extends string>{
    private mutators: { 
        [mutatorId in Agent.MutationAtType]?: Agent.Mutator
    } = {}

    private config: Agent.Config<MatchRuleType>;
    private readonly context: Agent.Context;

    private dialogues: {
        // FIXME: remove the 'any' type param
        [nodes in DialogueKey]: BaseDialogue<any>
    }

    constructor (
        ddo: DialogueDefinition<Intent, DialogueKey>, 
        config: Agent.Config<MatchRuleType>, 
        context: Agent.Context
    ) {
        this.config = config
        this.context = context

        const { dialogues } = ddo

        // set dialogues
        this.dialogues = {} as {[nodes in DialogueKey]: BaseDialogue<any>}
        Object.keys(dialogues).forEach(dk => {
            this.dialogues[dk as DialogueKey] = new BaseDialogue(dialogues[dk as DialogueKey], this.context)
        })
    }

    // FIXME: remove the 'any' type param
    dialogue(dialogueKey: DialogueKey): BaseDialogue<any> {
        return this.dialogues[dialogueKey]
    }

    chat <T>(message: string, state: State<T>) {
    
    }

    setMutation(at: Agent.MutationAtType, mutator: Agent.Mutator) {
        this.mutators[at] = mutator
    }

    removeMutation(at: Agent.MutationAtType) {
        this.mutators[at] = undefined
    }
}