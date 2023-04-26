/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import {SignalRead, SignalWrite, ToolType} from './types';

export const SignalNameRegex = /^[a-zA-Z0-9-]*$/;
export const CONTROLLER_DIGITAL_OUT = 'Controller Digital Out';
export const FLANGE_DIGITAL_OUT = 'Flange Digital Out';
export const CONTROLLER_DIGITAL_IN = 'Controller Digital In';
export const FLANGE_DIGITAL_IN = 'Flange Digital In';

export const USER_COMMAND_GRASP = 'GRASP';
export const USER_COMMAND_RELEASE = 'RELEASE';

export const SIGNAL_WRITE_TYPE = [
  {
    value: CONTROLLER_DIGITAL_OUT,
    label: CONTROLLER_DIGITAL_OUT,
  },
  {
    value: FLANGE_DIGITAL_OUT,
    label: FLANGE_DIGITAL_OUT,
  },
];

export const SIGNAL_READ_TYPE = [
  {
    value: CONTROLLER_DIGITAL_IN,
    label: CONTROLLER_DIGITAL_IN,
  },
  {
    value: FLANGE_DIGITAL_IN,
    label: FLANGE_DIGITAL_IN,
  },
];

export const INIT_TOOL_VALUE: ToolType = {
  toolName:"gripper",
  toolWeightParam:{
    tool: {
      weight: 0,
      cog: [0,0,0],
      inertia: [0,0,0,0,0,0],
    },
    symbol: "weight",
  },
  tcpParam: {
    symbol: "tcp",
    tcp: {
      targetPose: [0,0,0,0,0,0],
    },
  },
};

export const DEFAULT_WRITE_SIGNAL: SignalWrite = {
  name: '',
  signalType: CONTROLLER_DIGITAL_OUT,
  writeSignalsChild: [
    {
      portNo: '(Empty)',
      test: false,
    },
  ],
  errors: [],
  optionPortNo: [],
};

export const DEFAULT_READ_SIGNAL: SignalRead = {
  name: '',
  signalType: CONTROLLER_DIGITAL_IN,
  portNo: '(Empty)',
  test: false,
  errors: [],
  optionPortNo: [],
  statusConnect: false,
};

export const DEFAULT_CHILD_SIGNAL = {
  portNo: '(Empty)',
  test: false,
};
export const INITIAL_OPTION_PORT=[
      { label: '(Empty)', value: '(Empty)' },
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '7', value: '7' },
      { label: '8', value: '8' },
      { label: '9', value: '9' },
      { label: '10', value: '10' },
      { label: '11', value: '11' },
      { label: '12', value: '12' },
      { label: '13', value: '13' },
      { label: '14', value: '14' },
      { label: '15', value: '15' },
      { label: '16', value: '16' },
      { label: '17', value: '17' },
      { label: '18', value: '18' },
      { label: '19', value: '19' },
      { label: '20', value: '20' },
    ]

export const INITIAL_DATA = {
  selectedTool: INIT_TOOL_VALUE,
  writeSignals: [
    {
      name: USER_COMMAND_GRASP,
      signalType: 'Flange Digital Out',
      writeSignalsChild:[
        { portNo: '1', test: false },
        { portNo: '2', test: true },
      ],
      errors: [],
      optionPortNo: INITIAL_OPTION_PORT
    },
    {
      name: USER_COMMAND_RELEASE,
      signalType: 'Flange Digital Out',
      writeSignalsChild:[
        { portNo: '1', test: true },
        { portNo: '2', test: false },
      ],
      errors: [],
      optionPortNo: INITIAL_OPTION_PORT,
    },
  ],
};