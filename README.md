## Converse

Making conversational agents - one step at a time


### Overview

<h6>[ Docs are be a bit outdated ]</h6>
Created by [Mary.Africa](https://mary.africa), this tool makes it possible to create conversational agents of any form.
From purely-rule based to full-fledged NLP enhanced.

### Terminologies:

It's important to understand the terminologies that are used during the **development** process. Possibly in the future, we'll be working on creating better documentation and information about the project.

Terms: <br />
- **Agent** - The conversational tool / bot / chatbot, which is the main interface of the project. <br /><br />
To use an agent: <br />
  ```ts
    import Agent from 'converse-core'

    const ddo = ...
    const config = ...
    const context = ...

    const agent = new Agent(ddo, config, context)
  ```
- **Dialogue Definition Object (DDO)** - This is the object that defines how to build the *agent*. This would have information like what are the responses it should take. How should it attempt to match the user text, and so on. <br /><br />
Example of a simple DDO
  ```ts
  {
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
              toMatch: ['salama', 'habari', 'jasiri'],
              response: 'Habari zako kijani!',
          },
          'room-book': {
              toMatch: ["nataka kupanga chumba", "nataka chumba"],
              dialogueKey: 'bookDialogue'
          },
      },
  }
  ```
- **Mutation** - These are the modification of input that you want your agent to perform as it's processing the input given to the created agent<br /><br />
Here is an example of mutation to remove whitespace around an input and lowercase any input sent to the agent:
  ```js
  const agent = new Agent(...)

  agent.setMutation('preprocess', (input) => input.trim().toLowerCase())
  ...
  ```

- **Action** - These are actions that can be set to execute during a certain time of execution<br /><br />
From the `ddo` shown above, here is an example of an action that is executed when a user is in the room-booking dialogue
  ```ts
  const agent = new Agent(...)
  agent.dialogue('bookDialogue')
      .setAction('enter', async () => {
          // do something here
      })
  ```

### NOTICE
**This package is still very much under development. If you are using it, do so with caution**

#### Packages inside:
- **Converse Core** - [`converse-core`](packages/core)
  This is the `core` package that builds the conversational agents in a basic form. Any modification would be an extension from this class
  ```
  yarn add converse-core
  ```

- **Converse Nena** - [`converse-nena`](packages/nena)
  This is the agent that makes use of Nena API to give the agent NLP functionalities
  ```
  yarn add converse-core converse-nena
  ```

#### Compatibility Table:

| converse-core | converse-nena |
| ---------- | ---------------|
| 0.3.2 | 0.2.3
### Contributions

Contributions currently can only be made by the members of [Mary.Africa](https://mary.africa).
However, contributions might be opened up to a select few.
