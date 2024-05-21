import { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import Logger from './Logger';
import CommonConstants from './CommonConstants';
import relationalStore from '@ohos.data.relationalStore'
import { JSON } from '@kit.ArkTS';

const firstWordRegex = /^(\w+)/; // 匹配字符串开头的第一个单词

export class SQLitePluginTurboModule extends TurboModule implements TM.SQLitePlugin.Spec{
  static NAME = 'SQLitePlugin';
  rdbStore: relationalStore.RdbStore;
  rdbMap: Map<string,relationalStore.RdbStore>;
  private STORE_CONFIG: relationalStore.StoreConfig = {
    name: 'SQLite.db',
    securityLevel: relationalStore.SecurityLevel.S1
  };
  context :TurboModuleContext

  constructor(ctx:TurboModuleContext) {
    super(ctx);
    Logger.debug(CommonConstants.TAG,'test--SQLitePlugin=>>>>>SQLitePluginTurboModule constructor');
    this.context = ctx;
  }

  DEBUG(isDebug: boolean): void {
    Logger.debug(CommonConstants.TAG,'test--SQLitePlugin=>>>>>DEBUG');
  }

  enablePromise(enablePromise: boolean): void {
    Logger.debug(CommonConstants.TAG,'test--SQLitePlugin=>>>>>enablePromise');
  }
  openDatabase(dbname: string, dbVersion: string, dbDisplayname: string, dbSize: number, success: () => void, error: (e: Object) => void): Object {
    Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=openDatabase>>>>>"+dbname);
    this.STORE_CONFIG.name = dbname;
    let promise = relationalStore.getRdbStore(this.context.uiAbilityContext,this.STORE_CONFIG);
    promise.then(async (store) => {
      this.rdbStore = store;
      success();
      Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=openDatabase>>>>>success");
      return this.rdbStore;
    }).catch((err) => {
      Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=openDatabase>>>>>fail error");
      if (error!=null) {
        const err1 = {
          "code":err.code,
          "message":err.message
        }
        error(err1);
      }
    })
    // }
    return 'openDatabase fail';
  }
  async executeSql(store: Object,query: string, params: any[], success: (s: Object) => void, error: (e: Object) => void): Promise<void> {
    Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=executeSql>>>>>"+query);
    let mydb = store as relationalStore.RdbStore;
    if (mydb==null) {
      Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=database has been closed>>>>>");
      return;
    }
    let errorMessage = "unknown";
    try {
      let queryTypeMatch = firstWordRegex.exec(query);
      let queryType = queryTypeMatch[1];
      if (queryType == 'INSERT'){
        try {
          const  values = this.extractInsertObject(query);
          let obj: relationalStore.ValuesBucket = {};
          let valuesBucket = {"name":"", };
          for (let i = 0; i < values.fields.length; i++) {
            obj.key = values.fields[i];
            obj.value = values.values[i];
            valuesBucket = { "name":values.values[i], };
            let info = "key: "+values.fields[i]+"    value: "+values.values[i];
            console.log(info);
          }
          this.rdbStore.insert(values.tableName,valuesBucket,function (err,rowId){
            success("success");
            Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=insert>>>>success");
          });
        } catch (err) {
          errorMessage = err.message;
          const err1 = {
            "code":err.code,
            "message":err.message
          }
          error(err1);
          Logger.debug(CommonConstants.TAG, `SQLiteDatabase.executeSql.INSERT() failed, code is ${err.code},message is ${err.message}`,);
        }
      }else if (queryType == 'SELECT'){
        await this.rdbStore.querySql(query,params,function(err,resultSet){
          if (err) {
            Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=query>>>>fail,==="+err.message);
          }else {
            let key = '';
            let colCount = resultSet.columnCount;
            let results: Object[] = [];
            try {
              while (resultSet.goToNextRow()){
                for (let i = 0; i < colCount; i++) {
                  key =resultSet.getColumnName(i);
                  // results.push("key:"+key+"      value:"+resultSet.getValue(i)?.toString())
                }
              }
              success(resultSet);
              // 释放数据集的内存
              resultSet.close();
            } catch (err) {
              // 释放数据集的内存
              resultSet.close();
              const err1 = {
                "code":err.code,
                "message":err.message
              }
              error(err1);
            }
          }
        });
      }else {
        try {
          await this.rdbStore.executeSql(query,params);
          success('  success');
        } catch (err) {
          errorMessage = err.message;
          const err1 = {
            "code":err.code,
            "message":err.message
          }
          error(err1);
          Logger.debug(CommonConstants.TAG, `SQLiteDatabase.executeSql() failed, code is ${err.code},message is ${err.message}`,);
        }
      }
    } catch (err) {
      if (error!=null) {
        let e = `Get RdbStore failed, code is ${err.code},message is ${err.message}`;
        const err1 = {
          "code":err.code,
          "message":err.message
        }
        error(err1);
      }
    }
  }
  close(store: Object,success: () => void, error: (err: Object) => void): void {
    success();
  }
  deleteDatabase(dbname: string, success: () => void, error: (err: Object) => void): Promise<void> | void{
    Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=deleteDatabase>>>>>"+dbname);
    let promise = relationalStore.deleteRdbStore(this.context.uiAbilityContext, dbname);
    promise.then(()=>{
      this.rdbStore= undefined;
      Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=deleteDatabase>>>>>success");
      success();
    }).catch((err) => {
      Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=deleteDatabase>>>>>fail=="+err.message);
      const err1 = {
        "code":err.code,
        "message":err.message
      }
      error(err1);
    });
  }

  extractInsertObject(sql: string): { tableName: string, fields: string[], values: string[] } | null {
    const insertPattern = /INSERT INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i;
    const match = sql.match(insertPattern);

    if (match) {
      const tableName = match[1];
      const fields = match[2].split(',').map(field => field.trim());
      const valueStrings = match[3].split(',').map(value => value.trim());

      // 如果需要进一步解析值（比如从字符串转为实际类型），这里可以添加逻辑
      return { tableName, fields, values: valueStrings };
    }

    return null; // 如果不匹配返回null
  }
}