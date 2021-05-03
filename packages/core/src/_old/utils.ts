import { WritableDraft } from 'immer/dist/internal'
import { DialogueSequenceMarker } from '../../@types/old'
import { encode } from './core/encoder'
import { InputOptions } from '../../@types/old/dialogue'

const levenshtein = require('js-levenshtein');

/**
 * Updates the state / memory used to convey context in
 * the chat.
 *
 * This contains the rules for how the state is updated
 * in the chat
 */
export function stateUpdater<TState, TEncodeVal, TDialogueSequence>(
    state: WritableDraft<TState>, 
    encoding: TEncodeVal, 
    sequence: { 
        prev?: null | DialogueSequenceMarker<TDialogueSequence>,
        curr?: null | DialogueSequenceMarker<TDialogueSequence | string>
    } = {}): WritableDraft<TState> {
    
    return state
}



/**
 * Default index for the nlp matching
 */
const DEFAULT_INDEX = 0

export const nlpMatchRule = (baseNenaApi: string, apiKey: string) => async (message: string, options: InputOptions) => {
     const optDataMap: {[x: string]: Array<string>} = {}
     const dataIndices: {[x: string]: number} = {}
     
     // build input map for intent matching
     options.map((v, ix) => {
         const dataIndex = `INPUT-DATA-${ix}`
 
         optDataMap[dataIndex] = [v]
         dataIndices[dataIndex] = ix
     })
     
     const _encoding = await encode(message, optDataMap, baseNenaApi, apiKey)
     
     if (_encoding === null) {
         throw new Error(`Unable to match input: \ntext: ${message} | inputs: [${options.join(", ")}]`)
     }
     
     return dataIndices[_encoding] || DEFAULT_INDEX
 }
 
export const levenshteinMatchRule = (message: string, options: InputOptions) => {
     // build input map for intent matching
     const similarities: Array<number> = options.map(v => 1 / levenshtein(message.trim(), v.trim()))
     
     // Arg min (from code snippet)
     return similarities.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
 }
 
