import axios from 'axios'
import { IntentionTexts } from '../typings/core.d'

/**
 * Performs the intent classification to return the matched code
 */
export async function encode<IntentType extends string>(
    message: string, 
    intentData: IntentionTexts<IntentType>, 
    baseNenaApi: string,
    apiKey: string
): Promise<null | IntentType> {
    const intentions: Array<IntentType> = Object.keys(intentData) as unknown as IntentType[]

    const response = await axios({
        method: 'POST',
        url: `${baseNenaApi}/api/tasks/intents/knn`,
        data: JSON.stringify({
            apiKey,
            payload: {
                text: message,
                intentions,
                intent_texts: intentions.map(x => intentData[x])
            }
        }),
        headers: {
            'content-type': 'application/json; text-charset=utf-8'
        }
    })

    const { results: intent_index, info } = response.data
    const { intents } = info

    if (intent_index === null) {
        return null
    }
    
    return intents[intent_index]
}