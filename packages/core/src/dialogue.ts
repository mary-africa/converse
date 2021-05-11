import { Node, Dialogue } from '../typings/dialogue'
import { Agent } from '../typings/index'


const dynNodeRegex = new RegExp(/[\w-_]*\$[\w-_]*/g)
const replaceRegex = new RegExp(/\$/g)

export const NODE_GOTO_SELF: Dialogue.GoTo.Self = 0

export class BaseNode<Option extends string, MatchRuleType extends string> {
    private options: Node.Options
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
    next($?: string | null): Option | null {
        const { goTo = null } = this.object

        if ($ === null) { return null }
        if ($ === undefined) { return goTo as Option | null }
        
        if (goTo === null || goTo === undefined) return null

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

    private matchers: { [matcher in MatchRuleType]?: Dialogue.MatchFunction<any, any, NodeOption, any> } = {}

    private mutators: { [mutatorId in Dialogue.MutationType]?: Dialogue.Mutator<unknown> } = {}
    private actions: { [action in Dialogue.ActionType]?: Dialogue.Action<NodeOption, any> } = {}

    private nodeMutationIds: { [mutatorId in Node.MutatorId['key']]?: Node.Mutator<unknown> } = {}
    private nodeActionIds: { [actionId in Node.ActionId['key']]?: Node.Action<NodeOption, any> } = {}

    private nodes: {
        [node in NodeOption]: BaseNode<NodeOption, MatchRuleType>
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

        this.nodes = {} as {[node in NodeOption]: BaseNode<NodeOption, MatchRuleType>}
        console.log("Building dialogue:", id)
        Object.keys(object.nodes).forEach((val) => {
            console.log(" NODE >", val)
            this.nodes[val as NodeOption] = new BaseNode(object.nodes[val as NodeOption])
        })

    }

    private get verbose(): boolean { return this.options.verbose }

    mutate<AgentMutatedType>(at: Dialogue.MutationType, input: AgentMutatedType) {
        const mutate = this.mutators[at]
        return mutate !== undefined ? mutate(input) : input
    }

    async performAction<T>(on: Dialogue.ActionType, actionData?: T) {
        const action = this.actions[on]

        if (action !== undefined)
            await action(this.dialogueContext, actionData)
    }

    nodeMutate<DialogueMutateType>(nodeMutationId: Node.MutatorId['key'], input: DialogueMutateType) {
        const nodeMutate = this.nodeMutationIds[nodeMutationId]
        return nodeMutate !== undefined ? nodeMutate(input) : input
    }

    get dialogueContext () {
        return {
            inputs: this.nodeInputs,
            agentContext: this.ac
        }
    }

    async nodeAct<T>(nodeActionId: Node.ActionId['key'], actionData?: T) {
        const nodeFn = this.nodeActionIds[nodeActionId]
        if (nodeFn !== undefined) {
            await nodeFn(this.dialogueContext, actionData)
        }
    }

    respond<AgentMutatedType, AT, MatchCallback extends Function>(
        message: AgentMutatedType, 
        node: NodeOption | null = null,
        use?: {actionData?: AT, matchCallback?: MatchCallback}
    ): null | { output: string, node: NodeOption } {
        const nodeId = node === null ? this.self.start : node
        let _message: any = message

        // Initiating the actionData and matchCallback
        const { actionData = undefined, matchCallback = undefined } = use || {}

        /**
         * ENTER DIALOGUE
         */
        // DIALOGUE ENTER-ACTION: check if the node marked is the first one
        if (node === null) this.performAction('enter', actionData);

        // DIALOGUE PREPROCESS: Mutate before anyother thing
        _message = this.mutate('preprocess', _message)

        /**
         * ENTER NODE
         */
        // actual playing around with the nodes
        const _node = this.getNode(nodeId)

        // NODE ENTER-ACTION
        const nodeEnterActionId = _node.actionId('enter')
        if (nodeEnterActionId !== undefined) 
            this.nodeAct(nodeEnterActionId, actionData)

        if (node === null) {
            return { 
                output: _node.text,

                // get the next node 
                node: nodeId
            }
        }       

        // NODE PREPROCESS
        const preprocessId = _node.mutateId('preprocess')
        if (preprocessId !== undefined)
            _message = this.nodeMutate(preprocessId, _message)

        // get the goTo logic
        let goToNode: NodeOption | null = null

        if (_node.matcher !== null) {
            // Using matcher to make a decision on the input

            const dialogMatcher = this.matchers[_node.matcher]
            if (dialogMatcher === undefined) {
                throw new Error(`Node has matcher ('${_node.matcher}'), but matcher function is not created with dialogue`)
            }

            console.log("Matcher present:", _node.matcher)
            const _out: NodeOption | string | Dialogue.GoTo | null | void = dialogMatcher(_message, this.options, this.ac, matchCallback)

            
            if (_out !== NODE_GOTO_SELF) {
                goToNode = _node.next(_out === void 0 ? undefined : _out)
                console.log("Pointing to the next node:", goToNode)
            } else {
                goToNode = nodeId
                console.log("Pointing to self:", nodeId)
            }
        } else {
            goToNode = _node.next()
            console.log("Missing Matcher", "Getting next", goToNode)
        }

        if (goToNode !== null) {
            // check if the node exist
            if (!(goToNode in this.nodes)) {
                console.warn(`The node '${goToNode}' doesn't exit in this dialogue`)
                console.warn('Resetting to NULL')
                // reset to null
                goToNode = null
            }
        }        

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
            this.nodeAct(nodeExitActionId, actionData)

        // // DIALOGUE POSTPROCESS: Mutate as you are leaving the dialogue
        // _message = this.mutate('postprocess', _message)


        return goToNode !== null ? 
            ({
                // output of the next message
                output: this.getNode(goToNode).text,

                // the new node to work on
                node: goToNode
            }) : null
    }

    /**
     * Adding a matcher function bound by a matcher rule
     */
    setMatcher<K, T, MatchCallback extends Function>(
        matchRule: MatchRuleType, 
        matcher: Dialogue.MatchFunction<K, T, NodeOption, MatchCallback>
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
        return this
        
    }

    removeMutation(at: Dialogue.MutationType) {
        this.mutators[at] = undefined
    }

    setAction<T>(on: Dialogue.ActionType, action: Dialogue.Action<NodeOption, T>) {
        if (this.verbose) {
            if (this.actions[on] !== undefined)
                console.warn(`Replacing the existing dialogue action on '${on}'`)
        }

        this.actions[on] = action
        return this
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

    setNodeAction<T>(node: NodeOption, on: Node.ActionType, action: Node.Action<NodeOption, T>): Node.ActionId {
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
