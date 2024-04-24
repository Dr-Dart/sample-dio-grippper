/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-console */
/* eslint-disable no-magic-numbers */

/*********
 * DatabaseManager.ts
 *********
 * Database Manager. Init and manage database.
 * - You must run 'initDatabase' when use this utils.
 *********/

import { IDartDatabase, Context, ModuleContext, TableRow, logger } from 'dart-api';
import { SignalWrite, SignalRead, ToolType, GripperUserCommandInfo } from '../types';
import {
  DB_INITIAL_1, DB_INITIAL_2, DB_INITIAL_3,
  DB_ADD_NAME, DB_ADD_TOOL, DB_ADD_WRITE, DB_ADD_READ, DB_MAX_LENGTH,
  USER_COMMAND_GRASP, USER_COMMAND_RELEASE
} from "../constants";

export const DB_COLUMN_KEY = 'key'
export const DB_COLUMN_NAME = 'name'
export const DB_COLUMN_TOOL = 'tool'
export const DB_COLUMN_WRITE = 'write'
export const DB_COLUMN_READ = 'read'

export interface IDBData {
  key: number,
  name: string,
  tool: ToolType,
  write: SignalWrite[],
  read: SignalRead[]
}

/**
 * A function use to get Gripper value
 **/
export const getGripperInfo = (writeSignals: SignalWrite | undefined) => {
  return {
    signalType: writeSignals?.signalType,
    port: writeSignals?.writeSignalsChild.map((v) => v.portNo),
    signal: writeSignals?.writeSignalsChild.map((v) => Number(v.signal)),
    timeout: writeSignals?.writeSignalsChild.map((v) => v.timeout),
  } as GripperUserCommandInfo;
};

class DatabaseManager {
  private readonly TABLE_DIGITALIO = 'digitalIO';
  private readonly TABLE_DIGITALIO_COLUMNS = [DB_COLUMN_KEY, DB_COLUMN_NAME, DB_COLUMN_TOOL, DB_COLUMN_WRITE, DB_COLUMN_READ];
  private readonly TABLE_DIGITALIO_INITIAL_DATA = [DB_INITIAL_1, DB_INITIAL_2, DB_INITIAL_3] as IDBData[];
  private db: IDartDatabase | null;

  constructor() {
    this.db = null;
  }

  /*************
   * Initial
   *************/
  initDatabase = async (moduleContext: ModuleContext) => {
    if (this.db === null) {
      // 1) get db
      this.db = moduleContext.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;

      // 2) check db exist
      let hasTable = await this.db.hasTable(this.TABLE_DIGITALIO)

      if (hasTable === false) {
        // 3) try create table
        const createResult = await this.db.createTable(this.TABLE_DIGITALIO, this.TABLE_DIGITALIO_COLUMNS, false);

        if (createResult) {
          // 4) If success, initial data
          let data = [] as string[][];

          this.TABLE_DIGITALIO_INITIAL_DATA.map((value: IDBData) => {
            data.push([JSON.stringify(value.key),
            JSON.stringify(value.name),
            JSON.stringify(value.tool),
            JSON.stringify(value.write),
            JSON.stringify(value.read)])
          })

          let result = await this.db.insertAll(this.TABLE_DIGITALIO, data);

          return result
        }

        // 3-2) return fail create result
        logger.debug('db create fail...')
        return createResult

      }
      else {
        // 2-2) return current module db
        logger.debug('db already exist')
        return hasTable
      }
    }
    // 1-2) db initial already complete
    logger.debug('db initial already complete')
    return true
  }


  /*************
   * Data write
   *************/

  // Update Database
  updateDatabase = async (currentDatabase: IDBData[], updateDatabase: IDBData[]) => {
    logger.debug(`===currentDatabase===`)
    logger.debug(currentDatabase)
    logger.debug(`===updateDatabase===`)
    logger.debug(updateDatabase)
    let result = false;

    // 1) update db
    if (currentDatabase.length === updateDatabase.length) {
      // 1-1) If length equal, save all
      result = await this.saveDataAll(updateDatabase);
    }
    else if (currentDatabase.length < updateDatabase.length) {
      // 1-2) If database is added, update and add it
      logger.debug('Add database')
      for (let index = 0; index < updateDatabase.length; index++) {
        if (index < currentDatabase.length) {
          // update data
          result = await this.saveData(updateDatabase[index], index);
        }
        else {
          // add data
          result = await this.addData(updateDatabase[index]);
        }
      }
    }
    else {
      // 1-3) If database is deleted, update and delete it
      logger.debug('Delete database')
      for (let index = 0; index < currentDatabase.length; index++) {
        if (index < updateDatabase.length) {
          // update data
          result = await this.saveData(updateDatabase[index], index);
        }
        else {
          // delete data
          result = await this.deleteData(index);
        }
      }
    }

    logger.debug(`Result = ${result}`)
    return Boolean(result);
  }

  // add data
  addData = async (newDB: IDBData) => {
    if (this.db !== null) {
      // 1) get db and check db exist
      let resultArray = await this.db.query(this.TABLE_DIGITALIO, this.TABLE_DIGITALIO_COLUMNS, {})

      // 2) If db exist and not maximum length, add it.
      if (resultArray.length > 0 && resultArray.length !== DB_MAX_LENGTH) {
        const data = [JSON.stringify(resultArray.length),
        JSON.stringify(newDB.name),
        JSON.stringify(newDB.tool),
        JSON.stringify(newDB.write),
        JSON.stringify(newDB.read)]

        let result = await this.db.insert(this.TABLE_DIGITALIO, data);

        return result
      }

      return false
    }

    return false
  }

