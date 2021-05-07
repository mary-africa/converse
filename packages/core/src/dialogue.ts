import { Agent } from '../typings'
import { Node, Dialogue } from '../typings/dialogue'

export class BaseNode<Option extends string, MatchRuleType extends string> {
    private options: Node.Options
    private self: Dialogue.Node<Option, MatchRuleType>

    constructor (node: Dialogue.Node<Option, MatchRuleType>, options?: Partial<Node.Options>) {
        this.self = node
        this.options = { verbose: true, actionIds: {}, mutatorIds: {}, ...options }
    }

    private get verbose(): boolean {
        return this.options.verbose    
    }

    setMutatorId(at: Node.MutationType, id: string) {
        if (this.verbose) {
            if (this.options.mutatorIds[at] !== undefined)
                console.warn(`Replacing an existing mutation on '${at}' -> ${this.options.mutatorIds[at]}`)
        }

        this.options.mutatorIds[at] = id
    }
    removeMutatorId(at: Node.MutationType) {
        this.options.mutatorIds[at] = undefined
    }
    
    setActionId(on: Node.ActionType, id: string) {
        if (this.verbose) {
            if (this.options.actionIds[on] !== undefined)
                console.warn(`Replacing an existing action on '${on}' -> ${this.options.actionIds[on]}`)
        }

        this.options.actionIds[on] = id
    }

    removeActionId(on: Node.ActionType) {
        this.options.actionIds[on] = undefined
    }

    
}
 
export default class BaseDialogue<NodeOption extends string, MatchRuleType extends string> {
    private options: Dialogue.Options
    private readonly ac: Agent.Context
    private self: Dialogue.Object<NodeOption, MatchRuleType>

    private matchers: { [matcher in MatchRuleType]?: Dialogue.MatchFunction<any, any> } = {}

    private mutators: { [mutatorId in Dialogue.MutationType]?: Dialogue.Mutator<unknown> } = {}
    private actions: { [action in Dialogue.ActionType]?: Dialogue.Action } = {}

    private nodeMutationIds: { [mutatorId in Node.MutatorId['key']]?: Node.Mutator<unknown> } = {}
    private nodeActionIds: { [actionId in Node.ActionId['key']]?: Node.Action<NodeOption> } = {}

    private nodes: {
        // FIXME: remove the 'any' type param
        [nodes in NodeOption]?: BaseNode<NodeOption, MatchRuleType>
    }

    constructor (object: Dialogue.Object<NodeOption, MatchRuleType>, agentContext: Readonly<Agent.Context>, options?: Dialogue.Options) {
        this.ac = agentContext
        this.self = object
        this.options = { verbose: true, ...options } 

        // Build the nodes for the dialogue
        this.nodes = {}
    }

    private get verbose(): boolean {
        return this.options.verbose    
    }

    mutate<AgentMutatedType>(at: Dialogue.MutationType, input: AgentMutatedType) {
        const mutate = this.mutators[at]
        return mutate !== undefined ? mutate(input) : input
    }

    performAction(on: Dialogue.ActionType) {
        const action = this.actions[on]

        if (action !== undefined)
            action().finally(() => console.log("Completed execution"))
    }

    respond<AgentMutatedType>(message: AgentMutatedType, state: Dialogue.NodeMarker<NodeOption> | null = null) {
        const _state: Dialogue.NodeMarker<NodeOption> = state === null ? { node: this.self.start } : state
        let _message: any = message

        // ENTER ACTION: check if the node marked is the first one
        if (_state.node === this.self.start) this.performAction('enter');

        // PREPOCESS MUTATION: Mutate before anyother thing
        _message = this.mutate('preprocess', _message)

        // actual playing around with the nodes

        const _node = this.getNode(_state.node)

        // perform action when leaving the dialogue
        const { goTo } = this.getNodeObject(_state.node)

        // EXIT ACTION: if the node is the last node... then exit
        if (goTo === undefined || goTo === null) this.performAction('exit');

        // POSTPROCESS MUTATION: Mutate as you are leaving the dialogue
        _message = this.mutate('postprocess', _message)
    }

