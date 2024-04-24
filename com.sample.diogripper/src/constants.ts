/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { SignalRead, SignalWrite, ToolType } from './types';
import { IDBData } from './utils/DatabaseManager';

/*********
* Common constant
*********/
export const USER_COMMAND_GRASP = 'GRASP';
export const USER_COMMAND_RELEASE = 'RELEASE';

export const EMPTY_PORT = '(Empty)';

export const RESET_TEMPLATE = {
    TEMPLATE_A : '0',
    TEMPLATE_B : '1',
    TEMPLATE_C : '2',
    NOT_SELECTED : '3',
    LAST_DATA : '4',
} as const
export type RESET_TEMPLATE = typeof RESET_TEMPLATE[keyof typeof RESET_TEMPLATE];


/*********
* Dialog constant
*********/
export const SETTING_NAME_ERROR_CASE = {
    NO_ERROR : 0,
    DUPLICATE : 1,
    OVER_LENGTH : 2,
    ONLY_ENG : 3,
} as const
export type SETTING_NAME_ERROR_CASE = typeof SETTING_NAME_ERROR_CASE[keyof typeof SETTING_NAME_ERROR_CASE];
export const SETTING_NAME_REG_EXP =  /^[a-zA-Z0-9_]+$/

/*********
* Tool Settings constant
*********/
export const TOOL_NAME_ERROR_CASE = {
    NO_ERROR : 0,
    DUPLICATE : 1,
    OVER_LENGTH : 2,
    NO_NAME : 3,
    ONLY_ENG : 4
} as const
export type TOOL_NAME_ERROR_CASE = typeof TOOL_NAME_ERROR_CASE[keyof typeof TOOL_NAME_ERROR_CASE];
export const TOOL_SETTING_REG_EXP =  /^[0-9-.]+$/

export const TCP_MAX = 10000;
export const TCP_MIN = -10000;

export const TCP_ROTATE_MAX = 360;
export const TCP_ROTATE_MIN = -360;

export const TOOL_WEIGHT_MAX = 99999.99;
export const TOOL_WEIGHT_MIN = -99999.99;

export const TOOL_INDEX_TCP = 0
export const TOOL_INDEX_WEIGHT = 1

/*********
* Write Signal constant
*********/
export const WAIT_TIME_MAX = 60;
export const WAIT_TIME_MIN = 0;
export const WAIT_TIME_SETTING_REG_EXP =  /^[0-9.]+$/

export const CONTROLLER_DIGITAL_OUT = 'Controller Digital Out';
export const FLANGE_DIGITAL_OUT = 'Flange Digital Out';

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

/*********
* Read Signal constant
*********/
export const CONTROLLER_DIGITAL_IN = 'Controller Digital In';
export const FLANGE_DIGITAL_IN = 'Flange Digital In';
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
export const DEFAULT_READ_SIGNAL: SignalRead[] = [
    {
        name: '',
        signalType: CONTROLLER_DIGITAL_IN,
        portNo: EMPTY_PORT,
        signal: false,
        errors: [],
        optionPortNo: [],
        statusConnect: false,
    },
];


/*********
* Initial constant (Main Screen)
*********/
export const INIT_TOOL_VALUE: ToolType = {
    toolWeightParam: [
        {
            symbol: 'tool_weight',
            tool: {
                weight: 0,
                cog: [0, 0, 0],
                inertia : [0,0,0,0,0,0]
            },
        },
    ],
    tcpParam: [
        {
            symbol: 'tool_tcp',
            tcp: {
                targetPose: [0, 0, 0, 0, 0, 0],
            },
        },
    ],
};

export const DEFAULT_WRITE_SIGNAL: SignalWrite[] = [
    {
        name: USER_COMMAND_GRASP,
        signalType: FLANGE_DIGITAL_OUT,
        writeSignalsChild: [
            { portNo: '1', signal: true, timeout: '0.1' },
            { portNo: EMPTY_PORT, signal: true, timeout: '0.5' },
        ],
    },
    {
        name: USER_COMMAND_RELEASE,
        signalType: FLANGE_DIGITAL_OUT,
        writeSignalsChild: [
            { portNo: '1', signal: false, timeout: '0.1' },
            { portNo: EMPTY_PORT, signal: false, timeout: '0.5' },
        ],
    },
];


