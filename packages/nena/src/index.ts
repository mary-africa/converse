// what's `converse-core`
import BaseAgent from '../../core'
import ConverseDialogue from '../../core/typings/dialogue'

class ConverseNenaAgent<Intent extends string, DialogueKey extends string, DialogueMatchRuleType extends string> extends BaseAgent<Intent, DialogueKey, DialogueMatchRuleType> {
    dialogue<T>(dialogueKey: DialogueKey): ConverseDialogue<DialogueKey, T, DialogueMatchRuleType> {
        // @ts-ignore
        return {}
    }
}

export default ConverseNenaAgent
