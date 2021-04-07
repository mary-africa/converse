/**
 * Interfacing for the express application
 */
import { HookedChatService, HookedStatefulChatService } from '../../typings'

/**
 * Creates a chat service that uses basic HTTP for communication
 * The chat service created needs state to be constantly passed back 
 * to the messageHandler
 * 
 * @param app express application
 * @param chatRegisterOption Options to register the application
 */
const createChatService = (app: any) => {
    return {
        /** To register a chat service */
        registerChathook: (hookPath: string, service: HookedChatService) => {
            app.get(hookPath, function (req: any, res: any) {
                res.status(200).send(service.description)
            })
            app.post(hookPath, async function (req: any, res: any) {
                /**
                 * @var message: This is the next messsage that the use has sent back
                 */
                const { message } = req.body
                
                // check message / state
                if (message === undefined) {
                    res.status(406).send({ 
                        error: 'invalid_message_input', 
                        message: "Missing message from the request body"
                    })
                    return;
                }

                try {
                    const response = await service.messageHandler(message)
                    res.status(200).send(response)
                    return;
                } catch (err) {
                    res.status(500).send({ message: "Unable to build a response. Please Try again" })
                    return;
                }
            })

            console.log(`Registered chathook at: ${hookPath}`)
        },

        /**
         * Register a chat service that is aware in 
         * monitoring previous state / actions made by the user
         */
        registerStatefulChathook: <ChatState> (hookPath: string, service: HookedStatefulChatService<ChatState>) => {
            app.get(hookPath, function (req: any, res: any) {
                res.status(200).send(service.description)
            })
            app.post(hookPath, async function (req: any, res: any) {
                /**
                 * @var state: this carries the things it considers as memory.
                 *  this is needed to pass information to chat without having a 
                 *  storage for the state: For instance this can be the previous
                 *  messages in the conversation
                 * 
                 * @var message: This is the next messsage that the use has sent back
                 */
                const { state: prevState, message } = req.body

                // check message / state
                if (message === undefined) {
                    res.status(406).send({
                        error: 'invalid_message_input', 
                        message: "Missing message from the request body"
                    })
                    return;
                }

                try {
                    const response = await service.messageHandler(message, prevState)
                    res.status(200).send(response)
                    return;
                } catch (err) {
                    res.status(500).send({ message: "Unable to build a response. Please Try again" })
                    return;
                }
            })

            console.log(`Registered stateful chathook at: ${hookPath}`)
        },
        run: (port: string | number) => {
            app.listen(port, () => {
                // this is the default listener locally
                console.log(`Running chat server at http://localhost:${port || 3003}`)
            })
        }
    }
}

export default {
    use: createChatService
}
