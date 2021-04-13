import { IDialogueDefinitionObject } from '../../typings/ddo.d'
import { IntentType } from './typings.d'

// Dialogues
import BaseDialogue from './dialogues/base.diag'
import FillUpTaxFormDialogue from './dialogues/fill-up-tax-form.diag'


const ddo = <IDialogueDefinitionObject<IntentType, 'NEVER_MIND'>> {
    nevermindIntent: 'NEVER_MIND',
    intentions: [ 'BASE_BIJASIRI_FLOW', 'GREETINGS', 'FILL_UP_FORM' ],
    intentionTexts: {
        'GREETINGS': [ 'Hi', 'Habari', 'Habari', 'za kwako'],
        'FILL_UP_FORM': [ 'Napenda kujaza fomu kodi', 'nataka kujaza fomu kodi', 'jaza kodi fomu' ],
        'BASE_BIJASIRI_FLOW': [ 'bijasiri kwanza' ],
        'NEVER_MIND': [ 'nataka kujua kuhusu kitu kingine' ],
    },
    responses: {
        'GREETINGS': "Habari, unaendeleaje. Mimi niniaitwa BiJasiri. Ungependa kujua nini?",
        'NEVER_MIND': "Sawa! Unaweza kuniuliza kuhusu kitu kingine.",        
    },
    sequences: {
        'BASE_BIJASIRI_FLOW': BaseDialogue,
        'FILL_UP_FORM': FillUpTaxFormDialogue,
    },

}

export = ddo