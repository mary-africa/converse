export type DialogueNodeInput = string | InputOption
export type DialogueCallback = (input: DialogueNodeInput) => Promise<void>

/**
 * The main dialogue object interface.
 */
export interface Dialogue<DialogueNodeOption, ActionType extends string> {
    start: DialogueNodeOption

    nodes: {
        [node in DialogueNodeOption]: DialogueItem<DialogueNodeOption, ActionType>
    }
}

type InputOption = string
type InputOptions = Array<InputOption>

/**
 * Information about the dialog node.
 */
export interface DialogueItem<NodeOption, ActionType extends string> {
    /**
     * The text to show as text
     */
    q: string

    input?: {
        /**
         * Indentifier of the input
         */
        name: string
        /**
         * 
         */
        type?:
            /**
             * this is when you take the entire 
             * user input as a string. This can be handy for large inputs
             * Or input that you dont want to do any other further processing
             * on the NLP side (like intent matching)
             * 
             * For example:
             * Bot: What is your email address (take input type: exact)
             * User: myname@domain.com  
             * 
             * This would take the entire input, even if it might have some 
             * dirt in it, in totallity
             * 
             * NOTE: Using this WILL IGNORE the input options even if they
             * are indicated
             */
            | 'exact' // DEFAULT

            /**
             * This would mean that you want to match the input of the user
             * with some matching rule. All match rules will return an index 
             * from the indicated options 
             * 
             * NOTE: `options` MUST have items
             */
            | 'string-match'

        match_rule?: 
            /**
             * Matching by performing intent matching.
             * And this is best for the inputs that are more string like
             */
            | 'nlp' 

            /**
             * Using the string edit distance Lenvenstein method
             * to determine the best value
             * 
             * TODO: should include call back for when a different
             * value is chosen
             */
            | 'levenstein'

            /**
             * Custom rule to match the items in the list
             */
            | 
                (
                    /**
                     * @param str the message passed by the client
                     * @param options the list of options indicated
                     * @returns index of the items among the option
                     */
                    (str: string, options: InputOptions) => keyof InputOptions
                ),
        options?: InputOptions
    }

    /**
     * actionType to point to the action to be executed
     */
    action?: ActionType

    /**
     * Nature: Static / Dynamic
     * 
     * This can either be the next sequence node to work from
     */
    next?: NodeOption | string
}

