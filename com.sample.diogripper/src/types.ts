/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import {SixNumArray, ThreeNumArray, ToolCenterPoint, ToolWeight} from "dart-api";

export interface SignalWrite {
  name: string;
  signalType: string;
  writeSignalsChild: SignalChild[];
  errors: string[];
  optionPortNo: {
    label: string;
    value: string;
  }[];
}

export interface ToolType{
  toolName:string;
  toolWeightParam: ToolWeight;
  tcpParam: ToolCenterPoint;
}

export interface SignalRead {
  name: string;
  signalType: string;
  portNo?: string;
  test: boolean;
  errors: string[];
  optionPortNo: {
    label: string;
    value: string;
  }[];
  statusConnect: boolean;
}

export interface SignalChild {
  portNo: string;
  test: boolean;
}
export interface GripperInfo {
  writeSignals: SignalWrite[];
  readSignals: SignalRead[];
  selectedTool : ToolType;
}
