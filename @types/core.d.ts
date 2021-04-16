import { Dialogue, DialogueItem } from "./dialogue"

export interface IDialogueNode<DNodeType, ActionType extends string> {
    key: DNodeType,
    self: DialogueItem<DNodeType, ActionType>,
    actionType: ActionType | null,
    getText: () => string,
    next: () => DNodeType | string | null
    matchInput: (input: string) => Promise<{[x: string]: string}>
    nextStaticNodeKey: (valObj: {[valKey in string]: InputOption}) => DNodeType | null
}

export type DialogueObjectType<DNode, ActionType extends string> = Dialogue<DNode, ActionType>

interface IDialogueSelector<DNodeType>  {
    selectNode: (marker: DialogueSequenceMarker<DNodeType>) => IDialogueNode<DNodeType> | null
    nextNodeMarker: (currentMarker: DialogueSequenceMarker<DNodeType>) => DialogueSequenceMarker<DNodeType | string> | null
}

export type IntentionTexts<IntentType extends string> = { [key in IntentType]: Array<string> }
export type Responses<IntentType extends string> = { [key in IntentType]: string}