/*********
* Initial constant (Database)
*********/
export const DB_INITIAL_1 = {
    key: 0,
    name: 'Gripper_1',
    tool: {
        toolWeightParam: [
            {
                symbol: 'Tool_Weight_1',
                tool: {
                    weight: 0.7,
                    cog: [0, 0, 0],
                    inertia : [0,0,0,0,0,0]
                },
            },
        ],
        tcpParam: [
            {
                symbol: 'TCP_1',
                tcp: {
                    targetPose: [0, 0, 111.4, 0, 0, 0],
                },
            },
        ],
    },
    write: [
        {
            name: USER_COMMAND_GRASP,
            signalType: FLANGE_DIGITAL_OUT,
            writeSignalsChild: [
                { portNo: '1', signal: false, timeout: '0.2' },
                { portNo: '2', signal: true, timeout: '0.2' },
            ],
        },
        {
            name: USER_COMMAND_RELEASE,
            signalType: FLANGE_DIGITAL_OUT,
            writeSignalsChild: [
                { portNo: '2', signal: false, timeout: '0.2' },
                { portNo: '1', signal: true, timeout: '0.2' },
            ],
        },
    ],
    read: DEFAULT_READ_SIGNAL,
} as IDBData;

export const DB_INITIAL_2 = {
    key: 1,
    name: 'Gripper_2',
    tool: {
        toolWeightParam: [
            {
                symbol: 'Tool_Weight_2',
                tool: {
                    weight: 0.7,
                    cog: [0, 0, 0],
                    inertia : [0,0,0,0,0,0]
                },
            },
        ],
        tcpParam: [
            {
                symbol: 'TCP_2',
                tcp: {
                    targetPose: [0, 0, 50, 0, 0, 0],
                },
            },
        ],
    },
    write: [
        {
            name: USER_COMMAND_GRASP,
            signalType: FLANGE_DIGITAL_OUT,
            writeSignalsChild: [
                { portNo: '2', signal: false, timeout: '0.1' },
                { portNo: '1', signal: true, timeout: '0.1' },
            ],
        },
        {
            name: USER_COMMAND_RELEASE,
            signalType: FLANGE_DIGITAL_OUT,
            writeSignalsChild: [
                { portNo: '1', signal: false, timeout: '0.1' },
                { portNo: '2', signal: true, timeout: '0.1' },
            ],
        },
    ],
    read: DEFAULT_READ_SIGNAL,
} as IDBData;

export const DB_INITIAL_3 = {
    key: 2,
    name: 'Gripper_3',
    tool: {
        toolWeightParam: [
            {
                symbol: 'Tool_Weight_3',
                tool: {
                    weight: 0.22,
                    cog: [0, 0, 0],
                    inertia : [0,0,0,0,0,0]
                },
            },
        ],
        tcpParam: [
            {
                symbol: 'TCP_3',
                tcp: {
                    targetPose: [0, 0, 56.4, 0, 0, 0],
                },
            },
        ],
    },
    write: [
        {
            name: USER_COMMAND_GRASP,
            signalType: FLANGE_DIGITAL_OUT,
            writeSignalsChild: [
                { portNo: '2', signal: false, timeout: '0.1' },
                { portNo: '1', signal: true, timeout: '0.1' },
            ],
        },
        {
            name: USER_COMMAND_RELEASE,
            signalType: FLANGE_DIGITAL_OUT,
            writeSignalsChild: [
                { portNo: '1', signal: false, timeout: '0.1' },
                { portNo: '2', signal: true, timeout: '0.1' },
            ],
        },
    ],
    read: DEFAULT_READ_SIGNAL,
} as IDBData;

//DB Add const
export const DB_ADD_NAME = 'Gripper';
export const DB_ADD_TOOL = INIT_TOOL_VALUE;
export const DB_ADD_WRITE = DEFAULT_WRITE_SIGNAL;
export const DB_ADD_READ = DEFAULT_READ_SIGNAL;

export const DB_MAX_LENGTH = 5;