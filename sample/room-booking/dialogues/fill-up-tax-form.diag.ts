import { Dialogue } from '../../src/typings/dialogue'

export type DNodeType = 
    | 'ask-form-type' 
    | 'seq-customs-tax' 
    | 'seq-domestic-tax'
    | 'seq-vat-tax'
    | 'tax-form-finish'

const FillUpTaxFormDialogue: Dialogue<DNodeType> = {
    // the first sequence to start with
    start: 'ask-form-type',

    // The list of sequences to work with 
    nodes: {
        'ask-form-type': {
            q: "Unataka kujaza form ya aina gani? Kuna 'customs', 'domestic forms' au 'VAT'",
            input: {
                type: 'string-match',
                match_rule: 'nlp',
                options: ['customs', 'domestic', 'vat'],
                name: 'tax_val'
            },
            callback: async (input) => {
                console.log("I am doing something with you data.")
                console.log(`Using you input `, input, `to do something`)
            },
            next: 'seq-[tax_val]-tax'
        },
        'seq-customs-tax': {
            q: "Kwa custom form, ingiza namba ua custom form ya kushughulikiwa (Form CXX). Kwa ujumbe juu ya aina ya form.\nTembelea tovuti hii https://www.tra.go.tz/index.php/forms/150-customs-forms",
            input: {
                type: 'exact',
                name: 'custom_form_number'
            },
            callback: async (input) => {
                console.log(`Sending this data:`, input, `to TRA, and creating the form for you`)
            },
            next: 'tax-form-finish'
        },
        'seq-domestic-tax': {
            q: "Kwa sasa, tuna support Income tax na Employment tax. Ungependa kujaza ipi",
            input: {
                type: 'string-match',
                match_rule: 'nlp',
                options: ['kipato', 'kufanya kazi'],
                name: 'tax_val'
            },
            callback: async (input) => {
                console.log(`Sending this data:`, input, `to TRA, and creating the form for you`)
            },
            next: 'tax-form-finish'
        },
        'seq-vat-tax': {
            q: "Ingiza barua pepe. Ili kukujuulisha pale tutakapo anza kusupport VAT Forms",
            input: {
                type: 'exact',
                name: 'email'
            }, 
            callback: async (input) => {
                console.log(`Email: ${input}`)
            },     
            next: 'tax-form-finish' 
        },
        'tax-form-finish': {
            q: "Asante kwa kutupatia data zako. Utapata ujumbe mfupi. Unaweza ukaulizia juu ya yambo jingine. Asante kwa kuongea na BiJasiri",
        }
    }
}

export default FillUpTaxFormDialogue
