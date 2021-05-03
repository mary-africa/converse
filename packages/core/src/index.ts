export type DialogueNodeInput<T> = string | T
export type DialogueCallback = <T> (input: DialogueNodeInput<T>) => Promise<void>

/**
 * The main dialogue object interface.
 */
export interface Dialogue<DialogueNodeOption extends string> {
    start: DialogueNodeOption

    nodes: {
        [node in DialogueNodeOption]: DialogueItem<DialogueNodeOption>
    }
}

/**
 * Information about the dialog node.
 */
export interface DialogueItem<NodeOption> {
    /**
     * The text to show as text
     */
    text: string

    input?: {
        /**
         * Indentifier of the input
         */
        name: string
    }

    /**
     * Nature: Static / Dynamic
     * 
     * This can either be the next sequence node to work from
     */
    next?: NodeOption | string
}

export type MultValType<T> = T | T[]
export type MatchRule = 'exact'  // default: 'exact'

/**
 * Item description for the DDO
 */
export interface DDOItem<DialogueKey extends string | number> {
    /**
     * This is skipped when there is dialogue
     */
    response: string

    /**
     * string(s) to match the intention
     */
    match: MultValType<string>

    /**
     * Dialogue keys from the dialogue object
     */
    dialogueKey: MultValType<DialogueKey>

    /**
     * method of making the matches
     */
    method?: MatchRule
}

type DDOItemResponse = Omit<DDOItem<DialogueKey>, "dialogueKey">
type DDOItemDKey = Omit<DDOItem<DialogueKey>, "response">

/**
 * Main definition of the dialogue
 */
export interface DDO<IntentType extends string, DialogueKey extends string | number> {
    /**
     * Dialogues
     */
    dialogues: { [key in DialogueKey]: Dialogue<any> }
    
    /**
     * Intentions
     */
    intentions: { [intent in IntentType]: DDOItemResponse | DDOItemDKey }
    // intentions: { [intent in IntentType]: DDOItem<DialogueKey>}

    /**
     * Definition when dialogue is 'exit'
     */
    exit: {
        response?: string
        match: MultValType<string>
        method?: MatchRule
    }

    /**
     * Response Text for when there are no intentions matched
     */
    fallbackText: string
}

type Intent = 'greet' | 'tutorial' | 'assessment'
type DialogueKey = 'tutDiag' | 'assessmentDiag'


export default <DDO<Intent, DialogueKey>> {
    dialogues: {
        'tutDiag': {},  // TODO: Add the proper dialogues
        'assessmentDiag': {}  
    },
    intentions: {
        // notice this doesn't have dialogue
        'greet': {
            match: ['salama', 'habari', 'jasiri'],
            response: 'Habari zako kijani!',
        },
        'tutorial': {
            match: ["nifundishe", "bijasiri fundisha", "nifundishe bijasiri"],
            dialogueKey: 'tutDiag',
        },
        'assessment': {
            match: 'swali',
            dialogueKey: 'assessmentDiag',
        }
    },
    exit: {
        match: 'imetosha',
        method: 'exact'
    }
}
