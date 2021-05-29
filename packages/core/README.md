## Converse Core

<!-- version -->
<img src="https://img.shields.io/npm/v/converse-core?color=yellow" alt="Stable version" />

## Overview

Create conversational agents with logic that's easy to work around. With this, you are able to create RULE based conversational agents.

### How?

1. Define your Dialogue Definition File (DDO), that describes how the bot should interact

  ```js
  // booking.ddo.js
  export = {
      fallbackText: "This is a fallback text",
      dialogues: {
          'bookDialogue': {
              start: 'ask-room',
              nodes: {
                  "ask-room": {
                      text: "Unataka kupangisha chumba aina gani?",
                      matcher: 'room-selector'
                      with: {
                          room_options: [ 'standard', 'king', 'family' ]
                      }
                      goTo: "done"
                  },
                  "done": {
                      text: "Haya, imetosha. Ungependa kurudia?",
                      matcher: "yes_no",
                      goTo: '$'
                  }
              }
          },
       },
       intentions: {
          'greet': {
              toMatch: ['salama', 'habari'],
              response: 'Habari zako kijana!',
          },
          'room-book': {
              toMatch: ["nataka kupanga chumba", "nataka chumba"],
              dialogueKey: 'bookDialogue'
          },
      },
  }
  ```
2. Apply the DDO to the `Agent`
```ts
import Agent from 'converse-core'

const agent = new Agent(
    require('booking.ddo'), 
    { matchRules: ['greet', 'room-book'], },
    { name: "Dummy Agent" }
)
```
3. Add extra rules to apply logic needed to interact given a certain file
```js
/**
 * Every input sent to the agent before preprocessing
 *  is trimmed of any boundary white space and the 
 *  characters are lower-cased
 */
agent.setMutation('preprocess', (input) => input.trim().toLocaleLowerCase())

/**
 * For the nodes that use a `matcher: 'room-selector'`, 
 *  apply this logic.
 * 
 * In this logic, if the the input entered isn't in the
 *  room options, return to the same node
 */
agent.dialogue('bookDialogue')
     .setMatcher('room-selector', (input, opts, context, fn) => {
         if (!opts.room_options.includes(input)) {
             // entered options isn't present.
             //  do something
             return Agent.DIALOGUE_GOTO_SELF
         }
     })
```
4. Use the `Agent` in your application
```js
agent.chat("HABARI  ", {})

// Mutated to -> habari

// Output:
// >>{
// >>    output: "Habari zako kijani!",
// >>    state: { intent: "greet" }
// >>}
```

## Notice
Project is still very broken, but development is in progress.

## Contributions
They are welcome :)

## License
MIT