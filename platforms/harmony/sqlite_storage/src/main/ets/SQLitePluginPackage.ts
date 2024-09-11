import {
  RNPackage,
  WorkerTurboModuleFactory,
  WorkerTurboModuleContext,
  WorkerTurboModule
 } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { SQLitePluginTurboModule } from './SQLitePluginTurboModule';
import Logger from './Logger';
import CommonConstants from './CommonConstants';

class SQLitePluginTurboModulesFactory extends WorkerTurboModuleFactory {
  createTurboModule(name: string): WorkerTurboModule | null {
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
  createWorkerTurboModuleFactory(ctx: WorkerTurboModuleContext): WorkerTurboModuleFactory {
    return new SQLitePluginTurboModulesFactory(ctx);
  }
}