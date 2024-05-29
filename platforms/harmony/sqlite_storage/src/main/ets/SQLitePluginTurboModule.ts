import { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import Logger from './Logger';
import CommonConstants from './CommonConstants';
import relationalStore from '@ohos.data.relationalStore'
import { JSON } from '@kit.ArkTS';
import json from '@ohos.util.json';
import constant from '@ohos.bluetooth.constant';
import { ifaa } from '@kit.OnlineAuthenticationKit';
// import { ValueType } from '@kit.ArkData';

const firstWordRegex = /^(\w+)/; // 匹配字符串开头的第一个单词

interface Executedata{
  qid:number,
  sql:string,
  params:[]
}

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

  open(openargs: Object, opensuccesscb: () => void, openerrorcb: (e: Object) => void): void {
    console.info('test--SQLitePlugin=open>>>>>>open database start...');
    const args = openargs as Map<string,Object>;
    console.info('test--SQLitePlugin=open>>>>>>'+json.stringify(args));
    const mymap = new Map(Object.entries(JSON.parse(json.stringify(args))));
    const dbName = mymap.get('name');
    this.STORE_CONFIG.name = dbName;
    try {
      let promise = relationalStore.getRdbStore(this.context.uiAbilityContext,this.STORE_CONFIG);
      promise.then(async (store) => {
        this.rdbStore = store;
        Logger.debug(CommonConstants.TAG,'Get RdbStore success');
        opensuccesscb();
        return this.rdbStore;
      });
    } catch (e) {
      Logger.debug(CommonConstants.TAG,'Get RdbStore fail');
      if (openerrorcb!=null) {
        const err = {
          "code":e.code,
          "message":e.message
        }
        openerrorcb(err);
      }
    }
  }

  close(closeargs: Object, mysuccess: (t: Object, r: Object) => void, myerror: (e: Object) => void): void {
    Logger.debug(CommonConstants.TAG,'RdbStore close success');
    console.info('test--SQLitePlugin=close>>>>>>'+json.stringify(closeargs));
    mysuccess("","data close");
  }

  attach(attachargs: Object, mysuccess: (t: Object, r: Object) => void, myerror: (e: Object) => void): void {
    Logger.debug(CommonConstants.TAG,'RdbStore attach');
    console.info('test--SQLitePlugin=close>>>>>>'+json.stringify(attachargs));
    mysuccess("","attach");
  }

  backgroundExecuteSqlBatch(args: Object, mysuccess: (result: Object) => void, myerror: (e: Object) => void): void {
    Logger.debug(CommonConstants.TAG,'RdbStore ExecuteSql');
    console.info('test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>'+json.stringify(args));
    if (this.rdbStore==undefined) {
      Logger.debug(CommonConstants.TAG,'database has been closed');
      console.info('test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>database has been closed');
      return;
    }
    const exeargs = args as Map<string,Object>;
    const mymap = new Map(Object.entries(JSON.parse(json.stringify(exeargs))));
    const dbArgs = mymap.get('dbargs');
    const txArgs:Executedata[] = mymap.get('executes');
    const dbArgsmap = new Map(Object.entries(JSON.parse(json.stringify(txArgs))));
    const dbname = dbArgsmap.get('dbname');
    const len = txArgs.length;
    for (let i = 0; i < len; i++) {
      const sqlmap = new Map(Object.entries(JSON.parse(json.stringify(txArgs[i]))));
      const queryId = sqlmap.get('qid');
      const querySql = sqlmap.get('sql');
      const queryParams = sqlmap.get('params');
      try {
        let needRawQuery:boolean = true;
        let queryTypeMatch = firstWordRegex.exec(querySql);
        let queryType = queryTypeMatch[1];
        if (queryType=='INSERT') {
          const values = this.extractInsertObject(querySql);
          let obj:relationalStore.ValuesBucket = {};
          let valuesBucket = {'name':''};
          for (let i = 0; i < values.fields.length; i++) {
            obj.key = values.fields[i];
            obj.value = values.values[i];
            valuesBucket = {'name':values.values[i]};
          }
          this.rdbStore.insert(values.tableName,valuesBucket,function (err,rowId){
            const callvalue = [{"result":{"rowsAffected":0},"type":"success","qid":queryId}];
            setTimeout(()=>{
              mysuccess(callvalue);
            },0);
          });

        }else if(queryType=='SELECT'){
          this.rdbStore.querySql(querySql,(err,resultSet) =>{
            if (err) {
              Logger.debug(CommonConstants.TAG,'database query fail '+err.message);
              console.info('test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>database query fail '+err.message);
            }else{
              let key = '';
              const count = resultSet.columnCount;
              let results: Map<string,Object>[] = [];
              try {
                while (resultSet.goToNextRow()){
                  for (let i = 0; i < count; i++) {
                    let map = new Map<string,Object>();
                    key = resultSet.getColumnName(i);
                    map.set(key,resultSet.getValue(i));
                    results.push(map);
                  }
                }
                const callvalue = [{"result":{"rows":results},"type":"success","qid":queryId}];
                setTimeout(()=>{
                  mysuccess(callvalue);
                },0);
              } catch (e) {
                Logger.debug(CommonConstants.TAG,'Get RdbStore execute fail');
                if (myerror!=null) {
                  const err = {
                    "code":e.code,
                    "message":e.message
                  }
                  myerror(err);
                }
              }
            }
          });
        }else {
          this.rdbStore.executeSql(querySql,() =>{
            Logger.debug(CommonConstants.TAG,'RdbStore ExecuteSql Complete');
            console.info('test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>complete')
            const callvalue = [{"result":{"rowsAffected":0},"type":"success","qid":queryId}];
            setTimeout(()=>{
              mysuccess(callvalue);
            },0);
          })
        }
      } catch (e) {
        Logger.debug(CommonConstants.TAG,'Get RdbStore execute fail');
        if (myerror!=null) {
          const err = {
            "code":e.code,
            "message":e.message
          }
          myerror(err);
        }
      }
      
    }

  }

  echoStringValue(openargs: Object, mysuccess: (testValue: Object) => void, myerror: (e: Object) => void): void {
    Logger.debug(CommonConstants.TAG,'RdbStore echoStringValue');
    console.info('test--SQLitePlugin=echoStringValue>>>>>>'+json.stringify(openargs));
    try {
      const args = openargs as Map<string,Object>;
      const mymap = new Map(Object.entries(JSON.parse(json.stringify(args))));
      Logger.debug(CommonConstants.TAG,'RdbStore echoStringValue success');
      mysuccess(mymap.get('value'));
    } catch (e) {
      const err = {
        "code":e.code,
        "message":e.message
      }
      myerror(err);
    }
  }

  delete(args: Object, mysuccess: (r:Object) => void, myerror: (e: Object) => void): void {
    Logger.debug(CommonConstants.TAG,'RdbStore delete');
    console.info('test--SQLitePlugin=delete>>>>>>'+json.stringify(args));
    try {
      const deleteargs = args as Map<string,Object>;
      const mymap = new Map(Object.entries(JSON.parse(json.stringify(deleteargs))));
      const dbName = mymap.get('path');
      let promise = relationalStore.deleteRdbStore(this.context.uiAbilityContext,dbName);
      promise.then(() => {
        this.rdbStore=undefined;
        Logger.debug(CommonConstants.TAG,'RdbStore delete success');
        mysuccess('database deleted');
      });
    } catch (e) {
      const err = {
        "code":e.code,
        "message":e.message
      }
      myerror(err);
    }
  }

  // openDatabase(dbname: string, dbVersion: string, dbDisplayname: string, dbSize: number, success: () => void, error: (e: Object) => void): Object {
  //   Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=openDatabase>>>>>"+dbname);
  //   this.STORE_CONFIG.name = dbname;
  //   let promise = relationalStore.getRdbStore(this.context.uiAbilityContext,this.STORE_CONFIG);
  //   promise.then(async (store) => {
  //     this.rdbStore = store;
  //     success();
  //     Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=openDatabase>>>>>success");
  //     return this.rdbStore;
  //   }).catch((err) => {
  //     Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=openDatabase>>>>>fail error");
  //     if (error!=null) {
  //       const err1 = {
  //         "code":err.code,
  //         "message":err.message
  //       }
  //       error(err1);
  //     }
  //   })
  //   // }
  //   return 'openDatabase fail';
  // }
  // async executeSql(store: Object,query: string, params: any[], success: (s: Object) => void, error: (e: Object) => void): Promise<void> {
  //   Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=executeSql>>>>>"+query);
  //   let mydb = store as relationalStore.RdbStore;
  //   if (mydb==null) {
  //     Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=database has been closed>>>>>");
  //     return;
  //   }
  //   let errorMessage = "unknown";
  //   try {
  //     let queryTypeMatch = firstWordRegex.exec(query);
  //     let queryType = queryTypeMatch[1];
  //     if (queryType == 'INSERT'){
  //       try {
  //         const  values = this.extractInsertObject(query);
  //         let obj: relationalStore.ValuesBucket = {};
  //         let valuesBucket = {"name":"", };
  //         for (let i = 0; i < values.fields.length; i++) {
  //           obj.key = values.fields[i];
  //           obj.value = values.values[i];
  //           valuesBucket = { "name":values.values[i], };
  //           let info = "key: "+values.fields[i]+"    value: "+values.values[i];
  //           console.log(info);
  //         }
  //         this.rdbStore.insert(values.tableName,valuesBucket,function (err,rowId){
  //           success("success");
  //           Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=insert>>>>success");
  //         });
  //       } catch (err) {
  //         errorMessage = err.message;
  //         const err1 = {
  //           "code":err.code,
  //           "message":err.message
  //         }
  //         error(err1);
  //         Logger.debug(CommonConstants.TAG, `SQLiteDatabase.executeSql.INSERT() failed, code is ${err.code},message is ${err.message}`,);
  //       }
  //     }else if (queryType == 'SELECT'){
  //       await this.rdbStore.querySql(query,params,function(err,resultSet){
  //         if (err) {
  //           Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=query>>>>fail,==="+err.message);
  //         }else {
  //           let key = '';
  //           let colCount = resultSet.columnCount;
  //           let results: Object[] = [];
  //           try {
  //             while (resultSet.goToNextRow()){
  //               for (let i = 0; i < colCount; i++) {
  //                 key =resultSet.getColumnName(i);
  //                 // results.push("key:"+key+"      value:"+resultSet.getValue(i)?.toString())
  //               }
  //             }
  //             success(resultSet);
  //             // 释放数据集的内存
  //             resultSet.close();
  //           } catch (err) {
  //             // 释放数据集的内存
  //             resultSet.close();
  //             const err1 = {
  //               "code":err.code,
  //               "message":err.message
  //             }
  //             error(err1);
  //           }
  //         }
  //       });
  //     }else {
  //       try {
  //         await this.rdbStore.executeSql(query,params);
  //         success('  success');
  //       } catch (err) {
  //         errorMessage = err.message;
  //         const err1 = {
  //           "code":err.code,
  //           "message":err.message
  //         }
  //         error(err1);
  //         Logger.debug(CommonConstants.TAG, `SQLiteDatabase.executeSql() failed, code is ${err.code},message is ${err.message}`,);
  //       }
  //     }
  //   } catch (err) {
  //     if (error!=null) {
  //       let e = `Get RdbStore failed, code is ${err.code},message is ${err.message}`;
  //       const err1 = {
  //         "code":err.code,
  //         "message":err.message
  //       }
  //       error(err1);
  //     }
  //   }
  // }
  // close(store: Object,success: () => void, error: (err: Object) => void): void {
  //   success();
  // }
  // deleteDatabase(dbname: string, success: () => void, error: (err: Object) => void): Promise<void> | void{
  //   Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=deleteDatabase>>>>>"+dbname);
  //   let promise = relationalStore.deleteRdbStore(this.context.uiAbilityContext, dbname);
  //   promise.then(()=>{
  //     this.rdbStore= undefined;
  //     Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=deleteDatabase>>>>>success");
  //     success();
  //   }).catch((err) => {
  //     Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=deleteDatabase>>>>>fail=="+err.message);
  //     const err1 = {
  //       "code":err.code,
  //       "message":err.message
  //     }
  //     error(err1);
  //   });
  // }

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