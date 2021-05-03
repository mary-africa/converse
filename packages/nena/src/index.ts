import { 
    Dialogue as CoreDialogue, 
    DialogueItem as CoreDialogueItem,
    DDO as CoreDDO,
    MatchRule
} from '../../core/src'

/**
 * The main dialogue object interface.
 */
export interface Dialogue<DialogueNodeOption extends string> extends CoreDialogue<DialogueNodeOption> {

    nodes: {
        [node in DialogueNodeOption]: DialogueItem<DialogueNodeOption>
    }
}


type InputOption = string
type Input = InputOption | InputOption[]
type InputOptions = { [x: string]: Input } | Array<Input>

/**
 * Information about the dialog node.
 */
export interface DialogueItem<NodeOption> extends CoreDialogueItem<NodeOption> {
    input?: CoreDialogueItem<NodeOption>['input'] & {
        matchRule?: NenaMatchRule
        options?: InputOptions
    }
}

type NenaMatchRule = 'intent' | 'levenstein' | MatchRule

/**
 * DDO with Nena enhancements
 */
interface DDO<IntentType extends string, DialogueKey extends string | number> extends CoreDDO<IntentType, DialogueKey> {
    dialogues: {
        [key in DialogueKey]: Dialogue<any>
    }
    /**
     * Definition when dialogue is 'exit'
     * added 'intent' | 'levenshtein'
     */
    exit: CoreDDO<IntentType, DialogueKey>['exit'] & {
        method?: NenaMatchRule
    }
}

type Intent = 'greet' | 'tutorial' | 'assessment'
type DialogueKey = 'tutDiag' | 'assessmentDiag'


export default <DDO<Intent, DialogueKey>> {
    dialogues: {
        'tutDiag': {},
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
