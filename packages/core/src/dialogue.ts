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
 
export default class BaseDialogue<NodeOption extends string, MatcherRuleType extends string> {
    private options: Dialogue.Options
    private ac: Agent.Context
    private self: Dialogue.Object<NodeOption, MatcherRuleType>

    private mutators: { [mutatorId in Dialogue.MutationType]?: Dialogue.Mutator<unknown> } = {}
    private actions: { [action in Dialogue.ActionType]?: Dialogue.Action } = {}

    private nodeMutationIds: { [mutatorId in Node.MutatorId['key']]?: Node.Mutator<unknown> } = {}
    private nodeActionIds: { [actionId in Node.ActionId['key']]?: Node.Action<NodeOption> } = {}

    private nodes: {
        // FIXME: remove the 'any' type param
        [nodes in NodeOption]?: BaseNode<NodeOption, MatcherRuleType>
    }

    constructor (object: Dialogue.Object<NodeOption, MatcherRuleType>, agentContext: Agent.Context, options?: Dialogue.Options) {
        this.ac = agentContext
        this.self = object
        this.options = { verbose: true, ...options } 

        // Build the nodes for the dialogue
        this.nodes = {}
    }

    private get verbose(): boolean {
        return this.options.verbose    
    }

    private setNode<Node extends NodeOption> (nodeId: Node, nodeObject: Dialogue.Node<Node, MatcherRuleType>) {
        this.nodes[nodeId] = new BaseNode(nodeObject)
    }

    private getNode<Node extends NodeOption>(nodeId: Node): BaseNode<Node, MatcherRuleType> {
        if (this.nodes[nodeId] === undefined) {       
            // create node action id
            this.setNode(nodeId, this.self.nodes[nodeId])
        }

        // FIXME: remove the ts-ignore
        // @ts-ignore
        return this.nodes[nodeId]
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
