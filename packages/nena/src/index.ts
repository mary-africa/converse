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