  // save data
  saveData = async (data: IDBData, index: number) => {
    if (this.db !== null) {
      // 1) set where
      let where = {} as Record<string, any>;
      where[DB_COLUMN_KEY] = JSON.stringify(index);

      // 2) set data
      let updatedData = {} as Record<string, any>;
      updatedData[DB_COLUMN_KEY] = JSON.stringify(index);
      updatedData[DB_COLUMN_NAME] = JSON.stringify(data.name);
      updatedData[DB_COLUMN_TOOL] = JSON.stringify(data.tool);
      updatedData[DB_COLUMN_WRITE] = JSON.stringify(data.write);
      updatedData[DB_COLUMN_READ] = JSON.stringify(data.read);

      // 3) update!
      let done = await this.db.update(this.TABLE_DIGITALIO, where, updatedData)
      return Boolean(done)
    }
    return false
  }

  //Save All Data
  saveDataAll = async (dataArray: IDBData[]) => {
    if (this.db !== null) {
      let updatedData = {} as Record<string, any>;
      let result = false;

      // Update data
      const resultData = await Promise.all(
        dataArray.map(async (data: IDBData, index: number) => {
          // 1) set where
          let where = {} as Record<string, any>;
          where[DB_COLUMN_KEY] = JSON.stringify(index);

          // 2) set data
          updatedData[DB_COLUMN_KEY] = JSON.stringify(index)
          updatedData[DB_COLUMN_NAME] = JSON.stringify(data.name)
          updatedData[DB_COLUMN_TOOL] = JSON.stringify(data.tool)
          updatedData[DB_COLUMN_WRITE] = JSON.stringify(data.write)
          updatedData[DB_COLUMN_READ] = JSON.stringify(data.read)

          result = await this.db.update(this.TABLE_DIGITALIO, where, updatedData)

          return result
        })
      )

      // 3) Check update result and return it
      return true
    }
    return false
  }

  // delete data
  deleteData = async (index: number) => {
    // 1) get db and check db exist
    if (this.db !== null) {
      let resultArray = await this.db.query(this.TABLE_DIGITALIO, this.TABLE_DIGITALIO_COLUMNS, {})

      if (resultArray.length > 0) {
        // 2) set where
        let where = {} as Record<string, any>;
        where[DB_COLUMN_KEY] = JSON.stringify(index);

        // 3) delete data
        let result = await this.db.delete(this.TABLE_DIGITALIO, where);

        return result
      }
      return false

    }
    return false
  }


  /*************
   * Data read
   *************/

  // get Initial data
  getInitData = (index: string) => {
    // get data
    if (Number(index) > 2) {
      return {
        key: index,
        name: DB_ADD_NAME + ' ' + index,
        tool: DB_ADD_TOOL,
        write: DB_ADD_WRITE,
        read: DB_ADD_READ,
      }
    }

    const data = JSON.parse(JSON.stringify(this.TABLE_DIGITALIO_INITIAL_DATA[index]));
    return data
  }

  // get data
  getData = async (column: string) => {
    if (this.db !== null) {
      // 1) If db exist, get db's data about selected column
      let resultArray = await this.db.query(this.TABLE_DIGITALIO, [column], {})

      // 2) If db is not empty, convert it to object and return it
      if (resultArray.length > 0) {
        return resultArray
      }
    }

    // 2-1) If db is empty, return null
    return null
  };

  // get all data
  getDataAll = async () => {
    if (this.db !== null) {
      // 1) If db exist, get db
      let resultArray = await this.db.query(this.TABLE_DIGITALIO, this.TABLE_DIGITALIO_COLUMNS, {})

      // 2) If db is not empty, convert it to object and return it
      if (resultArray.length > 0) {
        let currentData = [] as IDBData[];
        let data = {} as IDBData;

        resultArray.map((result: TableRow) => {
          data = {
            key: JSON.parse(result.data.key),
            name: JSON.parse(result.data.name),
            tool: JSON.parse(result.data.tool),
            write: JSON.parse(result.data.write),
            read: JSON.parse(result.data.read)
          } as IDBData

          currentData.push(data)
        })

        return currentData
      }
    }
    // 2-1) If db is empty, return initial data
    return this.TABLE_DIGITALIO_INITIAL_DATA
  };

  // get data for user command
  getUserCommandData = async () => {
    // set datalist for user command
    let graspDatabase = [] as GripperUserCommandInfo[];
    let releaseDatabase = [] as GripperUserCommandInfo[];

    // get data list
    const dataList = await this.getDataAll();

    // get gripper data
    dataList.map((data: IDBData) => {
      if (data.write === null || undefined) return;

      graspDatabase.push(getGripperInfo(data.write.find((v: SignalWrite) => v.name === USER_COMMAND_GRASP)));
      releaseDatabase.push(getGripperInfo(data.write.find((v: SignalWrite) => v.name === USER_COMMAND_RELEASE)));

    })

    return [graspDatabase, releaseDatabase]
  }

}

export default new DatabaseManager();