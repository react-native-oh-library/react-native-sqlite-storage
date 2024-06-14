import { RNPackage, TurboModulesFactory } from '@rnoh/react-native-openharmony/ts';
import type { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { SQLitePluginTurboModule } from './SQLitePluginTurboModule';
import Logger from './Logger';
import CommonConstants from './CommonConstants';


class SQLitePluginTurboModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name == TM.SQLitePlugin.NAME) {
      return new SQLitePluginTurboModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name == TM.SQLitePlugin.NAME;
  }
}

export class SQLitePluginPackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new SQLitePluginTurboModulesFactory(ctx);
  }
}