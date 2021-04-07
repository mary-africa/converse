import axios from 'axios'

/**
 * Type for defining the intentions ->  texts map
 */
export type IIntention<IntentType extends string> = { [key in IntentType]: Array<string> }

/**
 * Performs the intent classification to return the matched code
 */
export async function encode<IntentType extends string>(message: string, intentData: IIntention<IntentType>): Promise<null | IntentType> {
    const intentions: Array<IntentType> = Object.keys(intentData) as unknown as IntentType[]

    const response = await axios({
        method: 'POST',
        url: `${process.env.NENA_API_BASE_URL}/api/tasks/intents/knn`,
        data: JSON.stringify({
            apiKey: process.env.NENA_API_KEY,
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