/**
 * Make simple tests
 * ---------------
 */
const Agent = require('../lib').default

 const ddo = {
    fallbackText: "This is a fallback text",
    dialogues: {
        'tutDiag': {
            start: 't01',
            nodes: {
                t01: {
                    text: "Nigependa kukutambulisha kwa rafiki yangu aitwaee Juma..",
                    goTo: 't02'
                },
                t02: {
                    text: "Leo, Juma amuza mahindi yenye thamani ya Tsh5000.",
                    goTo: 't03',
                },
                t03: {
                    text: "Haya, imetosha. Ungependa kurudia?",
                    matcher: "yes_no",
                    goTo: '$'
                }
            }
        },
        'assessmentDiag': {
            start: 'a01',

            // FIXME: make sure this is reflected in
            //  the typings of the application
            mutations: {
                preprocess: 'lowercase'
            },
             nodes: {
                a01: {
                    text: `text from a01`,
                    matcher: 'multichoice',
                    with: {
                        answer: 'a',
                        options: [ "a", "b", "c"]
                    },
                    goTo: 'a01'
                    },
                a02: {
                    text: `text from a02`,
                    matcher: 'multichoice',
                    with: {
                        answer: 'a',
                        options: [ "a", "b", "c"]
                    },
                    goTo: 'a01'
                },
                a03: {
                    text: `text from a03`,
                },
                a04: {
                    text: "last text-assessment dialog. yes or no",
                    matcher: 'yes_no'
                }
             }
 
         }  
     },
     intentions: {
        'greet': {
            toMatch: ['salama', 'habari', 'jasiri'],
            response: 'Habari zako kijani!',
        },
        'tutorial': {
            toMatch: ["nifundishe", "bijasiri fundisha", "nifundishe bijasiri"],
            dialogueKey: 'tutDiag',
        },
        'assessment': {
            toMatch: 'swali',
            dialogueKey: 'assessmentDiag',
        }
    },
}
 
const agent = new Agent(ddo, { 
    matchRules: ['intent', 'multichoice', 'yes_no'],
}, { name: "BestBot" })


agent.setMutation('preprocess', (input) => input.trim().toLocaleLowerCase())
agent.dialogue('assessmentDiag')
    .setMatcher('multichoice', (input, options, context) => {
        if (input === options.answer) {
            return 't03'
        }

        // points to the same node
        return Agent.DIALOGUE_GOTO_SELF
    })
    .setMatcher('yes_no', (input, options, context) => {
        if (input === 'ndiyo' || input === 'hapana') {
            // something is here
            console.log("Something is here!")
        }

        // if there is no return...
        // reset
        return Agent.DIALOGUE_GOTO_SELF
    })
    .setAction('enter', async () => {
        // Doing some actions
        // when entering the dialogue
    })
    
agent.dialogue('assessmentDiag')
    .setNodeAction('a04', 'exit', async (context) => {
        // something
        // mark something as completed
    })


/**
 * Testing to see if the agent will actually greet
 */
test('Trying "habari" on a bot', async () => {
    // actually using the bot
    expect(await agent.chat("habari", {}))
        .toStrictEqual({"output": "Habari zako kijani!", "state": { intent: "greet" }})
});
