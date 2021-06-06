/**
 * Test to check if it can recover
 * from a failed message
 */
const Agent = require('../lib').default

const FALLBACK_TEXT = "<fallback>"
const ORDER_DIALOGUE_KEY = 'orderDialogue'

const agent = new Agent({
    fallbackText: FALLBACK_TEXT,
    intentions: {
        'greet': {
            toMatch: [ "shwari", "freshi", "salama" ],
            response: "habari boss."
        },
        'order': {
            toMatch: [ "nataka kuoda", "order", "naomba kitu" ],
            dialogueKey: ORDER_DIALOGUE_KEY
        }
    },
    dialogues: {
        orderDialogue: {
            start: 'ask',
            nodes: {
                ask: {
                    text: "Unangependa kuorder nini? Weka chaguo moja hapa kati ya juice, keki",
                    matcher: 'exact_matcher',
                    with: {
                        options: [ 'juice', 'keki' ],
                        nextVariant: true
                    },
                    goTo: "$"
                },
                juice: {
                    text: "Kinywaji kubwa au ndogo?",
                    matcher: 'exact_matcher',
                    with: {
                        options: [ 'kubwa', 'ndogo' ]
                    },
                    goTo: "final"
                },
                keki: {
                    text: "Keki ngumu au laini?",
                    matcher: 'exact_matcher',
                    with: {
                        options: [ 'ngumu', 'laini' ]
                    },
                    goTo: "final"
                },
                final: {
                    text: "Asante, vitu vyako vinakuja soon"
                }
            }
        }
    }
})

agent.setMutation('preprocess', input => input.trim().toLowerCase())
agent.dialogue('orderDialogue')
    .setMatcher('exact_matcher', (input, opts, _c, fn) => {
        if (!opts.options.includes(input)) { 
            fn()
            return Agent.DIALOGUE_GOTO_SELF
        }

        // check the option items
        if (Boolean(opts.nextVariant)) {
            return input
        }
    })


describe("Recovering from mismatch input", () => {
    test("Basic dialogue test", () => {
        agent.chat("shwari", {})
            .then(response => {
                expect(response).toStrictEqual({
                    output: "habari boss.",
                    state: { intent: "greet" }
                })
            })
    })

    test("Sanity Keki selection check test", async function (done) {
        try {
            const state = { intent: "order", sequenceDialogue: { index: 0, node: "ask" }}
    
            // select 'keki' as the item of choice
            const itemSelect = await agent.chat("keki", state)
    
            expect(itemSelect).toStrictEqual({
                output: "Keki ngumu au laini?",
                state: { intent: "order", sequenceDialogue: { index: 0, node: "keki" }}
            })
    
            done()
        } catch (err) {
            done(err)
        }
    })

    test("Properly orders cake", async function (done) {
        try {
            let state = {}
    
            // console.log("Start ordering")
            // Make an order
            const order = await agent.chat("nataka kuoda", state)
            // console.log(order)
            // console.log("Check here!")
            expect(order).toStrictEqual({
                output: "Unangependa kuorder nini? Weka chaguo moja hapa kati ya juice, keki",
                state: { intent: "order", sequenceDialogue: { index: 0, node: "ask" }}
            })
            // done()
    
            state = order.state
    
            // console.log("Order cake")
            // select 'keki' as the item of choice
            const itemSelect = await agent.chat("keki", state)
            expect(itemSelect).toStrictEqual({
                output: "Keki ngumu au laini?",
                state: { intent: "order", sequenceDialogue: { index: 0, node: "keki" }}
            })
    
            state = itemSelect.state
    
    
            // console.log("Keki Laini cake")
            // select 'laini' option
            const softCake = await agent.chat("laini", state)
            expect(softCake).toStrictEqual({
                output: "Asante, vitu vyako vinakuja soon",
                state: { intent: "order", sequenceDialogue: { index: 0, node: "final" }}
            })

            done()
        } catch {
            done(err)
        }
    })


    test("Accidental misinput, then self correction while ordering", async function () {
        const misMatchCallback = jest.fn()
        let state = {}

        // Make an order
        const order = await agent.chat("nataka kuoda", state)
        
        expect(order).toStrictEqual({
            output: "Unangependa kuorder nini? Weka chaguo moja hapa kati ya juice, keki",
            state: { intent: "order", sequenceDialogue: { index: 0, node: "ask" }}
        })

        state = order.state

        // console.log("Ze state:", state)

        // add bad input purposefully as the item of choice
        const misSelect = await agent.chat("kuku", state, { matchCallback: misMatchCallback })

        // This should be called once
        expect(misMatchCallback).toBeCalled()

        // MUST MATCH this shape
        expect(misSelect).toStrictEqual({
            output: "Unangependa kuorder nini? Weka chaguo moja hapa kati ya juice, keki",
            state: { intent: "order", sequenceDialogue: { index: 0, node: "ask" }}
        })

        state = misSelect.state

        // select 'keki' as the item of choice
        const properSelect = await agent.chat("keki", state)

        expect(properSelect).toStrictEqual({
            output: "Keki ngumu au laini?",
            state: { intent: "order", sequenceDialogue: { index: 0, node: "keki" }}
        })

        state = properSelect.state

        // select 'laini' option
        const softCake = await agent.chat("laini", state)

        expect(softCake).toStrictEqual({
            output: "Asante, vitu vyako vinakuja soon",
            state: { intent: "order", sequenceDialogue: { index: 0, node: "final" }}
        })

        // MisMatch function should be called once
        // expect(misMatchCallback).toBeCalledTimes(1)
    })
})