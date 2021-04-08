import { Dialogue } from "./dialogue"

export interface IDialogueNode<DNodeType> {
    key: DNodeType,
    getText: () => string,
    next: () => DNodeType | string | null
    execute: DialogueCallback,
    matchInput: (input: string) => Promise<{[x: string]: string}>
    nextStaticNodeKey: (valObj: {[valKey in string]: InputOption}) => DNodeType | null
}

export type DialogueObjectType<DNode> = Dialogue<DNode>

interface IDialogueSelector<DNodeType>  {
    selectNode: (marker: DialogueSequenceMarker<DNodeType>) => IDialogueNode<DNodeType> | null
    nextNodeMarker: (currentMarker: DialogueSequenceMarker<DNodeType>) => DialogueSequenceMarker<DNodeType | string> | null
}

export type IntentionTexts<IntentType extends string> = { [key in IntentType]: Array<string> }
export type Responses<IntentType extends string> = { [key in IntentType]: string}
