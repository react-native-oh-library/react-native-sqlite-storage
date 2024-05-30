import { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import Logger from './Logger';
import CommonConstants from './CommonConstants';
import relationalStore from '@ohos.data.relationalStore'
import { JSON } from '@kit.ArkTS';
import json from '@ohos.util.json';
import constant from '@ohos.bluetooth.constant';
import { ifaa } from '@kit.OnlineAuthenticationKit';
import { resourceManager } from '@kit.LocalizationKit';
import fs, { ReadOptions } from '@ohos.file.fs';

// import { ValueType } from '@kit.ArkData';

const firstWordRegex = /^(\w+)/; // 匹配字符串开头的第一个单词

interface Executedata{
  qid:number,
  sql:string,
  params:[]
}

export class SQLitePluginTurboModule extends TurboModule implements TM.SQLitePlugin.Spec{
  static NAME = 'SQLitePlugin';
  // rdbStore: relationalStore.RdbStore;
  rdbMap: Map<string,relationalStore.RdbStore> = new Map<string,relationalStore.RdbStore>();
  context :TurboModuleContext

  constructor(ctx:TurboModuleContext) {
    super(ctx);
    Logger.debug(CommonConstants.TAG,'test--SQLitePlugin=>>>>>SQLitePluginTurboModule constructor');
    this.context = ctx;
  }

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
    console.info('test--SQLitePlugin=Copy Success!!!>>>>>>');
    fs.close(cacheFile);
  }
  INIT(dbName:string){
    //创建数据库沙箱目录
    try {
      let dirPath = this.context.uiAbilityContext.databaseDir
      fs.mkdirSync(dirPath);
      dirPath = dirPath+"/rdb"
      fs.mkdirSync(dirPath);
    } catch (error) {
      console.info('test--SQLitePlugin=mkdir rdbPath failed,error code:'+error.code+", message:"+error.message);
    }
    try {
      this.context.uiAbilityContext.resourceManager.getRawFd('rdb/'+dbName,(error,value) => {
        if (error!=null) {
          console.info('test--SQLitePlugin=callback getRawFd failed,error code:'+error.code+", message:"+error.message)
        }else{
          console.info('test--SQLitePlugin=Copy Success!!!>>>>>>'+value.length.toString())
          this.saveFileToCache(value,dbName)
        }
      })
    } catch (error) {
      console.info('test--SQLitePlugin=callback getRawFd failed,error code:'+error.code+", message:"+error.message)
    }
  }

  open(openargs: Object, opensuccesscb: () => void, openerrorcb: (e: Object) => void): void {
    console.info('test--SQLitePlugin=open>>>>>>open database start...');
    const args = openargs as Map<string,Object>;
    console.info('test--SQLitePlugin=open>>>>>>'+json.stringify(args));
    const mymap = new Map(Object.entries(JSON.parse(json.stringify(args))));
    const dbName = mymap.get('name');
    let dbfile = this.context.uiAbilityContext.databaseDir+"/rdb/"+dbName;
    let res = fs.accessSync(dbfile);
    if (res) {
      console.info('test--SQLitePlugin=open>>>>>>文件存在');
    }else{
      this.INIT(dbName);
    }
    try {
      const STORE_CONFIG: relationalStore.StoreConfig = {
        name: dbName,
        securityLevel: relationalStore.SecurityLevel.S1,
      }
      relationalStore.getRdbStore(this.context.uiAbilityContext,STORE_CONFIG,(err,store) => {
        if (err) {
          console.info('test--SQLitePlugin=Failed to getRdbStore code:'+err.code+", message:"+err.message);
          return;
        }else{
          Logger.debug(CommonConstants.TAG,'Get RdbStore success');
          console.info('test--SQLitePlugin=open>>>>>>Successed in getting RdbStore');
        }
        // this.rdbStore = store;
        let rdbstore = this.rdbMap.get(dbName) as relationalStore.RdbStore
        if (rdbstore==undefined) {
          this.rdbMap.set(dbName,store);
          let rdbstore = this.rdbMap.get(dbName) as relationalStore.RdbStore
          console.info('test--SQLitePlugin=open>>>>>>===='+rdbstore.version);
        }
        opensuccesscb();
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

  async backgroundExecuteSqlBatch(args: Object, mysuccess: (result: Object) => void, myerror: (e: Object) => void): Promise<void> {
    Logger.debug(CommonConstants.TAG,'RdbStore ExecuteSql');
    console.info('test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>'+json.stringify(args));
    const exeargs = args as Map<string,Object>;
    const mymap = new Map(Object.entries(JSON.parse(json.stringify(exeargs))));
    const dbArgs = mymap.get('dbargs');
    const txArgs:Executedata[] = mymap.get('executes');
    const dbArgsmap = new Map(Object.entries(JSON.parse(json.stringify(dbArgs))));
    const dbname = dbArgsmap.get('dbname');
    const rdbStore: relationalStore.RdbStore = this.rdbMap.get(dbname);
    let callvalue: Array<Object> = [];
    if (rdbStore==undefined) {
      Logger.debug(CommonConstants.TAG,'database has been closed');
      console.info('test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>database has been closed');
      return;
    }
    const len = txArgs.length;
    for (let i = 0; i < len; i++) {
      const sqlmap = new Map(Object.entries(JSON.parse(json.stringify(txArgs[i]))));
      const queryId = sqlmap.get('qid');
      const querySql = sqlmap.get('sql');
      const queryParams = sqlmap.get('params');
      let queryResult:Map<string,Object> = null;
      let errorMessage:string = 'unknown';
      try {
        let needRawQuery:boolean = true;
        let queryTypeMatch = firstWordRegex.exec(querySql);
        let queryType = queryTypeMatch[1];
        if (queryType=='INSERT') {
          const values = this.extractInsertObject(querySql);
          let obj:relationalStore.ValuesBucket = {};
          // ValuesBucket values = new ValuesBucket();
          let valuesBucket = {'name':''};
          for (let i = 0; i < values.fields.length; i++) {
            obj.key = values.fields[i];
            obj.value = values.values[i];

            valuesBucket = {'name':values.values[i]};
          }
          await rdbStore.insert(values.tableName,valuesBucket).then(async (rowId) =>{
            queryResult = new Map<string,Object>();
            queryResult.set('insertId',rowId);
            queryResult.set('rowsAffected',1);
          });
          // callvalue = [{"result":{"rowsAffected":1,'insertId':rowId},"type":"success","qid":queryId}];
          // setTimeout(()=>{
          //   mysuccess(callvalue);
          // },0);

        }else if (queryType=='BEGIN'){
          rdbStore.beginTransaction();
          queryResult = new Map<string,Object>();
          queryResult.set('rowsAffected',0);
        }else if (queryType=='COMMIT'){
          rdbStore.commit();
          queryResult = new Map<string,Object>();
          queryResult.set('rowsAffected',0);
        }else if (queryType=='ROLLBACK'){
          queryResult = new Map<string,Object>();
          queryResult.set('rowsAffected',0);
        }else if(queryType=='SELECT'){
          await rdbStore.querySql(querySql).then((async (resultSet) => {
            let key = '';
            const count = resultSet.columnCount;
            console.info('test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>查询数据个数===='+count);
            // let results: Map<string,Object>[] = [];
            let results: Array<Object> = [];
            try {
              while (resultSet.goToNextRow()){
                for (let i = 0; i < count; i++) {
                  let map = new Map<string,Object>();
                  key = resultSet.getColumnName(i);
                  map.set(key,resultSet.getValue(i));
                  console.info('test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>查询数据===key='+key+"       value="+resultSet.getValue(i));
                  results.push(map);
                }
              }
              queryResult = new Map<string,Object>();
              queryResult.set("rows",results);
              resultSet.close()
              for (let i = 0; i < results.length; i++) {
                console.info('test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>===='+"结果个数："+i+JSON.stringify(results[i]));
              }
              // callvalue = [{"result":{"rows":results},"type":"success","qid":queryId}];
              // setTimeout(()=>{
              //   mysuccess(callvalue);
              // },0);
            } catch (e) {
              Logger.debug(CommonConstants.TAG,'Get RdbStore execute fail');
              errorMessage = e.message
              // if (myerror!=null) {
              //   const err = {
              //     "code":e.code,
              //     "message":e.message
              //   }
              //   myerror(err);
              // }
            }
          }))
          /*rdbStore.querySql(querySql,(err,resultSet) =>{
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
          });*/
        }else {
          await rdbStore.executeSql(querySql,() =>{
            Logger.debug(CommonConstants.TAG,'RdbStore ExecuteSql Complete');
            console.info('test--SQLitePlugin=backgroundExecuteSqlBatch>>>>>>complete')
            // const callvalue = [{"result":{"rowsAffected":0},"type":"success","qid":queryId}];
            queryResult = new Map<string,Object>();
            queryResult.set("rowsAffected",0);
            // setTimeout(()=>{
            //   mysuccess(callvalue);
            // },0);
          })
        }
      } catch (e) {
        Logger.debug(CommonConstants.TAG,'Get RdbStore execute fail');
        errorMessage = e.message
        // if (myerror!=null) {
        //   const err = {
        //     "code":e.code,
        //     "message":e.message
        //   }
        //   myerror(err);
        // }
      }
      if (queryResult != null) {
        let r: Map<string,Object> = new Map<string,Object>();
        r.set('qid',queryId)
        r.set('type',"success")
        r.set('result',queryResult)
        callvalue.push(r);
      }else{
        let r: Map<string,Object> = new Map<string,Object>();
        r.set('qid',queryId)
        r.set('type',"error")
        let er:Map<string,Object> = new Map<string,Object>();
        er.set('message',errorMessage)
        r.set('result',er)
        callvalue.push(r);
      }
      
    }
    mysuccess(callvalue);

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
        // this.rdbStore=undefined;
        if (this.rdbMap.get(dbName)!=undefined) {
          this.rdbMap.delete(dbName);
        }
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