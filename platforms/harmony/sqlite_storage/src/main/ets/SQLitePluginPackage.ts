import { RNPackage,TurboModulesFactory } from '@rnoh/react-native-openharmony/ts';
import type { TurboModule, TurboModuleContext} from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { SQLitePluginTurboModule } from './SQLitePluginTurboModule';
import Logger from './Logger';
import CommonConstants from './CommonConstants';


class SQLitePluginTurboModulesFactory extends TurboModulesFactory{

  createTurboModule(name: string): TurboModule | null {
    Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=createTurboModule>>>>>"+name);
    if (name == TM.SQLitePlugin.NAME) {
      return new SQLitePluginTurboModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=hasTurboModule>>>>>"+name);
    return name == TM.SQLitePlugin.NAME;
  }
}
export class SQLitePluginPackage extends RNPackage{
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    Logger.debug(CommonConstants.TAG,"test--SQLitePlugin=createTurboModulesFactory>>>>>");
    return new SQLitePluginTurboModulesFactory(ctx);
  }
}