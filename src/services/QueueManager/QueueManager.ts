import {
  BehaviorSubject,
  map,
  timeout,
  throwError,
  of,
  catchError,
  EMPTY,
  Observable,
  mergeMap,
} from 'rxjs';

import * as R from 'ramda';

import { fetchIpfsContent } from 'src/utils/ipfs/utils-ipfs';
import { IPFS } from 'ipfs-core-types';

import { promiseToObservable } from '../../utils/helpers';

import type {
  QueueItem,
  QueueItemResult,
  QueueItemCallback,
  QueueItemOptions,
  QueueStats,
  QueueSource,
  QueueSettings,
} from './QueueManager.d';
import { QueueItemTimeoutError } from './QueueItemTimeoutError';

const defaultIpfsSourceSettings: QueueSettings = {
  db: { timeout: 5000, maxConcurrentExecutions: 25 },
  node: { timeout: 60 * 1000, maxConcurrentExecutions: 21 },
  gateway: { timeout: 5000, maxConcurrentExecutions: 3 },
};

class QueueManager<T> {
  private queue$ = new BehaviorSubject<QueueItem<T>[]>([]);

  private node: IPFS | undefined = undefined;

  private settings: QueueSettings;

  private executing: Record<QueueSource, number> = {
    db: 0,
    node: 0,
    gateway: 0,
  };

  public setNode(node: IPFS) {
    this.node = node;
  }

  private getIpfsDataSourceObservable(item: QueueItem<T>) {
    const { cid, source, controller } = item;
    const settings = this.settings[source];
    return promiseToObservable(() => {
      return fetchIpfsContent<T>(cid, source, {
        controller,
        node: this.node,
      });
    }).pipe(
      timeout({
        each: settings.timeout,
        with: () =>
          throwError(() => {
            controller?.abort('timeout');
            return new QueueItemTimeoutError(settings.timeout);
          }),
      }),
      map(
        (result): QueueItemResult<T> => ({
          item,
          status: result ? 'completed' : 'error',
          source,
          result,
        })
      ),
      catchError((error): Observable<QueueItemResult<T>> => {
        // console.log('-errror queue', error);
        if (error instanceof QueueItemTimeoutError) {
          return of({
            item,
            status: 'timeout',
            source,
          });
        }
        if (error.name === 'AbortError') {
          return of({ item, status: 'cancelled', source });
        }
        return of({ item, status: 'error', source });
      })
    );
  }

  private getItemBySourceAndPriority(queue: QueueItem<T>[]) {
    const pendingQueue = queue.filter((i) => i.status === 'pending');
    const queueByPending = R.groupBy((i) => i.source, pendingQueue);

    // eslint-disable-next-line no-restricted-syntax
    for (const [queueSource, items] of Object.entries(queueByPending)) {
      const settings = this.settings[queueSource];

      if (this.executing[queueSource] < settings.maxConcurrentExecutions) {
        return items.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
      }
    }

    return undefined;
  }

  constructor(settings: QueueSettings = defaultIpfsSourceSettings) {
    this.settings = settings;
    this.queue$
      .pipe(
        // tap((queue) => console.log('---tap', queue)),
        mergeMap((queue) => {
          const workItem = this.getItemBySourceAndPriority(queue);
          if (workItem) {
            const { source, cid, callback } = workItem;
            this.executing[source]++;
            workItem.status = 'executing';
            workItem.controller = new AbortController();
            callback(cid, 'executing', source);
            return this.getIpfsDataSourceObservable(workItem);
          }

          return EMPTY;
        })
      )
      .subscribe(({ item, status, source, result }) => {
        item.callback(item.cid, status, source, result);

        this.executing[source]--;
        if (status === 'completed' || status === 'cancelled') {
          // console.log('------done', item, status, source, result);

          this.removeAndNext(item.cid);
          return;
        }
        // console.log('------error', item, status, source, result);
        // Process with error
        if (source === 'db') {
          this.switchSourceAndNext(item, 'node');
        } else if (source === 'node') {
          this.switchSourceAndNext(item, 'gateway');
        } else {
          this.removeAndNext(item.cid);
        }
      });
  }

  private removeAndNext(cid: string): void {
    const updatedQueue = this.queue$.value.filter((i) => i.cid !== cid);
    this.queue$.next(updatedQueue);
  }

  private switchSourceAndNext(
    item: QueueItem<T>,
    nextSource: QueueSource
  ): void {
    const updatedQueue = this.queue$.value.filter((i) => i.cid !== item.cid);
    const nextItem = item;
    nextItem.status = 'pending';
    nextItem.source = nextSource;
    this.queue$.next([...updatedQueue, nextItem]);
  }

  public enqueue(
    cid: string,
    callback: QueueItemCallback<T>,
    options: QueueItemOptions = {}
  ): void {
    const item: QueueItem<T> = {
      cid,
      callback,
      source: 'db',
      status: 'pending',
      ...options,
    };
    this.queue$.next([...this.queue$.value, item]);
  }

  // private updateStatus(cid: string, status: QueueItemStatus) {
  //   const alterStatus = R.curry((cid, status, items) =>
  //     R.map(R.when(R.propEq('cid', cid), R.assoc('status', status)), items)
  //   );
  //   const updatedQueue = alterStatus(
  //     cid,
  //     status,
  //     this.queue$.value
  //   ) as QueueItem<T>[];

  //   this.queue$.next(updatedQueue);
  // }

  public cancel(cid: string): void {
    const currentQueue = this.queue$.value;
    const item = currentQueue.find((item) => item.cid === cid);
    if (item) {
      // If item has no abortController we can just remove it
      // Otherwise abort should be handled by subscriber
      if (!item.controller) {
        this.queue$.next(currentQueue.filter((item) => item.cid !== cid));
      } else {
        // item.status = 'cancelled';
        item.controller.abort('cancelled');
      }
    }
  }

  public cancelByParent(parent: string): void {
    const newQueue: QueueItem<T>[] = [];

    this.queue$.value.forEach((item) => {
      // If item parent is different the keep item,
      // If item managed by abortController abort&keep
      // Otherwise just skip it
      if (item.parent !== parent) {
        newQueue.push(item);
      } else if (item.controller) {
        item.controller.abort('cancelled');
        newQueue.push(item);
      }
    });

    this.queue$.next(newQueue);
  }

  public getQueue(): QueueItem<T>[] {
    return this.queue$.value;
  }

  public getStats(): QueueStats[] {
    const fn = R.pipe(
      R.countBy<QueueItem<T>>(R.prop('status')),
      R.toPairs,
      R.map(R.zipObj(['status', 'count']))
    );

    return fn(this.queue$.value) as QueueStats[];
  }
}

export default QueueManager;
