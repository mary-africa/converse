/**
 * Make simple tests
 * ---------------
 */
const NenaAgent = require('../lib').default

const nena_ddo = {
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
                    text: `Ipi ni sahihi? Andika A, B au C
                    A: Mapato = Faida - Gharama
                    B: Faida = Mapato - Gharama
                    C: Faida = Gharama - Mapato`,
                    matcher: 'multichoice',
                    with: {
                        answer: 'a',
                        options: [ "a", "b", "c"]
                    },
                    goTo: 'a01'
                },
                a02: {
                    text: `Kama Juma amepata kipato cha TSH5000 na ametumia gharama ya TSH2000, faida yake ni kiasi gani? Andika A, B au C
                    A: TSH7000
                    B: TSH1000
                    C: TSH3000`,
                    matcher: 'multichoice',
                    with: {
                        answer: 'a',
                        options: [ "a", "b", "c"]
                    },
                    goTo: 'a01'
                },
                a03: {
                    text: `Wataalamu wanashauri kuwekeza wastani asilimia ngapi ya faida yako ili kukuza biashara yako?\n
                    A: 20%
                    B: 50%
                    C: 100%`,
                    matcher: 'multichoice',
                    with: {
                        answer: 'a',
                        options: [ "a", "b", "c"]
                    },
                    goTo: 'a01'
                },
                a04: {
                    text: "Ahsante kwa kujibu maswali yangu. Je, ungependa niongeze kozi zaidi baada ya muda? Andika 'ndiyo' au 'hapana'",
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

const agent = new NenaAgent(
    nena_ddo,
    {
        enableExactMatchRule: false,
        apiKey: "<API_KEY>", 
        baseApiUrl: "https://api.nena.mary.africa" 
    },
    { 
        name: "Kevin"
    }
); 
 
test('Simple names', () => {
    expect(1).toBe(1);
});
