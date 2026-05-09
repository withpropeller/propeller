import { IEvent } from './event.interface';
import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class EventPublisher {
    // Observable subjects;
    private eventSubject = new Subject<IEvent<any>>();

    // Observable streams
    public eventStreams = this.eventSubject.asObservable();

    public publish(event: IEvent<any>) {
        this.eventSubject.next(event);
    }
}
