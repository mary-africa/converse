import { Dialogue } from '../../src/typings/dialogue'

export type DNodeType = 'm01' | 'm02' | 'm03' | 'm04' | 'm05'

const BaseBiJasiriDialogue: Dialogue<DNodeType> = {
    // the first sequence to start with
    start: 'm01',

    // The list of sequences to work with 
    nodes: {
        'm01': {
            q: "Karibu katika kozi ya Usimamizi wa Faida. Katika kozi hii utajifunza jinsi ya kusimamia faida yako ili kukuza biashara yako!",
            input: {
                type: 'exact',
                name: 'node'
            },
            next: '[node]'
        },
        'm02': { 
            q: `Ningependa kukutambulisha kwa rafiki yangu aitwae Juma. Juma ana miaka 20 na anauza mahindi ya kuchoma hapo Majengo. Kila siku kwenye mida ya saa moja jioni, Juma anaacha kuuza mahindi yake na kupiga mahesabu. 
                Kumbuka: Faida = Mapato - Gharama`,
            input: {
                type: 'exact',
                name: 'node'
            },
            next: '[node]'
        },
        'm03': {
            q: `Swali: Leo Juma ameuza mahindi yenye thamani ya TSH 5000.             
            Ana gharama mbali mbali ikiwemo mahindi mabichi, usafiri,             
            mkaa wa kuchomea, kodi, mdaa wake nk. Jumla ya gharama ni TSH 2500. 
            
            Kwa leo amepata faida shilingi ngapi?             
            `,
            
            input: {
                type: 'exact',
                name: 'node'
            },
            next: '[node]'
        },
        'm04': {
            q: `Mapato ya TSH 5000 toa gharama ya 2500 amepata faida ya TSH 2500. 
            Juma anafurahi sana akipata faida na kila siku inabidi aamue cha kufanya na faida yake. Anaweza kuitoa faida kutoka mzunguko wa biashara yake na kuitumia au kuiwekeza kwenye biashara ili kuikuza.           
            Leo Juma amepata faida ya 2500 TSH.
            
            Je, unadhani Juma afanye nini na faida yake? Andika A au B`,
            
            input: {
                type: 'exact',
                name: 'node'
            },
            next: '[node]'
        },
        'm05': {
            q: "Ahsante kwa kuwa na mimi mjasiriamali! Mimi kama Bi Jasiri ninaendelea kukuandalia vipindi vizuri kama kocha wako wa finance!",
        }
    }
}

export default BaseBiJasiriDialogue
