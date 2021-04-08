import { Dialogue as IDialogueDefinition, DialogueCallback, DialogueItem, InputOption } from '../../typings/dialogue'
import { nlpMatchRule as ApiNlpMatchRule, levenshteinMatchRule } from '../utils'

import { DialogueSequenceMarker } from '../../typings'
import { IDialogueNode, DialogueObjectType, IDialogueSelector } from '../../typings/core'

/**
 * Build the dialogue object from definition to construct certain things
 * @param dialogueDefinition definition object with the information
 */
export const DialogueObject = <DNode> (dialogueDefinition: IDialogueDefinition<DNode>): DialogueObjectType<DNode> => {
    // get the concerned dialog
    return dialogueDefinition
}

/**
 * 
 */

export const InitDialogueNode = (baseNenaApi: string, apiKey: string) => <DNode> (key: DNode, item: DialogueItem<DNode>) => BaseDialogueNode(key, item, baseNenaApi, apiKey)
const BaseDialogueNode = <DNode> (key: DNode, item: DialogueItem<DNode>, baseNenaApi: string, apiKey: string): IDialogueNode<DNode> => {
    const getText = (): string => item.q.toString().trim()
    const execute: DialogueCallback = item.callback !== undefined ? item.callback : async () => { console.log("Nothing to execute here")}
    
    // tries to match the input according to the rule set by the user
    const matchInput = async (input: string): Promise<{[x: string]: string}> => {
        // checking the options
        if (item.input === undefined) {
            console.log("There is no input definition. Ignored doing any form of matching")
            return {}
        }

        // output object
        const matchOutput: { [x: string]: string }  = {}

        const { type = 'exact', name, options, match_rule } = item.input
        switch (type) {
            case 'exact':
                // this is the exact input
                matchOutput[name] = input
                break;
            case 'string-match':
                if (match_rule === undefined) {
                    throw new Error("If `string-match` options is set, `match_rule` must be defined")
                }

                // ensure that `options` exist
                // enforcing rules on options
                if (options === undefined) {
                    throw new Error("Make sure that the `options` are defined")
                }
                
                if (options.length <= 1) {
                    throw new Error("Options have atleast 2 items")
                }

                /**
                 * Making checks for the match rule
                 */

                switch (match_rule){
                    case 'nlp':
                        const nlpMatchRule = ApiNlpMatchRule(baseNenaApi, apiKey)
                        matchOutput[name] = options[await nlpMatchRule(input, options)].toString()
                        break;
                    case 'levenstein':
                        matchOutput[name] = options[levenshteinMatchRule(input, options)].toString()
                        break;
                    default:
                        console.log("Assuming you have defined match_handler")
                        try {
                            matchOutput[name] = options[match_rule(input, options)].toString()
                        } catch (err) {
                            throw new Error("Unable to use the custom defined match rule. Make sure `match_rule` handler is of shape (message: string, options: InputOptions) => keyof InputOptions")
                        }
                }
        }

        return matchOutput
    }

    const nextStaticNodeKey = (valMap: { [x: string]: InputOption }): DNode | null => {
        if (item.next === undefined) {
            return null
        }

        // Convert dynamic to static node
        const eReg = RegExp(/[\w-_]*\[(?<var>[\w-_]+)\][\w-_]*/g)
        const out = eReg.exec(item.next as string)

        if (out === null) {
            // the next node. doesn't have a 
            // dynamically rendable node key
            return item.next as DNode
        }

        if (out.groups === undefined) {
            throw new Error("Unable to extract group with Regex for next node key string")
        }
        
        const matchedVar = out.groups?.var
        const inputValToReplace = matchedVar in valMap ? valMap[matchedVar]: '<UNDEFINED>'

        // replacement operation
        var _r = new RegExp(/\[[\w-_]+\]/g);
        const staticRenderedNode = (item.next as string).replace(_r, inputValToReplace) as unknown as DNode
        
        return staticRenderedNode
    }

    return ({
        key,
        getText,
        execute,
        matchInput,
        nextStaticNodeKey,
        next: () => item.next !== undefined ? item.next : null
    })
} 

export function DialogueSelector <DNodeType, DialogueKey extends string>(
    sequences: Array<DialogueKey>, 
    DialogueMap: { 
        [dialogueKey in DialogueKey]: DialogueObjectType<DNodeType>
    },
    credentials: { baseNenaApi: string, apiKey: string }
): IDialogueSelector<DNodeType> {
    const DialogueNode = InitDialogueNode(credentials.baseNenaApi, credentials.apiKey)

    const selectDialogue = (markerIndex: number): DialogueObjectType<DNodeType> | null => {
        if (markerIndex <= sequences.length - 1) {
            return DialogueMap[sequences[markerIndex]]
        }

        // here, there is no dialogue to get
        return null
    }
    
    /**
     * Selects a dialogue in the sequence
     * @param marker object that identifies the dialogue in the sequence
     */
    const selectNode = (marker: DialogueSequenceMarker<DNodeType>): IDialogueNode<DNodeType> | null => {
        const { index, node } =  marker

        console.log("Selected Marker:", marker)
        const dialogueObject = selectDialogue(index)

        // TODO: this should be defined in the dialog object
        // get the dialogueNode
        if (dialogueObject === null) {
            return null
        }

        if (node === undefined) {
            return DialogueNode(dialogueObject.start as DNodeType, dialogueObject.nodes[dialogueObject.start])
        }

        // @ts-ignore
        return DialogueNode(node, dialogueObject.nodes[node])
    }

    const nextNodeMarker = (currentMarker: DialogueSequenceMarker<DNodeType>): DialogueSequenceMarker<DNodeType | string> | null => {
        const {index} = currentMarker

        // checks if the current node has pointer to next node
        //  in the same dialogue object
        const currentDialogueNode = selectNode(currentMarker)
        const hasNext = currentDialogueNode !== null ? currentDialogueNode.next() !== null : false
        
        if (hasNext) {
            // has a next node:
            return ({
                index,
                node: currentDialogueNode?.next() as DNodeType
            })
        }

        // check the next item in the sequenceList
        
        // if there is no items in sequenceList, return null
        if (index + 1 <= sequences.length - 1) {
            // there is another item in the sequenceList,
            //  return the next item
            return {
                index: (index + 1),
            } as DialogueSequenceMarker<DNodeType>
        } else {
            // if there is not next item in the sequence
            return null
        }
    }

    return ({
        selectNode,
        nextNodeMarker,
        // nextNode
    })
}
