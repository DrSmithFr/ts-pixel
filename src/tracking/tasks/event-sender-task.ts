import {Logger} from "../../logger";
import {Task, TaskFailurePolicy, TaskReturnCode} from "./task-manager";
import {GoPixel} from "../go-pixel";

export function sendEventTask(
    pixel: GoPixel,
): Task {
    return {
        name: 'eventSender',
        fps: 10,
        failurePolicy: TaskFailurePolicy.Retry,
        callback: () => {
            const logger = new Logger('sendEventTask');

            return new Promise((resolve, reject) => {
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

                logger.time('sendEventsTask')

                pixel
                    .sender
                    .sendEvent(events)
                    .then(() => {
                        logger.timeEnd('sendEventsTask');
                        resolve(TaskReturnCode.Success);
                    })
                    .catch((error) => {
                        // Re-add events to the current buffer
                        pixel.buffer.unshift(...events);
                        logger.timeEnd('sendEventsTask');
                        reject(error);
                    });
            });
        }
    };
}