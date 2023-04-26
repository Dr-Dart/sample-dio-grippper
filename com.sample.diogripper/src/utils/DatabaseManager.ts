/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-console */
/* eslint-disable no-magic-numbers */
import { IDartDatabase, Context, ModuleContext } from 'dart-api';
import { GripperInfo } from '../types';
import { INITIAL_DATA } from "../constants";

class DatabaseManager {
  private readonly TABLE_DIGITALIO = 'digitalIO';
  private readonly TABLE_DIGITALIO_COLUMNS_ID = 'id';
  private readonly TABLE_DIGITALIO_COLUMNS_DATA = 'data';
  private readonly TABLE_DIGITALIO_COLUMNS = [this.TABLE_DIGITALIO_COLUMNS_ID, this.TABLE_DIGITALIO_COLUMNS_DATA];
  private readonly db: IDartDatabase | null;
  constructor() {
    this.db = null;
  }

  initDatabase = async (moduleContext:ModuleContext) => {
    this.db = moduleContext.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;
    const result = await this.db?.createTable(this.TABLE_DIGITALIO, this.TABLE_DIGITALIO_COLUMNS, false);
    if (result) {
      const queryResult = await this.db?.query(this.TABLE_DIGITALIO, [this.TABLE_DIGITALIO_COLUMNS_ID], {});
      if (queryResult?.length === 0) {
        let id = 0
        while(true){
          let data = this.getInitData(id);
          if (data == null)
            break;

          await this.db?.insert(this.TABLE_DIGITALIO, [id, JSON.stringify(data)]);
          id++
        }
      }
    }
  }

  // resetData = async (id:number) => {
  //   this.db?.query(this.TABLE_DIGITALIO, this.TABLE_DIGITALIO_COLUMNS, {}).then((queryResult) =>
  //     {
  //       let data = this.getInitData(id);
  //       if (data == null)
  //         return;

  //       this.db?.update(
  //           this.TABLE_DIGITALIO,
  //           {
  //             this.TABLE_DIGITALIO_COLUMNS_ID: id,
  //           },
  //           {
  //             this.TABLE_DIGITALIO_COLUMNS_ID: id,
  //             data: JSON.stringify(data),
  //           },
  //       )
  //     }
  //   );
  // };

  getData = async (id:number, onComplete: (data: GripperInfo) => void) => {
    await this.db?.query(this.TABLE_DIGITALIO, this.TABLE_DIGITALIO_COLUMNS, { id : id }).then((queryResult) => {
      if (queryResult.length > 0) {
        onComplete(JSON.parse(queryResult[0].data.data));
      }
    });
  };
  
  getDataAll = async (onComplete: (dataList: GripperInfo[]) => void) => {
    await this.db?.query(this.TABLE_DIGITALIO, this.TABLE_DIGITALIO_COLUMNS, {}).then((queryResult) => {
      if (queryResult.length > 0) {
        let data = queryResult.map(v => JSON.parse(v.data.data) as GripperInfo)
        onComplete(data);
      }
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveData = (id:number, updateData: GripperInfo) => {
    this.db
        ?.query(this.TABLE_DIGITALIO, this.TABLE_DIGITALIO_COLUMNS, {
          id : id,
        })
        .then((queryResult) => {
          if (queryResult.length > 0) {
            this.db
                ?.update(this.TABLE_DIGITALIO,
                    {
                      id: id,
                    },
                    {
                      id: id,
                      data: JSON.stringify(updateData),
                    },
                )
                .then((count) => {
                  if (count === 0) {
                    this.db
                        ?.delete(this.TABLE_DIGITALIO, {
                          id: id,
                        })
                        .then(() => {
                          this.db?.insert(this.TABLE_DIGITALIO, [id, JSON.stringify(updateData)]);
                        });
                  }
                });
          }
          else {
            this.db?.insert(this.TABLE_DIGITALIO, [id, JSON.stringify(updateData)]);
          }
        });
  };

  getInitData = (index : number)=>{
    var data = JSON.parse(JSON.stringify(INITIAL_DATA));
    switch (index){
      case 0:
        data.selectedTool.toolName += "_A"
        data.selectedTool.toolWeightParam.symbol += "_A"
        data.selectedTool.toolWeightParam.tool.weight = 0.7
        data.selectedTool.tcpParam.symbol += "_A"
        data.selectedTool.tcpParam.tcp.targetPose = [0,0,111.4,0,0,0]
        break;
      case 1:
        data.selectedTool.toolName += "_B"
        data.selectedTool.toolWeightParam.symbol += "_B"
        data.selectedTool.toolWeightParam.tool.weight = 1
        data.selectedTool.tcpParam.symbol += "_B"
        data.selectedTool.tcpParam.tcp.targetPose = [0,0,50,0,0,0]
        break;
      case 2:
        data.selectedTool.toolName += "_C"
        data.selectedTool.toolWeightParam.symbol += "_C"
        data.selectedTool.toolWeightParam.tool.weight = 0.5
        data.selectedTool.tcpParam.symbol += "_C"
        data.selectedTool.tcpParam.tcp.targetPose = [0,0,150,0,0,0]
        break;
      default:
        return null;
    }

    return data;
  }
}
export default new DatabaseManager();
