import {Inject, Injectable} from '@angular/core';
import {ConfigService} from '../basics/config.service';
import {ResultsContainer} from '../../shared/model/results/scores/results-container.model';
import {HistoryContainer} from '../../shared/model/internal/history-container.model';
import Dexie from 'dexie';
import {fromPromise} from 'rxjs-compat/observable/fromPromise';
import {first, flatMap, map} from 'rxjs/operators';
import {EMPTY, Observable} from 'rxjs';
import {DatabaseService} from '../basics/database.service';
import * as JSZip from 'jszip';

/**
 * This service keeps a history of query results and persists them event across session. It allows the user to
 * switch back to previous result sets.
 */
@Injectable()
export class HistoryService {

  /** The table used to store Vitrivr NG configuration.*/
  private _historyTable: Dexie.Table<HistoryContainer, number>;

  /**
   * Constructor
   *
   * @param _db
   * @param _config
   */
  constructor(@Inject(ConfigService) _config: ConfigService, _db: DatabaseService) {
    this._historyTable = _db.db.table('history');
    _config.subscribe(c => {
      this.keep = c.get('query.history');
    });
  }

  /** Number if result sets to keep in the history at max. Values between 1 and 10 are reasonable. */
  private _keep: number = -1;

  /**
   * Returns the number of items to keep in history.
   */
  get keep() {
    return this._keep;
  }

  /**
   * Updates the value of how many result sets to keep in the history. If the new value is
   * lower than the current number of results cached, some results will be removed.
   *
   * @param value New value for how many results to keep.
   */
  set keep(value: number) {
    this._keep = value;
    this.ommitOldest();
  }

  /**
   * Returns a copy of the HistoryContainer[] array.
   */
  get list(): Observable<HistoryContainer[]> {
    return fromPromise(this._historyTable.orderBy('id').reverse().toArray());
  }

  /**
   * Returns the number of items in the history.
   */
  get count(): Observable<number> {
    return fromPromise(this._historyTable.count());
  }

  /**
   * Appends one ResultsContainer to the history.
   *
   * @param container ResultsContainer that should be added.
   */
  public append(container: ResultsContainer) {
    if (this._keep > 0) {
      fromPromise(this._historyTable.add(new HistoryContainer(container))).subscribe();
      this.ommitOldest();
    }
  }

  /**
   * Deletes a HistoryContainer entry from the database.
   *
   * @param key ID of the HistoryContainer to delete.
   */
  public delete(key: number) {
    fromPromise(this._historyTable.delete(key)).subscribe();
  }

  /**
   * Clears the history.
   */
  public clear() {
    fromPromise(this._historyTable.clear()).subscribe();
  }

  /**
   * Downloads the entire history.
   */
  public download() {
    fromPromise(this._historyTable.orderBy('id').toArray())
      .pipe(
        first(),
        map(h => {
          let zip = new JSZip();
          let options = {base64: false, binary: false, date: new Date(), createFolders: false, dir: false,};
          zip.file('vitrivrng-history.json', JSON.stringify(h, null, 2), options);
          return zip
        })
      )
      .subscribe(zip => {
        zip.generateAsync({type: 'blob'}).then(
          (result) => {
            window.open(window.URL.createObjectURL(result));
          },
          (error) => {
            console.log(error);
          }
        )
      });
  }

  /**
   *
   */
  private ommitOldest() {
    fromPromise(this._historyTable.count()).pipe(
      flatMap(c => {
        if (c > this._keep) {
          return fromPromise(this._historyTable.limit(c - this._keep).keys());
        } else {
          return EMPTY;
        }
      }),
      flatMap((a, i) => {
        return fromPromise(this._historyTable.bulkDelete(a));
      })
    ).subscribe();
  }
}