    /**
     * Adding a matcher function bound by a matcher rule
     */
    setMatcher<K, T>(
        matchRule: MatchRuleType, 
        matcher: Dialogue.MatchFunction<K, T>
    ): BaseDialogue<NodeOption, MatchRuleType> {
        // add a matching rule
        if (this.verbose) {
            if (this.matchers[matchRule] !== undefined)
                console.warn(`Replacing existing matching function for rule '${matchRule}'`)
        }

        this.matchers[matchRule] = matcher
        return this
    }

    private setNode<Node extends NodeOption> (nodeId: Node, nodeObject: Dialogue.Node<Node, MatchRuleType>) {
        this.nodes[nodeId] = new BaseNode(nodeObject)
    }

    private getNode<Node extends NodeOption>(nodeId: Node): BaseNode<Node, MatchRuleType> {
        if (this.nodes[nodeId] === undefined) {       
            // create node action id
            this.setNode(nodeId, this.self.nodes[nodeId])
        }

        // FIXME: remove the ts-ignore
        // @ts-ignore
        return this.nodes[nodeId]
    }

    getNodeObject(node: NodeOption): Dialogue.Node<NodeOption, MatchRuleType> {
        return this.self.nodes[node]
    }

    /**
     * Dialogue related operations
     * -------------------------
     */

    setMutation<T>(at: Dialogue.MutationType, mutator: Dialogue.Mutator<T>) {
        if (this.verbose) {
            if (this.mutators[at] !== undefined)
                console.warn(`Replacing the existing dialogue mutation on '${at}'`)
        }
        this.mutators[at] = mutator
    }

    removeMutation(at: Dialogue.MutationType) {
        this.mutators[at] = undefined
    }

    setAction(on: Dialogue.ActionType, action: Dialogue.Action) {
        if (this.verbose) {
            if (this.actions[on] !== undefined)
                console.warn(`Replacing the existing dialogue action on '${on}'`)
        }

        this.actions[on] = action
    }

    removeAction(on: Dialogue.ActionType) {
        this.actions[on] = undefined
    }

    private static createNodeMutationId(at: Node.MutationType): Node.MutatorId {
        return { key: "", at }
    }
    private static createNodeActionId(on: Node.ActionType): Node.ActionId {
        return { key: "", on }
    }
    
    /**
     * Node related operations
     * ------------------------
     */
    setNodeMutation<T>(node: NodeOption, at: Node.MutationType, mutator: Node.Mutator<T>): Node.MutatorId {
        const nodeMutationId = BaseDialogue.createNodeMutationId(at)
        const { key } = nodeMutationId

        const _node = this.getNode(node)
        _node.setMutatorId(at, key)
        this.nodeMutationIds[key] = mutator

        return nodeMutationId
    }

    removeNodeMutation(node: NodeOption, mutatorId: Node.MutatorId) {
        // remove from node
        let _node = this.getNode(node)
        _node.removeMutatorId(mutatorId.at)

        // remove from dialogue
        this.nodeMutationIds[mutatorId.key] = undefined
    }

    setNodeAction(node: NodeOption, on: Node.ActionType, action: Node.Action<NodeOption>): Node.ActionId {
        const nodeActionId = BaseDialogue.createNodeActionId(on)
        const { key } = nodeActionId

        const _node = this.getNode(node)
        _node.setActionId(on, key)
        this.nodeActionIds[key] = action

        return nodeActionId
    }

    removeNodeAction(node: NodeOption, actionId: Node.ActionId) {
        let _node = this.getNode(node)
        _node.removeActionId(actionId.on)

        // remove from dialogue
        this.nodeActionIds[actionId.key] = undefined
    }
}
