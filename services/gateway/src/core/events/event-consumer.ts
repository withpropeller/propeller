import { Subscription } from 'rxjs';
import { EventPublisher } from './event.publisher';
import { IEvent } from './event.interface';
import { EventTask } from './event-task';
import { filter } from 'rxjs/operators';

/**
 * An abstract class for subscribing to event streams being published
 * globally on the app. This abstract class helps filter the events for
 * the concrete class.
 *
 * @author  Oreofe Olurin
 * @version 0.0.1
 * @since   2017-10-20
 */

export abstract class EventConsumer {
    private eventSubscription: Subscription;

    /**
     * Sole constructor for for invocation by subclass.
     * Subscribes to event streams from the @{link EventPublisher} and
     * filters them using the name of the consumer.
     *
     * @param {String} name Consumer name
     * @param {EventPublisher} eventPublisher The publisher
     */
    constructor(name: string, eventPublisher: EventPublisher) {
        const filteredStream = eventPublisher.eventStreams.pipe(
            filter((event: IEvent<any>) => event.consumer === name),
        );

        this.eventSubscription = filteredStream.subscribe((event) => this.handleEvent(event));
    }

    /**
     * Handles the events from the filtered streams
     * @param {EventTask} event
     */
    protected handleEvent(event: EventTask<any>) {}

    /**
     * Helps release resources when done with consumer
     */
    protected close() {
        this.eventSubscription.unsubscribe();
    }
}
