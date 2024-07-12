import { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import Logger from './Logger';
import CommonConstants from './CommonConstants';
import relationalStore from '@ohos.data.relationalStore'
import { JSON } from '@kit.ArkTS';
import json from '@ohos.util.json'
import { resourceManager } from '@kit.LocalizationKit';
import fs, { ReadOptions } from '@ohos.file.fs';

const firstWordRegex = /^(\w+)/; // 匹配字符串开头的第一个单词

export class SQLitePluginTurboModule extends TurboModule implements TM.SQLitePlugin.Spec {
  static NAME = 'SQLitePlugin';
  rdbMap: Map<string, relationalStore.RdbStore> = new Map<string, relationalStore.RdbStore>();
  context: TurboModuleContext


  constructor(ctx: TurboModuleContext) {
    super(ctx);
    this.context = ctx;
  }

  echoStringValue(openargs: Object, mysuccess: (testValue: Object) => void, myerror: (e: Object) => void): void {

    try {
      this.execute(Action.echoStringValue, openargs, mysuccess, myerror);
    } catch (e) {
      const err = { "code": e.code, "message": e.message }

      myerror(err);
    }
  }

  open(openargs: Object, opensuccesscb: () => void, openerrorcb: (e: Object) => void): void {

    try {
      this.execute(Action.open, openargs, opensuccesscb, openerrorcb);
    } catch (e) {
      const err = { "code": e.code, "message": e.message }

      openerrorcb(err);
    }
  }

  close(closeargs: Object, mysuccess: (t: Object, r: Object) => void, myerror: (e: Object) => void): void {

    try {
      this.execute(Action.close, closeargs, mysuccess, myerror);
    } catch (e) {
      const err = { "code": e.code, "message": e.message }

      myerror(err);
    }
  }

  delete(args: Object, mysuccess: (r: Object) => void, myerror: (e: Object) => void): void {

    try {
      this.execute(Action.delete, args, mysuccess, myerror);
    } catch (e) {
      const err = { "code": e.code, "message": e.message }

      myerror(err);
    }
  }

  attach(attachargs: Object, mysuccess: (t: Object, r: Object) => void, myerror: (e: Object) => void): void {

    try {
      this.execute(Action.attach, attachargs, mysuccess, myerror);
    } catch (e) {
      const err = { "code": e.code, "message": e.message }

      myerror(err);
    }

  }

  backgroundExecuteSqlBatch(args: Object, mysuccess: (result: Object) => void, myerror: (e: Object) => void): void {

    try {
      this.execute(Action.backgroundExecuteSqlBatch, args, mysuccess, myerror);
    } catch (e) {
      const err = { "code": e.code, "message": e.message }

      myerror(err);
    }
  }

  //桥接执行方法
  execute(actionAsString: string, args: Object, success: (result?: Object, tx?: Object) => void, error: (e: Object) => void): boolean {
    let dbname: string = '';
    const argsmap = args as Map<string, Object>;
    const map = new Map(Object.entries(JSON.parse(json.stringify(argsmap))));

    switch (actionAsString) {
      case Action.echoStringValue:
        let echo_value = map.get('value');

        success(echo_value);
        break;

      case Action.open:
        dbname = map.get('name');

        this.startDatabase(dbname, success, error)
        break;

      case Action.close:
        dbname = map.get('path');

        this.closeDatabase(dbname, success, error)
        break;

      case Action.delete:
        dbname = map.get('path');

        this.deleteDatabase(dbname, success, error)
        break;

      case Action.attach:
        dbname = map.get('path');
        let dbAlias = map.get('dbAlias');
        let dbNameToAttach = map.get('dbName');

        this.attachDatabase(dbname, dbNameToAttach, dbAlias, success, error)
        break;

      case Action.backgroundExecuteSqlBatch:
        this.executeSqlBatchDatabase(args, success, error)
        break;

    }

    return true;
  }

  //打开数据库方法
  startDatabase(dbname: string, success: (result?: Object) => void, error: (e: Object) => void): void {
    let dbfile = this.context.uiAbilityContext.databaseDir + "/rdb/" + dbname;
    let res = fs.accessSync(dbfile);

    if (res) {
      Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=open>>>>>>文件存在');
    } else {
      this.INIT(dbname);
    }

    try {
      const STORE_CONFIG: relationalStore.StoreConfig = {
        name: dbname,
        securityLevel: relationalStore.SecurityLevel.S1
      }

      relationalStore.getRdbStore(this.context.uiAbilityContext, STORE_CONFIG, (err, store) => {
        if (err) {
          Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=Failed to getRdbStore code:' + err.code + ", message:" + err.message);
          const e = { "code": err.code, "message": err.message }

          error(e);
          return;
        }
        Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=open>>>>>>Successed in getting RdbStore');
        let rdbstore = this.rdbMap.get(dbname) as relationalStore.RdbStore

        if (rdbstore == undefined) {
          this.rdbMap.set(dbname, store);
        }

        success();
      })
    } catch (err) {
      const e = { "code": err.code, "message": err.message }

      error(e);
    }
  }

  //关闭数据库方法
  closeDatabase(dbname: string, success: (t: Object, r: Object) => void, error: (e: Object) => void): void {
    //新版本中无close api方法
    success("data close", "");
  }

  //删除数据库方法
  deleteDatabase(dbname: string, success: (result?: Object) => void, error: (e: Object) => void): void {

    try {
      relationalStore.deleteRdbStore(this.context.uiAbilityContext, dbname).then(async () => {
        const rdbStore = this.rdbMap.get(dbname) as relationalStore.RdbStore;

        if (rdbStore != undefined) {
          this.rdbMap.delete(dbname);
        }

        Logger.debug(CommonConstants.TAG, 'RdbStore delete success');

        success('database deleted');
      });
    } catch (e) {
      const err = { "code": e.code, "message": e.message }

      error(err);
    }
  }

  //SQL执行数据库方法
  async executeSqlBatchDatabase(args: Object, success: (result?: Object) => void, error: (e: Object) => void): Promise<void> {
    const argsmap = args as Map<string, Object>;
    const map = new Map(Object.entries(JSON.parse(json.stringify(argsmap))));
    const dbArgs = map.get('dbargs');
    const txArgs: Executedata[] = map.get('executes');
    const dbArgsmap = new Map(Object.entries(JSON.parse(json.stringify(dbArgs))));
    const dbname = dbArgsmap.get('dbname');
    const rdbStore: relationalStore.RdbStore = this.rdbMap.get(dbname);

    if (rdbStore == undefined) {
      Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>database has been closed');

      return;
    }
    let callvalue: Array<Object> = [];
    const len = txArgs.length;

    for (let i = 0; i < len; i++) {
      const sqlmap = new Map(Object.entries(JSON.parse(json.stringify(txArgs[i]))));
      const queryId = sqlmap.get('qid');
      let querySql = sqlmap.get('sql');
      const queryParams: [] = sqlmap.get('params');
      let queryResultcall;
      let errorMessage: string = 'unknown';

      try {
        let needRawQuery: boolean = true;
        let queryTypeMatch = firstWordRegex.exec(querySql);
        let queryType = queryTypeMatch[1];

        if (queryType == 'CREATE' || queryType == 'DROP') {
          needRawQuery = false;

          try {
            await rdbStore.execute(querySql)

            queryResultcall = { 'rowsAffected': 1 }
          } catch (e) {
            errorMessage = e.message;
            Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>创建表失败=' + errorMessage);
          }

        } else if (queryType == 'INSERT') {
          needRawQuery = false;

          try {
            let rowId = await rdbStore.execute(querySql, queryParams)

            queryResultcall = { 'insertId': rowId, 'rowsAffected': 1 }
          } catch (e) {
            errorMessage = e.message;
            Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>插入数据失败=' + errorMessage);
          }

        } else if (queryType == 'UPDATE' || queryType == 'DELETE' || queryType == 'ALTER') {
          needRawQuery = false;
          let rowsAffected: relationalStore.ValueType = -1

          try {
            rowsAffected = await rdbStore.execute(querySql, queryParams);

            queryResultcall = { 'rowsAffected': rowsAffected }
          } catch (e) {
            errorMessage = e.message;
            Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>插入数据失败=' + errorMessage);
          }

        } else if (queryType == 'BEGIN') {
          needRawQuery = false;

          try {
            rdbStore.beginTransaction();

            queryResultcall = { 'rowsAffected': 0 }
          } catch (e) {
            errorMessage = e.message;
            Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>开始事务失败=' + errorMessage);
          }
        } else if (queryType == 'COMMIT') {
          needRawQuery = false;

          try {
            rdbStore.commit();

            queryResultcall = { 'rowsAffected': 0 }
          } catch (e) {
            errorMessage = e.message;
            Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>结束事务失败=' + errorMessage);
          }
        } else if (queryType == 'ROLLBACK') {
          needRawQuery = false;

          try {
            rdbStore.rollBack();

            queryResultcall = { 'rowsAffected': 0 }
          } catch (e) {
            errorMessage = e.message;
            Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>回滚事务失败=' + errorMessage);
          }
        }

        if (needRawQuery) {
          try {
            let resultSet = await rdbStore.querySql(querySql, queryParams)
            const count = resultSet.columnCount;
            Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>查询数据个数====' + count);
            let results: Array<relationalStore.ValuesBucket> = new Array<relationalStore.ValuesBucket>();

            while (resultSet.goToNextRow()) {
              results.push(resultSet.getRow());
            }

            queryResultcall = { 'rowsAffected': 0, 'rows': results }

            resultSet.close()
          } catch (e) {
            Logger.debug(CommonConstants.TAG, 'Get RdbStore execute fail');
            errorMessage = e.message
          }
        }
      } catch (e) {
        Logger.debug(CommonConstants.TAG, 'Get RdbStore execute fail');
        errorMessage = e.message
      }

      if (queryResultcall != null) {
        callvalue.push({ 'qid': queryId, 'type': 'success', 'result': queryResultcall },);
      } else {
        callvalue.push({ 'qid': queryId, 'type': 'error', 'result': { 'message': errorMessage } },);
      }

    }

    success(callvalue);
  }

  async attachDatabase(dbname: string, dbNameToAttach: string, dbAlias: string, success: (t: Object, r: Object) => void, error: (e: Object) => void): Promise<void> {

    const rdbStore = this.rdbMap.get(dbname) as relationalStore.RdbStore;

    if (rdbStore != undefined) {
      try {
        let filePathToAttached = this.context.uiAbilityContext.databaseDir + "/rdb/" + dbNameToAttach;

        try {

          await rdbStore.attach(filePathToAttached, dbAlias)

          Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=attachDatabase>>>>>>complete')

        } catch (e) {
          Logger.debug(CommonConstants.TAG, 'Get RdbStore execute fail');
          const err = { "code": e.code, "message": e.message }

          error(err);
        }

      } catch (e) {
        const err = { "code": e.code, "message": e.message }

        error(err);
      }

    }
  }

  //创建数据库沙箱目录并获取应用rawfile中数据库文件
  INIT(dbName: string) {
    //创建数据库沙箱目录
    let dirPath = this.context.uiAbilityContext.databaseDir

    try {
      fs.mkdirSync(dirPath);
    } catch (error) {
      Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=mkdir dirPath failed,error code:' + error.code + ", message:" + error.message);
    }

    try {
      dirPath = dirPath + "/rdb"

      fs.mkdirSync(dirPath);
    } catch (error) {
      Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=mkdir dirPathrdbPath failed,error code:' + error.code + ", message:" + error.message);
    }

    try {
      let result = this.context.uiAbilityContext.resourceManager.getRawFdSync('rdb/' + dbName);

      this.saveFileToCache(result, dbName)
    } catch (error) {
      Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=callback getRawFd failed,error code:' + error.code + ", message:" + error.message)
    }
  }

  //读取应用rawfile文件中的数据库并保存到数据库沙箱目录
  saveFileToCache(file: resourceManager.RawFileDescriptor, dbName: string) {
    let cFile = this.context.uiAbilityContext.databaseDir + "/rdb/" + dbName;
    let cacheFile = fs.openSync(cFile, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
    //读取缓冲区大小
    let bufferSize = 4096;
    let buffer = new ArrayBuffer(bufferSize);
    //创建buffer缓冲区
    //要copy的文件的offset和length
    let srcFileLength = file.length;
    let totalSizeOfCopy = 0
    let rwOption: ReadOptions = { offset: file.offset, length: bufferSize };

    while (true) {
      let readLength = fs.readSync(file.fd, buffer, rwOption);

      fs.writeSync(cacheFile.fd, buffer);
      rwOption.offset += readLength;
      totalSizeOfCopy += readLength;

      if (srcFileLength <= totalSizeOfCopy) {
        break;
      }
    }
    Logger.debug(CommonConstants.TAG, 'test--SQLitePlugin=Copy Success!!!>>>>>>');
    fs.close(cacheFile);
  }
}

interface Executedata {
  qid: number,
  sql: string,
  params: []
}

export enum Action {
  open = 'open',
  close = 'close',
  attach = 'attach',
  backgroundExecuteSqlBatch = 'backgroundExecuteSqlBatch',
  delete = 'delete',
  echoStringValue = 'echoStringValue',
}