import { RNPackage,TurboModulesFactory } from '@rnoh/react-native-openharmony/ts';
import type { TurboModule, TurboModuleContext} from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { SQLitePluginTurboModule } from './SQLitePluginTurboModule';


class SQLitePluginTurboModulesFactory extends TurboModulesFactory{

  createTurboModule(name: string): TurboModule | null {
    console.info("test--qwf=SQLitePlugin=createTurboModule>>>>>"+name);
    if (name == TM.SQLitePlugin.NAME) {
      return new SQLitePluginTurboModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    console.info("test--qwf=SQLitePlugin=hasTurboModule>>>>>"+name);
    return name == TM.SQLitePlugin.NAME;
  }
}
export class SQLitePluginPackage extends RNPackage{
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    console.info("test--qwf=SQLitePlugin=createTurboModulesFactory>>>>>");
    return new SQLitePluginTurboModulesFactory(ctx);
  }
}