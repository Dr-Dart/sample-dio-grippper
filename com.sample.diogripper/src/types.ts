/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import {ToolCenterPoint, ToolWeight} from "dart-api";

// Common
export interface SelectOption {
  label: string;
  value: string;
}

export interface GripperUserCommandInfo {
    name : string;
    signalType: string;
    port: string[];
    signal: number[];
    timeout: string[];
}

// Tool Type
export interface ToolType{
  toolWeightParam: ToolWeight[];
  tcpParam: ToolCenterPoint[];
}

// Write Signal Type
export interface SignalWrite {
  name: string;
  signalType: string;
  writeSignalsChild: SignalChild[];
}

export interface SignalChild {
  portNo: string;
  signal: boolean;
  timeout : string;
}

// Read Signal Type
export interface SignalRead {
  name: string;
  signalType: string;
  portNo?: string;
  signal: boolean;
  errors: string[];
  optionPortNo: {
    label: string;
    value: string;
  }[];
  statusConnect: boolean;
}