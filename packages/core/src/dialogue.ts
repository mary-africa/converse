import { Node, Dialogue } from '../typings/dialogue'
import { Agent } from '../typings/index'


const dynNodeRegex = new RegExp(/[\w-_]*\$[\w-_]*/g)
const replaceRegex = new RegExp(/\$/g)

export class BaseNode<Option extends string, MatchRuleType extends string> {
    private options: Node.Options
    public static GOTO_SELF: Dialogue.GoTo.Self = 0

    /**
     * Identifies what should be done 
     * when entering a node / dialog
     */
    private actionIds: {
        [actionType in Node.ActionType]?:    string
    } = {}
    
    private mutatorIds: {
        [mutationType in Node.MutationType]?: string
    } = {}

    private self: Dialogue.Node<Option, MatchRuleType>

    constructor (node: Dialogue.Node<Option, MatchRuleType>, options?: Partial<Node.Options>) {
        this.self = node
        this.options = { verbose: true, ...options }
    }

    private get verbose(): boolean { return this.options.verbose }

    get text(): string { return this.self.text }
    get object(): Dialogue.Node<Option, MatchRuleType>{ return this.self }
    get matcher(): MatchRuleType | null { return this.self.matcher !== undefined ? this.self.matcher : null }

    mutateId(at: Node.MutationType) { return this.mutatorIds[at] }
    actionId(on: Node.ActionType) { return this.actionIds[on] }

    setMutatorId(at: Node.MutationType, id: string) {
        if (this.verbose) {
            if (this.mutatorIds[at] !== undefined)
                console.warn(`Replacing an existing mutation on '${at}' -> ${this.mutatorIds[at]}`)
        }

        this.mutatorIds[at] = id
    }
    removeMutatorId(at: Node.MutationType) {
        this.mutatorIds[at] = undefined
    }
    
    setActionId(on: Node.ActionType, id: string) {
        if (this.verbose) {
            if (this.actionIds[on] !== undefined)
                console.warn(`Replacing an existing action on '${on}' -> ${this.actionIds[on]}`)
        }

        this.actionIds[on] = id
    }

    removeActionId(on: Node.ActionType) { this.actionIds[on] = undefined }

    /**
     * 
     * @param $ 
     * @returns the next dialogue to visit
     */
    next($?: string | null): Option | null | Dialogue.GoTo.Self {
        const { goTo = null } = this.object

        if ($ === null) { return null }
        if ($ === undefined) { return goTo as Option | null }
        
        if (goTo === null || goTo === undefined) return null
        if (goTo === BaseNode.GOTO_SELF) return BaseNode.GOTO_SELF

        // Convert dynamic to static node
        const out = dynNodeRegex.exec(goTo as string)

        // the next node. doesn't have a 
        // dynamically rendable node key
        if (out === null) return goTo as Option

        // replace '$' with value as next node
        return (goTo as string).replace(replaceRegex, $) as unknown as Option
    }
    
}
 
export default class BaseDialogue<DialogueKey extends string, NodeOption extends string, MatchRuleType extends string> {
    private options: Dialogue.Options
    private readonly ac: Agent.Context
    private self: Dialogue.Object<NodeOption, MatchRuleType>

    private matchers: { [matcher in MatchRuleType]?: Dialogue.MatchFunction<any, any, NodeOption> } = {}

    private mutators: { [mutatorId in Dialogue.MutationType]?: Dialogue.Mutator<unknown> } = {}
    private actions: { [action in Dialogue.ActionType]?: Dialogue.Action } = {}

    private nodeMutationIds: { [mutatorId in Node.MutatorId['key']]?: Node.Mutator<unknown> } = {}
    private nodeActionIds: { [actionId in Node.ActionId['key']]?: Node.Action<NodeOption> } = {}

    private nodes: {
        // FIXME: remove the 'any' type param
        [node in NodeOption]?: BaseNode<NodeOption, MatchRuleType>
    }

    /**
     * Inputs that have been passed in the data
     */
    private nodeInputs: {
        [node in NodeOption]?: any
    } = {}

    constructor (id: DialogueKey, object: Dialogue.Object<NodeOption, MatchRuleType>, agentContext: Readonly<Agent.Context>, options?: Partial<Dialogue.Options>) {
        this.ac = agentContext
        this.self = object
    
        this.options = { id, verbose: true, ...(options) } 
        // Build the nodes for the dialogue
        this.nodes = {}
    }

