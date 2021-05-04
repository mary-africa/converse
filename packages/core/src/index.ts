import DialogueDefinition, { DDO } from '../typings/ddo'
import { Agent } from '../typings'

export default class ConverseAgent<Intent extends string, DialogueKey extends string, MatchRuleType extends string>{
    private mutators: { 
        [mutatorId in Agent.MutationAtType]?: Agent.Mutator
    } = {}

    private config: Agent.Config<MatchRuleType>;
    private context: Agent.Context;

    constructor (
        ddo: DialogueDefinition<Intent, DialogueKey>, 
        config: Agent.Config<MatchRuleType>, 
        context: Agent.Context
    ) {
        this.config = config
        this.context = context
    }

    setMutation(at: Agent.MutationAtType, mutator: Agent.Mutator) {
        this.mutators[at] = mutator
    }

    removeMutation(at: Agent.MutationAtType) {
        this.mutators[at] = undefined
    }
}