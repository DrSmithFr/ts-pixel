import {Logger} from "../../logger";
import {Task, TaskFailurePolicy, TaskReturnCode} from "./task-manager";
import {GoPixel} from "../go-pixel";

/**
 * This task sends events to the server by batches
 * The task is limited by 10 FPS, to prevent the browser from being overloaded
 *
 * The task will skip if there are no events to send
 * The task will retry on failure
 *
 * @param pixel
 */
export function sendEventTask(
    pixel: GoPixel,
): Task {
    const logger = new Logger('sendEventTask');

    return {
        name: 'eventSender',
        fps: 10,
        failurePolicy: TaskFailurePolicy.Retry,
        callback: () => {
            return new Promise(async (resolve, reject) => {
                if (pixel.buffer.length === 0) {
                    // No events to send, task is done
                    resolve(TaskReturnCode.Skip);
                }

                if (!pixel.sender.isFree()) {
                    // Already sending events, task is done
                    resolve(TaskReturnCode.Skip);
                }

                // After this point, events can be definitely lost
                // If calling the sender fails:
                //  - Events should be manually pushed back to the current buffer
                const events = pixel.consume();

                pixel
                    .sender
                    .sendEvent(events)
                    .then(() => {
                        resolve(TaskReturnCode.Success);
                    })
                    .catch((error) => {
                        logger.error('Failed to send events, adding events back to the buffer', error);
                        pixel.buffer.unshift(...events);
                        reject(error);
                    });
            });
        }
    };
}