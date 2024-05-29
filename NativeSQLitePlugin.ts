import type {TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  
  open(openargs:Object,opensuccesscb:() => void,openerrorcb:(e:Object) => void):void;

  close(closeargs:Object,mysuccess:(t:Object,r:Object) => void,myerror:(e:Object) => void):void;

  attach(attachargs:Object,mysuccess:(t:Object,r:Object) => void,myerror:(e:Object) => void):void;

  backgroundExecuteSqlBatch(args:Object,mysuccess:(result:Object) => void,myerror:(e:Object) => void):void;

  echoStringValue(openargs:Object,mysuccess:(testValue:Object) => void,myerror:(e:Object) => void):void;

  delete(args:Object,mysuccess:(r:Object) => void,myerror:(e:Object) => void):void;

}

export default TurboModuleRegistry.getEnforcing<Spec>('SQLitePlugin');