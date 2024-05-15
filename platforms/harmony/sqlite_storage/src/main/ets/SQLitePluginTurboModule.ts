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
    console.info("test--qwf=SQLitePlugin=>>>>>SQLitePluginTurboModule constructor");
    Logger.debug(CommonConstants.TAG,'SQLitePluginTurboModule constructor');
    this.context = ctx;
  }

  DEBUG(isDebug: boolean): void {
    console.info("test--qwf=SQLitePlugin=DEBUG>>>>>");
  }

  enablePromise(enablePromise: boolean): void {
    console.info("test--qwf=SQLitePlugin=enablePromise>>>>>");
  }
  openDatabase(dbname: string, dbVersion: string, dbDisplayname: string, dbSize: number, success: () => void, error: (e: Object) => void): Object {
    console.info("test--qwf=SQLitePlugin=openDatabase>>>>>"+dbname);
    console.info("test--qwf=SQLitePlugin=openDatabase>>>>>数据库打开");
    this.STORE_CONFIG.name = dbname;
    let promise = relationalStore.getRdbStore(this.context.uiAbilityContext,this.STORE_CONFIG);
    promise.then(async (store) => {
      console.info("test--qwf=SQLitePlugin=openDatabase>>>>>数据库打开成功");
      this.rdbStore = store;
      Logger.debug(CommonConstants.TAG, `Get RdbStore success`,);
      success();
      console.info("test--qwf=SQLitePlugin=openDatabase>>>>>数据库返回");
      return this.rdbStore;
    }).catch((err) => {
      Logger.debug(CommonConstants.TAG,'Get RdbStore failed');
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
    console.info("test--qwf=SQLitePlugin=executeSql>>>>>"+query);
    let mydb = store as relationalStore.RdbStore;
    if (mydb==null) {
      Logger.debug(CommonConstants.TAG, `database has been closed`,);
      return;
    }
    let errorMessage = "unknown";
    try {
      let queryTypeMatch = firstWordRegex.exec(query);
      let queryType = queryTypeMatch[1];
      console.info("test--qwf=SQLitePlugin=executeSql>>>>>"+queryType);
      if (queryType == 'INSERT'){
        console.info("test--qwf=SQLitePlugin=executeSql>>>>>"+queryType);
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
          console.info("test--qwf=SQLitePlugin=insert>>>>>tableName=="+values.tableName+"    "+JSON.stringify(valuesBucket));
          this.rdbStore.insert(values.tableName,valuesBucket,function (err,rowId){
            success("success");
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
            console.info("test--qwf=SQLitePlugin=querySql>>>>>查询SQL数据==="+err.message);
            Logger.debug(CommonConstants.TAG, `SQLiteDatabase Query failed, code is ${err.code},message is ${err.message}`,);
          }else {
            let key = '';
            let colCount = resultSet.columnCount;
            console.info("test--qwf=SQLitePlugin=querySql>>>>>查询SQL数据==colCount="+colCount+"  resultSet.getRow==  "+JSON.stringify(resultSet.columnNames));
            let results: Object[] = [];
            try {
              while (resultSet.goToNextRow()){
                for (let i = 0; i < colCount; i++) {
                  key =resultSet.getColumnName(i);
                  console.info("test--qwf=SQLitePlugin=querySql>>>>>key:"+key+"      value:"+resultSet.getValue(i));
                  // results.push("key:"+key+"      value:"+resultSet.getValue(i)?.toString())
                }
              }
              success(results);
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
          console.info("test--qwf=SQLitePlugin=executeSql>>>>>执行"+query);
          await this.rdbStore.executeSql(query,params);
          success('  success');
        } catch (err) {
          errorMessage = err.message;
          console.info("test--qwf=SQLitePlugin=executeSql>>error1111111>>>"+errorMessage);
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
        console.info("test--qwf=SQLitePlugin=executeSql>>>>>查询SQL数据失败");
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
    // let promise = this.rdbStore.;
    // promise.then(() => {
    //   console.info(`Close RdbStore successfully.`);
    //   success(`Close RdbStore successfully.`);
    // }).catch((err) => {
    //   console.error(`Close RdbStore failed, code is ${err.code},message is ${err.message}`);
    //   error(`Close RdbStore failed, code is ${err.code},message is ${err.message}`);
    // })
  }
  deleteDatabase(dbname: string, success: () => void, error: (err: Object) => void): Promise<void> | void{
    console.info("test--qwf=SQLitePlugin=deleteDatabase>>>>>"+dbname);
    let promise = relationalStore.deleteRdbStore(this.context.uiAbilityContext, dbname);
    promise.then(()=>{
      this.rdbStore= undefined;
      console.info(`test--qwf=SQLitePlugin=deleteDatabase>>>>>Delete RdbStore successfully.`);
      success();
    }).catch((err) => {
      console.error(`test--qwf=SQLitePlugin=deleteDatabase>>>>>Delete RdbStore failed, code is ${err.code},message is ${err.message}`);
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