/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */

/*********
 * WriteSignal.tsx
 *********
 * - Set signal about grasp, release.
 *********/

// style
import React, { useEffect, useRef } from 'react';
import styles from '../assets/styles/styles.scss';
import {
    Box,
    Button,
    Divider,
    Grid,
    InputAdornment,
    MenuItem,
    Select,
    SelectChangeEvent,
    SvgIcon,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import NextIcon from '../assets/images/next-icon.svg';

// constant
import { SelectOption, SignalChild, SignalWrite } from '../types';
import {
    WAIT_TIME_MAX,
    EMPTY_PORT,
    CONTROLLER_DIGITAL_OUT,
    SIGNAL_WRITE_TYPE,
    FLANGE_DIGITAL_OUT,
    WAIT_TIME_SETTING_REG_EXP,
    WAIT_TIME_MIN
} from '../constants';

// component
import {
    ModuleContext,
    Context,
    ICommunicationManager,
    GpioTypeIndex,
    GpioControlBoxDigitalIndex,
    GpioFlangeDigitalIndex,
    IToast,
    Toast,
    IRobotManager,
    IProgramManager,
    FlangeHardwareVersion,
    ProgramState
} from 'dart-api';
import { roundDownValue } from '../utils/util';

// translate
import { useTranslation } from 'react-i18next';
interface SignalRowProps {
    moduleContext: ModuleContext;
    writeSignals: SignalWrite[];
    updateSignal: (signal: SignalWrite[]) => void;
}

const WriteSignal = (props: SignalRowProps) => {
    const { moduleContext, writeSignals, updateSignal } = props;

    /***********
     * State
     ***********/
    // Initial Manager
    const communicationManager = moduleContext.getSystemManager(Context.COMMUNICATION_MANAGER) as ICommunicationManager;
    const robotManager = moduleContext.getSystemManager(Context.ROBOT_MANAGER) as IRobotManager;
    const programManager = moduleContext.getSystemManager(Context.PROGRAM_MANAGER) as IProgramManager;

    // state for signal test
    const isServoOn = useRef(robotManager.servoState.value);

    // state for port no
    const robotModel = useRef('M');
    const robotFlangeVersion = useRef({flangeHardwareVersion : FlangeHardwareVersion.MH});

    // translate
    const { t } = useTranslation();
    const { packageName } = moduleContext;

    /***********
     * useEffect
     ***********/
    useEffect(async () => {
        // get robot model
        robotModel.current = robotManager.getRobotModel();
        robotFlangeVersion.current = await robotManager.getFlangeVersion();

        // check servo state
        const servoStateCallback = (data: boolean) => {
            isServoOn.current = data;
        };
        robotManager.servoState.register(props.moduleContext, servoStateCallback);

        return () => {
            // unregister callback
            robotManager.servoState.unregister(props.moduleContext, servoStateCallback);
        };
    }, []);

    /*****
     * Signal Type
     *****/
    const onChangeSignalType = (value: string, index: number) => {
        // set port to signal write
        let changedWriteSignals: SignalWrite[] = [...writeSignals];
        changedWriteSignals[index].signalType = value;

        // Check port list
        let EndPort: number;
        if (value === FLANGE_DIGITAL_OUT && (robotModel.current.includes('A') || robotModel.current.includes('E'))) {
            EndPort = 2;
        } else if (
            (value === FLANGE_DIGITAL_OUT) &&
            (robotModel.current.includes('M') || robotModel.current.includes('H')) &&
            (robotFlangeVersion.current.flangeHardwareVersion === FlangeHardwareVersion.OLD)
        ) {
            EndPort = 6;
        } else if ((value === FLANGE_DIGITAL_OUT) &&
            (robotModel.current.includes('M') || robotModel.current.includes('H'))
            && (robotFlangeVersion.current.flangeHardwareVersion === FlangeHardwareVersion.MH)) {
            EndPort = 4;
        } else {
            EndPort = 16;
        }
        changedWriteSignals[index].writeSignalsChild.map((child: SignalChild, childIndex: number) => {
            if (child.portNo !== EMPTY_PORT && Number(child.portNo) > EndPort) {
                changedWriteSignals[index].writeSignalsChild[childIndex].portNo = EMPTY_PORT;
            }
        });

        // update props
        updateSignal(changedWriteSignals);
    };

    /*****
     * Port No.
     *****/
    // Update Port List
    const renderPortList = (signalType: string) => {
        let option = [
            {
                label: EMPTY_PORT,
                value: EMPTY_PORT,
            },
        ] as SelectOption[];
        let StartPort = 1 as number;
        let EndPort: number;

        // Check port list
        if (
            signalType === FLANGE_DIGITAL_OUT &&
            (robotModel.current.includes('A') || robotModel.current.includes('E'))
        ) {
            EndPort = 2;
        } else if (
            (signalType === FLANGE_DIGITAL_OUT) &&
            (robotModel.current.includes('M') || robotModel.current.includes('H')) &&
            (robotFlangeVersion.current.flangeHardwareVersion === FlangeHardwareVersion.OLD)
        ) {
            EndPort = 6;
        } else if ((signalType === FLANGE_DIGITAL_OUT) &&
            (robotModel.current.includes('M') || robotModel.current.includes('H'))
            && (robotFlangeVersion.current.flangeHardwareVersion === FlangeHardwareVersion.MH)) {
            EndPort = 4;
        } else {
            EndPort = 16;
        }
        for (let i = StartPort; i <= EndPort; i++) {
            option.push({
                label: i.toString(),
                value: i.toString(),
            });
        }
        return option.map((opt: SelectOption, index: number) => (
            <MenuItem selected={!(opt.value !== EMPTY_PORT)} key={index} value={opt.value}>
                {opt.value !== EMPTY_PORT ? (
                    opt.label
                ) : (
                    <Typography
                        sx={{
                            color: '#959595;',
                        }}
                    >
                        {' '}
                        {opt.label}{' '}
                    </Typography>
                )}
            </MenuItem>
        ));
    };

    // Change Port
    const onChangePort = (event: SelectChangeEvent, signalIndex: number, childIndex: number) => {
        let changedWriteSignals: SignalWrite[] = [...writeSignals];
        changedWriteSignals[signalIndex].writeSignalsChild[childIndex].portNo = event.target.value;

        // update props
        updateSignal(changedWriteSignals);
    };

    /*****
     * Signal
     *****/
    const onClickSignal = (signal: boolean, signalIndex: number, childIndex: number) => {
        let changedWriteSignals: SignalWrite[] = [...writeSignals];
        changedWriteSignals[signalIndex].writeSignalsChild[childIndex].signal = signal;

        // update props
        updateSignal(changedWriteSignals);
    };

    /*****
     * Wait Time
     *****/
    const onChangeTimeOut = (event: React.ChangeEvent<HTMLInputElement>, signalIndex: number, childIndex: number) => {
        
        // 1) Update value
        let changedWriteSignals: SignalWrite[] = [...writeSignals];
        const stringValue = event.target.value == undefined || null ? '0' : event.target.value;
        const checkRound = stringValue.split('.');
        const numValue = Number(stringValue);

        // 2) Update  state
        if (stringValue === '') {
            changedWriteSignals[signalIndex].writeSignalsChild[childIndex].timeout = stringValue;
        }
        else if (!isNaN(numValue) && WAIT_TIME_SETTING_REG_EXP.test(stringValue)) {
            if (numValue > WAIT_TIME_MAX) {
                changedWriteSignals[signalIndex].writeSignalsChild[childIndex].timeout = String(WAIT_TIME_MAX);
            }
            else if (numValue < WAIT_TIME_MIN) {
                changedWriteSignals[signalIndex].writeSignalsChild[childIndex].timeout = String(WAIT_TIME_MIN);
            }
            else if (checkRound.length > 1) {
                // check decimal place is higher than second
                if (checkRound[1].length > 2) {
                    // roundup
                    changedWriteSignals[signalIndex].writeSignalsChild[childIndex].timeout = roundDownValue(stringValue, 2);
                } else {
                    changedWriteSignals[signalIndex].writeSignalsChild[childIndex].timeout = stringValue;
                }
            } 
            else {
                changedWriteSignals[signalIndex].writeSignalsChild[childIndex].timeout = stringValue;
            }
        }

        // update props
        updateSignal(changedWriteSignals);
    };

    const onBlurTimeOut = (signalIndex: number, childIndex: number) => {
        let changedWriteSignals: SignalWrite[] = [...writeSignals];
        if (changedWriteSignals[signalIndex].writeSignalsChild[childIndex].timeout === '') {

            changedWriteSignals[signalIndex].writeSignalsChild[childIndex].timeout = '0';
        }
        else {
            const numValue = Number(changedWriteSignals[signalIndex].writeSignalsChild[childIndex].timeout)
            changedWriteSignals[signalIndex].writeSignalsChild[childIndex].timeout = String(numValue);
        }
    
        // update props
        updateSignal(changedWriteSignals);
    }

    /*****
     * Signal Test
     *****/
    //delay function [ms]
    function sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const onClickTestSignal = async (index: number) => {
        // 1) If program is running, return false
        if (programManager.programState.value === ProgramState.PLAY){
            Toast.show(IToast.TYPE_INFO,null, t('toast_message_008', {ns: packageName,}),true,)
            return false
        }

        const { writeSignalsChild, signalType } = writeSignals[index];
        const signal = signalType === CONTROLLER_DIGITAL_OUT ? GpioTypeIndex.CONTROLLER : GpioTypeIndex.FLANGE;

        // 2) check signal write state
        if (
            signal === GpioTypeIndex.FLANGE &&
            (robotModel.current.includes('A') || robotModel.current.includes('E')) &&
            !isServoOn.current
        ) {
            // 2-1) If robot is A/E, flange IO, and servo is not on, return false
            Toast.show(
                IToast.TYPE_ERROR,
                t('toast_title_003', {
                    ns: packageName,
                }),
                t('toast_message_003', {
                    ns: packageName,
                }),
                true,
            );
            return false;
        } else {
            // 2-2) Set IO test
            let element: SignalChild;
            let pN: GpioControlBoxDigitalIndex | GpioFlangeDigitalIndex;
            let statusConnect = true;
            try {
                for (let idx = 0; idx < writeSignalsChild.length; idx++) {
                    element = writeSignalsChild[idx];
                    if (element.portNo !== EMPTY_PORT) {
                        pN = (Number(element.portNo) - 1) as GpioControlBoxDigitalIndex | GpioFlangeDigitalIndex;

                        // set signal
                        statusConnect = await communicationManager.dio.setDigitalOutput(signal, pN, element.signal);

                        // delay
                        await sleep(Number(element.timeout) * 1000);
                    }
                }
                if (statusConnect) {
                    // If run success, return true
                    Toast.show(
                        IToast.TYPE_SUCCESS,
                        t('toast_title_001', {
                            ns: packageName,
                        }),
                        t('toast_message_004', {
                            ns: packageName,
                        }),
                        false,
                    );
                    return true;
                } else {
                    // If run fail, return false
                    Toast.show(
                        IToast.TYPE_WARN,
                        t('toast_title_002', {
                            ns: packageName,
                        }),
                        t('toast_message_005', {
                            ns: packageName,
                        }),
                        false,
                    );
                    return false;
                }
            } catch (error) {
                // If error occured, return false
                Toast.show(
                    IToast.TYPE_ERROR,
                    t('toast_title_003', {
                        ns: packageName,
                    }),
                    t('toast_message_006', {
                        ns: packageName,
                    }) + JSON.stringify(error),
                    false,
                );
                return false;
            }
        }
    };

    /*****
     * return
     *****/

    return (
        <Box
            sx={{
                'marginTop': '20px',
            }}
        >
            <Typography
                id="typography_113d"
                sx={{
                    'fontSize': '16px',
                    'fontWeight': 'bold',
                }}
            >
                {t('mainscreen_title_003', {
                    ns: packageName,
                })}
            </Typography>
            <Divider
                id="divider_3e3a"
                sx={{
                    'marginBottom': '5px',
                    'marginTop': '5px',
                }}
            ></Divider>
            <Grid
                className={`${styles['grid-signals']}`}
                container
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <TableContainer className={`${styles['table-container']}`}>
                    <Table aria-label="simple table">
                        {/* Head */}
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    width="15%"
                                    className={`${styles['first-thead-cell']}`}
                                    sx={{
                                        'textAlign': 'center',
                                    }}
                                >
                                    {t('DIO_settings_title_001', {
                                        ns: packageName,
                                    })}
                                </TableCell>
                                <TableCell
                                    width="20%"
                                    sx={{
                                        'textAlign': 'center',
                                    }}
                                >
                                    {t('DIO_settings_title_002', {
                                        ns: packageName,
                                    })}
                                </TableCell>
                                <TableCell
                                    width="15%"
                                    sx={{
                                        'textAlign': 'center',
                                    }}
                                >
                                    {t('DIO_settings_title_003', {
                                        ns: packageName,
                                    })}
                                </TableCell>
                                <TableCell
                                    width="15%"
                                    sx={{
                                        'textAlign': 'center',
                                    }}
                                >
                                    {t('DIO_settings_title_004', {
                                        ns: packageName,
                                    })}
                                </TableCell>
                                <TableCell
                                    width="15%"
                                    sx={{
                                        'textAlign': 'center',
                                    }}
                                >
                                    {t('DIO_settings_title_005', {
                                        ns: packageName,
                                    })}
                                </TableCell>
                                <TableCell
                                    width="20%"
                                    sx={{
                                        'textAlign': 'center',
                                    }}
                                >
                                    {t('DIO_settings_title_006', {
                                        ns: packageName,
                                    })}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        {/* Body */}
                        {/* When db not exist(= in IDE), set default value */}
                        <TableBody>
                            {
                                writeSignals.map((row: SignalWrite, signalIndex: number) => {
                                    return (
                                        <>
                                            {row.writeSignalsChild.map((child: SignalChild, childIndex: number) => (
                                                <TableRow className={`${styles['table-row']}`} key={childIndex}>
                                                    {/* Write Signal Name*/}
                                                    <TableCell
                                                        component="th"
                                                        scope="row"
                                                        sx={{
                                                            'textAlign': 'center',
                                                        }}
                                                    >
                                                        <TextField
                                                            value={row.name}
                                                            disabled
                                                            sx={{
                                                                maxWidth: '464px',
                                                                marginLeft: '19px',
                                                                width: '80%',
                                                                visibility: childIndex !== 0 ? 'hidden' : 'visible',
                                                                "& .MuiInputBase-input.Mui-disabled": {
                                                                    WebkitTextFillColor: "#000000",
                                                                },
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Signal Type*/}
                                                    <TableCell
                                                        component="th"
                                                        scope="row"
                                                        sx={{
                                                            'textAlign': 'center',
                                                        }}
                                                    >
                                                        <Select
                                                            onChange={(e: SelectChangeEvent) =>
                                                                onChangeSignalType(e.target.value, signalIndex)
                                                            }
                                                            value={row.signalType}
                                                            sx={{
                                                                width: '80%',
                                                                height: '32px',
                                                                visibility: childIndex !== 0 ? 'hidden' : 'visible',
                                                            }}
                                                        >
                                                            {SIGNAL_WRITE_TYPE.map((opt: SelectOption, index: number) => {
                                                                const isValue = opt.value !== CONTROLLER_DIGITAL_OUT;
                                                                return (
                                                                    <MenuItem
                                                                        selected={!isValue}
                                                                        key={index}
                                                                        value={opt.value}
                                                                    >
                                                                        {opt.label}
                                                                    </MenuItem>
                                                                );
                                                            })}
                                                        </Select>
                                                    </TableCell>

                                                    {/* Port No*/}
                                                    <TableCell
                                                        component="th"
                                                        scope="row"
                                                        sx={{
                                                            'textAlign': 'center',
                                                        }}
                                                    >
                                                        <Select
                                                            value={child.portNo}
                                                            onChange={(e: SelectChangeEvent) =>
                                                                onChangePort(e, signalIndex, childIndex)
                                                            }
                                                            sx={{
                                                                width: '100%',
                                                                height: '32px',
                                                            }}
                                                        >
                                                            {renderPortList(row.signalType)}
                                                        </Select>
                                                    </TableCell>

                                                    {/* Signal*/}
                                                    <TableCell component="th" scope="row">
                                                        <Button
                                                            className="button-test"
                                                            sx={{
                                                                width: '45%',
                                                                color: child.signal ? '#007FF5' : '#2E3745',
                                                                borderColor: child.signal ? '#007FF5' : '#D7DCE0',
                                                                height: '32px',
                                                                marginRight: '10%',
                                                            }}
                                                            disabled={child.portNo === EMPTY_PORT ? true : false}
                                                            variant="outlined"
                                                            onClick={() => onClickSignal(true, signalIndex, childIndex)}
                                                        >
                                                            On
                                                        </Button>

                                                        <Button
                                                            className="button-test"
                                                            sx={{
                                                                width: '45%',
                                                                color: !child.signal ? '#007FF5' : '#2E3745',
                                                                borderColor: !child.signal ? '#007FF5' : '#D7DCE0',
                                                                height: '32px',
                                                            }}
                                                            disabled={child.portNo === EMPTY_PORT ? true : false}
                                                            variant="outlined"
                                                            onClick={() => onClickSignal(false, signalIndex, childIndex)}
                                                        >
                                                            Off
                                                        </Button>
                                                    </TableCell>
                                                    {/* Wait Time*/}

                                                    <TableCell component="th" scope="row">
                                                        <TextField
                                                            value={child.timeout}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                onChangeTimeOut(e, signalIndex, childIndex)
                                                            }
                                                            onBlur={()=>onBlurTimeOut(signalIndex, childIndex)}
                                                            disabled={child.portNo === EMPTY_PORT ? true : false}
                                                            InputProps={{
                                                                readOnly: child.portNo === EMPTY_PORT ? true : false,
                                                                endAdornment: (
                                                                    <InputAdornment position="end">sec</InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Signal Send*/}
                                                    <TableCell
                                                        component="th"
                                                        scope="row"
                                                        sx={{
                                                            'textAlign': 'center',
                                                        }}
                                                    >
                                                        <Button
                                                            variant="outlined"
                                                            className={`${styles['button-add-child']}`}
                                                            onClick={() => onClickTestSignal(signalIndex)}
                                                            sx={{
                                                                visibility: childIndex !== 0 ? 'hidden' : 'visible',
                                                            }}
                                                        >
                                                            <SvgIcon component={NextIcon} />{' '}
                                                            <Typography>
                                                                {t('btn_signal_test', {
                                                                    ns: packageName,
                                                                })}
                                                            </Typography>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        </Box>
    );
};

export default React.memo(WriteSignal);