    private get verbose(): boolean { return this.options.verbose }

    mutate<AgentMutatedType>(at: Dialogue.MutationType, input: AgentMutatedType) {
        const mutate = this.mutators[at]
        return mutate !== undefined ? mutate(input) : input
    }

    async performAction(on: Dialogue.ActionType) {
        const action = this.actions[on]

        if (action !== undefined)
            await action()
    }

    nodeMutate<DialogueMutateType>(nodeMutationId: Node.MutatorId['key'], input: DialogueMutateType) {
        const nodeMutate = this.nodeMutationIds[nodeMutationId]
        return nodeMutate !== undefined ? nodeMutate(input) : input
    }

    async nodeAct(nodeActionId: Node.ActionId['key']) {
        const nodeFn = this.nodeActionIds[nodeActionId]
        if (nodeFn !== undefined) {
            await nodeFn({
                inputs: this.nodeInputs,
                agentContext: this.ac
            })
        }
    }

    respond<AgentMutatedType>(
        message: AgentMutatedType, 
        node: NodeOption | null = null
    ): { output: string, node: NodeOption | string | null | number } {
        const nodeId = node === null ? this.self.start : node
        let _message: any = message

        /**
         * ENTER DIALOGUE
         */
        // DIALOGUE ENTER-ACTION: check if the node marked is the first one
        if (node === null) this.performAction('enter');

        // DIALOGUE PREPROCESS: Mutate before anyother thing
        _message = this.mutate('preprocess', _message)

        /**
         * ENTER NODE
         */
        // actual playing around with the nodes
        const _node = this.getNode(nodeId)

        if (node === null) {
            // NODE ENTER-ACTION
            const nodeEnterActionId = _node.actionId('enter')
            if (nodeEnterActionId !== undefined) 
                this.nodeAct(nodeEnterActionId)

            return { 
                output: _node.text,

                // get the next node 
                node: this.self.start
            }
        }       

        // NODE PREPROCESS
        const preprocessId = _node.mutateId('preprocess')
        if (preprocessId !== undefined)
            _message = this.nodeMutate(preprocessId, _message)


        // get the goTo logic
        let goToNode: NodeOption | null | Dialogue.GoTo.Self = null

        if (_node.matcher !== null) {
            // Using matcher to make a decision on the input

            const dialogMatcher = this.matchers[_node.matcher]
            if (dialogMatcher === undefined) {
                throw Error(`Node has matcher ('${_node.matcher}'), but matcher function is not create in dialogue`)
            }

            const _out: NodeOption | string | Dialogue.GoTo | null = dialogMatcher(_message, this.options, this.ac)

            if (_out === BaseNode.GOTO_SELF) {
                // get node
                console.warn("Pointing to self")
                throw new Error("HERE!!!")
            }

            goToNode = _node.next(_out)

        } else {
            goToNode = _node.next()
        }

        if (goToNode !== null) {
            // check if the node exist
            if (goToNode in this.nodes) {
                console.warn(`The node '${goToNode}' doesn't exit in this dialogue`)
                console.warn('Resetting to NULL')
                // reset to null
                goToNode = null
            }
        }

        console.log("GoTo node:", goToNode)
        

        /**
         * LEAVING NODE
         */
        // NODE POSTPROCESS
        // const postProcessId = _node.mutateId('postprocess')
        // if (postProcessId !== undefined) 
        //     _message = this.nodeMutate(postProcessId, _message)
        

        // NODE EXIT-ACTION
        const nodeExitActionId = _node.actionId('exit')
        if (nodeExitActionId !== undefined) 
            this.nodeAct(nodeExitActionId)

        // // DIALOGUE POSTPROCESS: Mutate as you are leaving the dialogue
        // _message = this.mutate('postprocess', _message)

        /**
         * LEAVING DIALOGUE
         */

        // DIALOGUE EXIT-ACTION: if the node is the last node... then exit
        if (goToNode === null) this.performAction('exit');

        return {
            // output of the next message
            output: _node.text,

            // the new node to work on
            node: goToNode
        }
    }

    /**
     * Adding a matcher function bound by a matcher rule
     */
    setMatcher<K, T>(
        matchRule: MatchRuleType, 
        matcher: Dialogue.MatchFunction<K, T, NodeOption>
    ): BaseDialogue<DialogueKey, NodeOption, MatchRuleType> {
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
