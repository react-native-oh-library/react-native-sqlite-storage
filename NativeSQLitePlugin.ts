import type {TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  DEBUG(isDebug: boolean): void;
  enablePromise(enablePromise: boolean): void;
  openDatabase(dbname:string,dbVersion:string,dbDisplayname:string,dbSize:number,success?: () => void,error?: (e: Object) => void,): Object;
  deleteDatabase(dbname: string, success?: () => void, error?: (err: Object) => void): void;
  executeSql(store:Object,statement: string, params?: any[], success?: (s?: Object) => void, error?: (e: Object) => void): Promise<void>;
  // transaction(scope: (tx: Transaction) => void,error?: (e: Object) => void,success?: () => void,): void;
  close(store:Object,success: () => void, error: (err: Object) => void): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SQLitePlugin');