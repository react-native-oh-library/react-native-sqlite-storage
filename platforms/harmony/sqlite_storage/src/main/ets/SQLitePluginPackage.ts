import {
  RNPackage,
  AnyThreadTurboModuleFactory,
  AnyThreadTurboModuleContext,
  AnyThreadTurboModule
 } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { SQLitePluginTurboModule } from './SQLitePluginTurboModule';
import Logger from './Logger';
import CommonConstants from './CommonConstants';

class SQLitePluginTurboModulesFactory extends AnyThreadTurboModuleFactory {
  createTurboModule(name: string): AnyThreadTurboModule | null {
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
  createAnyThreadTurboModuleFactory(ctx: AnyThreadTurboModuleContext): AnyThreadTurboModuleFactory  {
    return new SQLitePluginTurboModulesFactory(ctx);
  }
}