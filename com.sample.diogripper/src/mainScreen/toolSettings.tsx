/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */

/*********
 * toolSettings.tsx
 *********
 * Update tool center point and tool weight.
 * - To press button 'async to robot', user need to change mode to manual
 *********/

// style
import { Box, Button, Divider, Grid, InputAdornment, TextField, Typography, IconButton } from '@mui/material';
import React, { useState, useEffect } from 'react';
import styles from '../assets/styles/styles.scss';
import Lock from '../assets/images/icon_lock.svg';
import Erase from '../assets/images/icon_delete.svg';

// constant
import { ToolType } from '../types';
import {
    TOOL_NAME_ERROR_CASE,
    TCP_MAX,
    TCP_MIN,
    TCP_ROTATE_MAX,
    TCP_ROTATE_MIN,
    TOOL_WEIGHT_MIN,
    TOOL_WEIGHT_MAX,
    TOOL_SETTING_REG_EXP,
    SETTING_NAME_REG_EXP,
    TOOL_INDEX_TCP,
    TOOL_INDEX_WEIGHT
} from '../constants';

// component
import {
    ModuleContext,
    Context,
    IRobotParameterManager,
    IRobotManager,
    RobotModel,
    ThreeNumArray,
    SixNumArray,
    ToolCenterPoint,
    ToolWeight,
    Toast,
    IToast,
    DialogBuilder,
    DialogInterface,
    IDialog,
    SafetyMode,
    ISafetyPasswordManager
} from 'dart-api';
import { roundDownValue } from '../utils/util';
import { IDBData } from '../utils/DatabaseManager';

// translate
import { useTranslation } from 'react-i18next';
interface toolSettingsProps {
    moduleContext: ModuleContext;
    selectedTool: ToolType;
    updateTool: (tool: ToolType) => void;
    saveDatabase: () => Promise<void>;
    database : IDBData;
}
const ToolSettings = (props: toolSettingsProps) => {
    const { moduleContext, selectedTool, updateTool, saveDatabase, database } = props;

    /***********
     * State
     ***********/
    // common
    const { packageName } = moduleContext;
    const [focusNameIndex, setFocusNameIndex] = useState(null as number | null);
    const robotPramManger = moduleContext.getSystemManager(Context.ROBOT_PARAMETER_MANAGER) as IRobotParameterManager;
    const robotManger = moduleContext.getSystemManager(Context.ROBOT_MANAGER) as IRobotManager;
    const safteyPasswordManager = moduleContext.getSystemManager(Context.SAFETYPASSWORD_MANAGER) as ISafetyPasswordManager;
    
    // Error check [toolname, weightname]
    const [errorCase, setErrorCase] = useState<TOOL_NAME_ERROR_CASE[]>([
        TOOL_NAME_ERROR_CASE.NO_ERROR,
        TOOL_NAME_ERROR_CASE.NO_ERROR,
    ]);

    // tcp state
    const [toolTCPIndex, setToolTCPIndex] = useState(0);
    const [toolTCPName, setToolTCPName] = useState('tcpname')
    const [toolTCPNamePlaceholder, setToolTCPNamePlaceholder] = useState('tcpPlaceholder')
    const [toolTCP, setToolTCP] = useState(['0', '0', '0', '0', '0', '0']);
    const [tcplist, settcplist] = useState([] as ToolCenterPoint[]);

    // weight state
    const [toolWeightIndex, setToolWeightIndex] = useState(0);
    const [toolWeightName, setToolWeightName] = useState('toolWeightname')
    const [weightPlaceholder, setWeightPlaceholder] = useState('weightPlaceholder')
    const [toolWeight, setToolWeight] = useState('0');
    const [toolWeightCog, setToolWeightCog] = useState(['0', '0', '0']);
    const [toolWeightlist, settoolWeightlist] = useState([] as ToolWeight[]);
    const [isPasswordLock, setIsPasswordLock] = useState(true);

    const { t } = useTranslation();

    // Text
    const poseText = ['X', 'Y', 'Z', 'RZ', 'RY', 'RX'];
    const cogText = ['CX', 'CY', 'CZ'];

    /***********
     * useEffect
     ***********/
    // Initial
    useEffect(() => {
        getparamsList();

        // check safety Password Locked state
        const safetyPasswordLockedCallback = (safetyPasswordLocked : boolean) => {
            setIsPasswordLock(safetyPasswordLocked)
        }

        setIsPasswordLock(safteyPasswordManager.safetyPasswordLocked.value)
        safteyPasswordManager.safetyPasswordLocked.register(moduleContext, safetyPasswordLockedCallback)

        return () => {
            safteyPasswordManager.safetyPasswordLocked.unregister(moduleContext, safetyPasswordLockedCallback)
        }
    }, []);

    // Props Update
    useEffect(() => {
        // Update current params
        getparamsList();

        // check tool name
        if (selectedTool.tcpParam[toolTCPIndex].symbol !== toolTCPName) {
            setToolTCPName(selectedTool.tcpParam[toolTCPIndex].symbol);
        }

        if (selectedTool.toolWeightParam[toolWeightIndex].symbol !== toolWeightName) {
            setToolWeightName(selectedTool.toolWeightParam[toolWeightIndex].symbol);
        }

        // check tcp
        const newTCP = selectedTool.tcpParam[toolTCPIndex].tcp.targetPose.map((element: number) => {
            return String(element);
        });
        if (JSON.stringify(newTCP) !== JSON.stringify(toolTCP)) {
            setToolTCP(newTCP);
        }

        // check weight
        if (selectedTool.toolWeightParam[toolWeightIndex].tool.weight !== Number(toolWeight)) {
            setToolWeight(String(selectedTool.toolWeightParam[toolWeightIndex].tool.weight));
        }

        // check weight cog
        const newCog = selectedTool.toolWeightParam[toolWeightIndex].tool.cog.map((element: number) => {
            return String(element);
        });
        if (JSON.stringify(newCog) !== JSON.stringify(toolWeightCog)) {
            setToolWeightCog(newCog);
        }
    }, [selectedTool]);

    // Change placeholder of tool name
    useEffect(() => {
        setToolTCPNamePlaceholder(database?.tool.tcpParam[toolTCPIndex].symbol)
        setWeightPlaceholder(database?.tool.toolWeightParam[toolWeightIndex].symbol)
    }, [database]);

    
    /*****
     * Common
     *****/
    const checkCurrentMode = () => {
        const currentSafetyMode = robotManger.getSafetyMode();

        if (currentSafetyMode === SafetyMode.MANUAL) {
            // Manual, return true
            return true
        } else if (currentSafetyMode === SafetyMode.AUTO) {
            // Auto, return false
            Toast.show(IToast.TYPE_INFO,null, t('toast_message_007', {ns: packageName,}),true,)
            return false
        }
    };

    const getparamsList = () => {
        settoolWeightlist(robotPramManger.toolWeight.get());
        settcplist(robotPramManger.tcp.get());
    };

    const duplicateDialog = (onComplete: (result: boolean) => Promise<void>) => {
        let dialog = new DialogBuilder(moduleContext)
            .setIcon(DialogInterface.ICON_INFO)
            .setTitle(
                t('Dialog_title_003', {
                    ns: moduleContext.packageName,
                }),
            )
            .setMessage(
                t('Dialog_message_005', {
                    ns: moduleContext.packageName,
                }),
            )
            .setCloseButton(true)
            .setButton(
                DialogInterface.BUTTON_NEGATIVE,
                t('btn_cancel', {
                    ns: moduleContext.packageName,
                }),
                true,
                {
                    onClick: async (dialog: IDialog) => {
                        // cancel edit
                        dialog.dismiss();
                        await onComplete(false);
                    },
                },
            )
            .setButton(
                DialogInterface.BUTTON_POSITIVE,
                t('btn_okay', {
                    ns: moduleContext.packageName,
                }),
                true,
                {
                    onClick: async (dialog: IDialog) => {
                        dialog.dismiss();
                        await onComplete(true);
                    },
                },
            )
            .setOnCancelListener({
                async onCancel() {
                    await onComplete(false);
                },
            });

            dialog.build()
            .show();
    };

    const errorPrint = (index : number) => {
        switch (errorCase[index]) {
            case TOOL_NAME_ERROR_CASE.DUPLICATE: // name duplicate
                return t('Dialog_error_message_001', {
                    ns: moduleContext.packageName,
                });
            case TOOL_NAME_ERROR_CASE.OVER_LENGTH: // length over
                return t('Dialog_error_message_002', {
                    ns: moduleContext.packageName,
                });
            case TOOL_NAME_ERROR_CASE.ONLY_ENG: // length over
                return t('Dialog_error_message_003', {
                    ns: moduleContext.packageName,
                });
            default:
                return '';
        }
    }

    const onClickEraseName = (index: number) => {
        let errors = [...errorCase];

        // 1) Check index and reset name
        if (index === TOOL_INDEX_TCP) {
            // tcp name
            setToolTCPName('')
        }
        else if (index === TOOL_INDEX_WEIGHT){
            // tool weight name
            setToolWeightName('')
        }

        // 2) change error to 'no name'
        errors[index] = TOOL_NAME_ERROR_CASE.NO_NAME;
        setErrorCase(errors);
    };

    /*****
     * TCP
     *****/
    const onChangeTCPName = (event: React.ChangeEvent<HTMLInputElement>) => {
        // 1) copy current error case
        let newError = [...errorCase]

        // 2) Check error
        if (event.target.value === '') {
            // error 1) blank name
            newError[TOOL_INDEX_TCP] = TOOL_NAME_ERROR_CASE.NO_NAME
        }
        else if (!SETTING_NAME_REG_EXP.test(event.target.value) ) {
            // error 2) Not english, number, and _
            newError[TOOL_INDEX_TCP] = TOOL_NAME_ERROR_CASE.ONLY_ENG
        }
        else if(event.target.value.length > 30) {
            // error 3) over length
            newError[TOOL_INDEX_TCP] = TOOL_NAME_ERROR_CASE.OVER_LENGTH
        }
        else {
            // no error
            newError[TOOL_INDEX_TCP] = TOOL_NAME_ERROR_CASE.NO_ERROR
        }

        // 3) If error is not over length and eng, update it
        if (newError[TOOL_INDEX_TCP] !== TOOL_NAME_ERROR_CASE.ONLY_ENG && newError[TOOL_INDEX_TCP] !== TOOL_NAME_ERROR_CASE.OVER_LENGTH) {
            setToolTCPName(event.target.value)
        }

        // 4) update error case
        setErrorCase(newError)
    };

    const onBlurTCPName = () => {
        // 1) when on blur occured and error case is over length or only eng, erase error.
        let newError = [...errorCase]
        if (newError[TOOL_INDEX_TCP] === TOOL_NAME_ERROR_CASE.ONLY_ENG || newError[TOOL_INDEX_TCP] === TOOL_NAME_ERROR_CASE.OVER_LENGTH) {
            newError[TOOL_INDEX_TCP] = TOOL_NAME_ERROR_CASE.NO_ERROR
            setErrorCase(newError)
        }
        
        // 2) update name
        let changedTool: ToolType = JSON.parse(JSON.stringify(selectedTool));
        if (newError[TOOL_INDEX_TCP] === TOOL_NAME_ERROR_CASE.NO_NAME || toolTCPName === '') {
            setToolTCPName(toolTCPNamePlaceholder)
        }
        else {
            changedTool.tcpParam[toolTCPIndex].symbol = toolTCPName;
            updateTool(changedTool);
        }

        // 3) reset focus
        setFocusNameIndex(null)
    }

    const onChangeTCPPose = (event: React.ChangeEvent<HTMLInputElement>) => {
        const index = Number(event.target.name);

        // 1) Update value
        const stringValue = event.target.value == undefined || null ? '0' : event.target.value;
        const numValue = Number(stringValue);
        const checkRound = stringValue.split('.');
        let newTCP = [...toolTCP]

        // 2) Update  state
        if (stringValue == '' || stringValue == '-') {
            newTCP[index] = stringValue;
        } 
        else if (!isNaN(numValue) && TOOL_SETTING_REG_EXP.test(stringValue)) {
            if (index <= 2) {
                // X, Y, X
                if (numValue > TCP_MAX) {
                    newTCP[index] = String(TCP_MAX);
                } else if (numValue < TCP_MIN) {
                    newTCP[index] = String(TCP_MIN);
                } else if (checkRound.length > 1) {
                    // check decimal place is higher than second
                    if (checkRound[1].length > 2) {
                        // roundup
                        newTCP[index] = roundDownValue(stringValue, 2);
                    } else {
                        newTCP[index] = stringValue;
                    }
                } else {
                    newTCP[index] = stringValue;
                }
            } else {
                // RZ, RY, RX
                if (numValue > TCP_ROTATE_MAX) {
                    newTCP[index] = String(TCP_ROTATE_MAX);
                } else if (numValue < TCP_ROTATE_MIN) {
                    newTCP[index] = String(TCP_ROTATE_MIN);
                } else if (checkRound.length > 1) {
                    // check decimal place is higher than second
                    if (checkRound[1].length > 2) {
                        // roundup
                        newTCP[index] = roundDownValue(stringValue, 2);
                    } else {
                        newTCP[index] = stringValue;
                    }
                } else {
                    newTCP[index] = stringValue;
                }
            }
        }

        // Update Props
        setToolTCP(newTCP);
    };

    const onBlurTCPPose = () => {
        // check tcp
        const newTCP = toolTCP.map((element: string) => {
            if (element === '-') {
                return 0
            }
            return Number(element);
        });

        let changedTool: ToolType = JSON.parse(JSON.stringify(selectedTool));
        changedTool.tcpParam[toolTCPIndex].tcp.targetPose = [...newTCP] as SixNumArray;
        updateTool(changedTool);
    }

    const handleClickTCP = async() => {
        let res: boolean | undefined;

        // 0) check robot mode and if it is auto, return false
        const modeResult = checkCurrentMode()
        if (!modeResult) {
            return false
        }

        // 1) Check same name exist
        const count = tcplist?.find(findSameNamesTCP);

        // 2) save tcp
        if (count === undefined) {
            // 2-1-1) If same name not exist, add it
            res = await robotPramManger.tcp.add(selectedTool.tcpParam[toolTCPIndex]);

            // 2-1-2) Reload params list and save db or show toast.
            getparamsList();
            if (res) {
                await saveDatabase();
                return true;
            } else {
                Toast.show(
                    IToast.TYPE_WARN,
                    t('toast_title_002', {
                        ns: packageName,
                    }),
                    t('toast_message_002', {
                        ns: packageName,
                    }),
                    true,
                );
                return false;
            }

        } else {
            // 2-2-1) Shoe duplicate info dialog
            duplicateDialog(
                async (okay: boolean) => {
                // 2-2-2) If user select 'OK', save setting and reload params list. And save db or show toast.
                    if (okay) {
                        res = await robotPramManger.tcp.set(selectedTool.tcpParam[toolTCPIndex]);

                        getparamsList();
                        if (res) {
                            await saveDatabase();
                        } else {
                            Toast.show(
                                IToast.TYPE_WARN,
                                t('toast_title_002', {
                                    ns: packageName,
                                }),
                                t('toast_message_002', {
                                    ns: packageName,
                                }),
                                true,
                            );
                        }
                    }
                }
            );
        }
    }

    const findSameNamesTCP = (objects: ToolCenterPoint) => {
        return objects.symbol === selectedTool.tcpParam[toolTCPIndex].symbol;
    };

    const onCheckTCP = () => {
        // 1) check equal name
        const arrayIndex =  tcplist.findIndex(
            (element: ToolCenterPoint) => {
                if (toolTCPName ==='') {
                    return element.symbol === selectedTool.tcpParam[toolTCPIndex].symbol
                }
                else {
                    return element.symbol === toolTCPName
                }
            },
        );
        if (arrayIndex === -1) {
            return false;
        }

        // 2) get TCP from list
        const parmTCP = tcplist[arrayIndex].tcp.targetPose.map((element: number) => {
            return Number(element.toFixed(2));
        });

        // 3) check cog and weight
        const currentTCP = toolTCP.map((element: string) => {
            return Number(Number(element).toFixed(2));
        });

        if (JSON.stringify(parmTCP) === JSON.stringify(currentTCP)) {
            return true;
        } else {
            return false;
        }
    };

    /*****
     * tool weight
     *****/
    
    const onChangeToolWeightName = (event: React.ChangeEvent<HTMLInputElement>) => {
        // 1) copy current error case
        let newError = [...errorCase]

        // 2) Check error
        if (event.target.value === '') {
            // error 1) blank name
            newError[TOOL_INDEX_WEIGHT] = TOOL_NAME_ERROR_CASE.NO_NAME
        }
        else if (!SETTING_NAME_REG_EXP.test(event.target.value) ) {
            // error 2) Not english, number, and _
            newError[TOOL_INDEX_WEIGHT] = TOOL_NAME_ERROR_CASE.ONLY_ENG
        }
        else if(event.target.value.length > 30) {
            // error 3) over length
            newError[TOOL_INDEX_WEIGHT] = TOOL_NAME_ERROR_CASE.OVER_LENGTH
        }
        else {
            // no error
            newError[TOOL_INDEX_WEIGHT] = TOOL_NAME_ERROR_CASE.NO_ERROR
        }

        // 3) If error is not over length and eng, update it
        if (newError[TOOL_INDEX_WEIGHT] !== TOOL_NAME_ERROR_CASE.ONLY_ENG && newError[TOOL_INDEX_WEIGHT] !== TOOL_NAME_ERROR_CASE.OVER_LENGTH) {
            setToolWeightName(event.target.value)
        }

        // 4) update error case
        setErrorCase(newError)
    };

    const onBlurWeightName = () => {
        // 1) when on blur occured and error case is over length or only eng, erase error.
        let newError = [...errorCase]
        if (newError[TOOL_INDEX_WEIGHT] === TOOL_NAME_ERROR_CASE.ONLY_ENG || newError[TOOL_INDEX_WEIGHT] === TOOL_NAME_ERROR_CASE.OVER_LENGTH) {
            newError[TOOL_INDEX_WEIGHT] = TOOL_NAME_ERROR_CASE.NO_ERROR
            setErrorCase(newError)
        }
        
        // 2) update name
        let changedTool: ToolType = JSON.parse(JSON.stringify(selectedTool));
        if (newError[TOOL_INDEX_WEIGHT] === TOOL_NAME_ERROR_CASE.NO_NAME  || toolWeightName === '') {
            setToolWeightName(weightPlaceholder)
        }
        else {
            changedTool.toolWeightParam[toolWeightIndex].symbol = toolWeightName;
            updateTool(changedTool);
        }
        
        // 3) reset focus
        setFocusNameIndex(null)
    }

    const onChangeToolWeight = (changedValue: string) => {
        // 1) check robot's payload
        const robotPramManger = props.moduleContext.getSystemManager(
            Context.ROBOT_PARAMETER_MANAGER,
        ) as IRobotParameterManager;
        const robotManager = props.moduleContext.getSystemManager(Context.ROBOT_MANAGER) as IRobotManager;
        let payload = robotPramManger.getMaxPayload(robotManager.getRobotModel() as RobotModel);

        // 2) Update value
        let stringValue = changedValue == undefined || null ? '0' : changedValue;
        const numValue = Number(stringValue);

        if (stringValue == '') {
            setToolWeight('');
        } else if (!isNaN(numValue) && TOOL_SETTING_REG_EXP.test(changedValue)) {
            // If value is not NaN, check value and change it.
            if (numValue < 0) {
                // If weight value is lower than 0, set to 0.
                stringValue = String(0);
            } else if (numValue > payload) {
                // If weight value is higher than payload, set to payload.
                stringValue = String(payload);
            } else {
                const checkRound = stringValue.split('.');
                // check value has decimal point
                if (checkRound.length > 1) {
                    // check decimal place is higher than second
                    if (checkRound[1].length > 2) {
                        // roundup
                        stringValue = roundDownValue(stringValue, 2);
                    }
                }
            }

            // 3) Update state and props
            setToolWeight(stringValue);
        }
    };

    const onBlurToolWeight = (weightIndex: number) => {
        const stringValue = roundDownValue(toolWeight, 2);
        let changedTool: ToolType = JSON.parse(JSON.stringify(selectedTool));

        if (toolWeight === '') {
            setToolWeight('0');
            changedTool.toolWeightParam[weightIndex].tool.weight = 0;
        } else {
            changedTool.toolWeightParam[weightIndex].tool.weight = Number(stringValue);
        }
        updateTool(changedTool);
    };

    const onChangeCog = (event: React.ChangeEvent<HTMLInputElement>) => {
        const index = Number(event.target.name);

        // 1) Update value
        const stringValue = event.target.value == undefined || null ? '0' : event.target.value;
        const numValue = Number(stringValue);
        let newCog = [...toolWeightCog];
        const checkRound = stringValue.split('.');

        // 2) Update  state
        if (stringValue == '' || stringValue == '-') {
            newCog[index] = stringValue;
        } else if (!isNaN(numValue) && TOOL_SETTING_REG_EXP.test(stringValue)) {
            // If value is not NaN, check value and change it.
            if (numValue > TOOL_WEIGHT_MAX) {
                // If cog value is higher than Maximum, set to TOOL_WEIGHT_MAX.
                newCog[index] = String(TOOL_WEIGHT_MAX);
            } else if (numValue < TOOL_WEIGHT_MIN) {
                // If cog value is lower than Minimum, set to TOOL_WEIGHT_MIN.
                newCog[index] = String(TOOL_WEIGHT_MIN);
            } else if (checkRound.length > 1) {
                // check decimal place is higher than second
                if (checkRound[1].length > 2) {
                    // roundup
                    newCog[index] = roundDownValue(stringValue, 2);
                } else {
                    newCog[index] = stringValue;
                }
            } else {
                newCog[index] = stringValue;
            }
        }

        setToolWeightCog(newCog);
    };

    const onBlurCog = (weightIndex: number) => {
        // check weight cog
        const newCog = toolWeightCog.map((element: string) => {
            if (element === '-') {
                return 0
            }
            return Number(element);
        });

        let changedTool: ToolType = JSON.parse(JSON.stringify(selectedTool));
        changedTool.toolWeightParam[weightIndex].tool.cog = [...newCog] as ThreeNumArray;
        updateTool(changedTool);
    };

    const findSameNamesTW = (objects: ToolWeight) => {
        return objects.symbol === selectedTool.toolWeightParam[toolWeightIndex].symbol;
    };
    const handleClickWeight = async (weightIndex: number) => {
        let res: boolean | undefined;

        // 0) check robot mode and if it is auto, return false
        const modeResult = checkCurrentMode()
        if (!modeResult) {
            return false
        }
        
        // 1) Check same name exist
        const count = toolWeightlist?.find(findSameNamesTW);

        // 2) Save tool weight
        if (count === undefined) {
            // 2-1-1) If same name not exist, add it
            res = await robotPramManger.toolWeight.add(selectedTool.toolWeightParam[weightIndex]);

            // 2-1-2) Reload params list and save db or show toast.
            getparamsList();
            if (res) {
                await saveDatabase();
                return true;
            } else {
                Toast.show(
                    IToast.TYPE_WARN,
                    t('toast_title_002', {
                        ns: packageName,
                    }),
                    t('toast_message_002', {
                        ns: packageName,
                    }),
                    true,
                );
                return false;
            }
        } else {
            // 2-2-1) Shoe duplicate info dialog
            duplicateDialog(
                async (okay: boolean) => {
                // 2-2-2) If user select 'OK', save setting and reload params list. And save db or show toast.
                    if (okay) {
                        res = await robotPramManger.toolWeight.set(selectedTool.toolWeightParam[weightIndex]);

                        getparamsList();
                        if (res) {
                            await saveDatabase();
                        } else {
                            Toast.show(
                                IToast.TYPE_WARN,
                                t('toast_title_002', {
                                    ns: packageName,
                                }),
                                t('toast_message_002', {
                                    ns: packageName,
                                }),
                                true,
                            );
                        }
                    }
                }
            );
        }
    }

    const onCheckToolWeight = (weightIndex: number) => {
        // 1) check equal name
        const arrayIndex = toolWeightlist.findIndex(
            (element: ToolWeight) => {
                if (toolWeightName ==='') {
                    return element.symbol ===  selectedTool.toolWeightParam[weightIndex].symbol
                }
                else {
                    return element.symbol === toolWeightName
                }
            },
        );
        if (arrayIndex === -1) {
            return false;
        }

        // 2) get cog and weight from list
        const parmWeight = toolWeightlist[arrayIndex].tool.weight.toFixed(2);
        const parmCog = toolWeightlist[arrayIndex].tool.cog.map((element: number) => {
            return Number(element.toFixed(2));
        });

        // 3) check cog and weight
        const currentCog = toolWeightCog.map((element: string) => {
            return Number(Number(element).toFixed(2));
        });

        if (Number(parmWeight) === Number(toolWeight) && JSON.stringify(parmCog) === JSON.stringify(currentCog)) {
            return true;
        } else {
            return false;
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
                id="typography_7a7a"
                sx={{
                    'fontSize': '16px',
                    'fontWeight': 'bold',
                }}
            >
                {t('mainscreen_title_002', {
                    ns: packageName,
                })}
            </Typography>
            <Divider id="divider_3e3a"></Divider>
            <Grid
                container
                spacing={3}
                sx={{
                    'marginTop': '1px',
                }}
            >
                {/* Tool TCP */}
                <Grid item xs={6}>
                    <Typography
                        variant="body1"
                        className={`${styles['main-screen-label']}`}
                        sx={{
                            'color': '#565a68ff',
                            'fontSize': '14px',
                            'fontWeight': 'bold',
                            'marginBottom': '0px',
                        }}
                    >
                        {t('tool_settings_title_001', {
                            ns: packageName,
                        })}
                    </Typography>

                    <Grid
                        container
                        spacing={2}
                        sx={{
                            'marginTop': '10px',
                        }}
                    >
                        {/* Name */}
                        <Grid
                            item
                            xs={12}
                            style={{
                                flexGrow: 1,
                            }}
                        >
                            <TextField
                                value={toolTCPName}
                                placeholder={toolTCPNamePlaceholder}
                                onChange={onChangeTCPName}
                                onBlur={()=>onBlurTCPName()}
                                error={errorCase[TOOL_INDEX_TCP] !== TOOL_NAME_ERROR_CASE.NO_ERROR && errorCase[TOOL_INDEX_TCP] !== TOOL_NAME_ERROR_CASE.NO_NAME}
                                helperText={errorPrint(TOOL_INDEX_TCP)}
                                fullWidth={true}
                                onFocus={() => {
                                    setFocusNameIndex(TOOL_INDEX_TCP);
                                }}
                                InputProps={
                                    focusNameIndex === TOOL_INDEX_TCP
                                        ? {
                                            'endAdornment': (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="delete"
                                                        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) =>
                                                            e.preventDefault()
                                                        }
                                                        onClick={() => {
                                                            onClickEraseName(TOOL_INDEX_TCP);
                                                        }}
                                                    >
                                                        <Erase />
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }
                                        : {
                                            'endAdornment': <InputAdornment position="end"></InputAdornment>,
                                        }
                                }
                            />
                        </Grid>
                        {/* X */}
                        <Grid item xs={4}>
                            <TextField
                                name={'0'}
                                value={toolTCP[0]}
                                onChange={onChangeTCPPose}
                                onBlur={() => onBlurTCPPose()}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{poseText[0]}</InputAdornment>,
                                    endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                                }}
                            />
                        </Grid>
                        {/* Y */}
                        <Grid item xs={4}>
                            <TextField
                                name={'1'}
                                value={toolTCP[1]}
                                onChange={onChangeTCPPose}
                                onBlur={() => onBlurTCPPose()}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{poseText[1]}</InputAdornment>,
                                    endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                                }}
                            />
                        </Grid>
                        {/* Z */}
                        <Grid item xs={4}>
                            <TextField
                                name={'2'}
                                value={toolTCP[2]}
                                onChange={onChangeTCPPose}
                                onBlur={() => onBlurTCPPose()}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{poseText[2]}</InputAdornment>,
                                    endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                                }}
                            />
                        </Grid>
                        {/* RZ */}
                        <Grid item xs={4}>
                            <TextField
                                name={'3'}
                                value={toolTCP[3]}
                                onChange={onChangeTCPPose}
                                onBlur={() => onBlurTCPPose()}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{poseText[3]}</InputAdornment>,
                                    endAdornment: <InputAdornment position="end">deg</InputAdornment>,
                                }}
                            />
                        </Grid>
                        {/* RY */}
                        <Grid item xs={4}>
                            <TextField
                                name={'4'}
                                value={toolTCP[4]}
                                onChange={onChangeTCPPose}
                                onBlur={() => onBlurTCPPose()}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{poseText[4]}</InputAdornment>,
                                    endAdornment: <InputAdornment position="end">deg</InputAdornment>,
                                }}
                            />
                        </Grid>
                        {/* RX */}
                        <Grid item xs={4}>
                            <TextField
                                name={'5'}
                                value={toolTCP[5]}
                                onChange={onChangeTCPPose}
                                onBlur={() => onBlurTCPPose()}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{poseText[5]}</InputAdornment>,
                                    endAdornment: <InputAdornment position="end">deg</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid
                            item
                            xs={9}
                            style={{
                                flexGrow: 1,
                            }}
                        >
                            <Typography>The entered data must be synchronized with the robot.</Typography>
                        </Grid>
                        <Grid
                            item
                            xs={3}
                            style={{
                                alignSelf: 'flex-end',
                            }}
                            sx={{
                                'textAlign': 'right',
                            }}
                        >
                            <Button
                                style={{
                                    width: '134px',
                                }}
                                disabled={onCheckTCP()}
                                onClick={() => handleClickTCP()}
                                sx={{
                                    'fontSize': '14px',
                                }}
                            >
                            {isPasswordLock ? <Lock /> : <></>}
                                {t('btn_apply_robot', {
                                    ns: packageName,
                                })}
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
                {/* Tool Weight */}
                <Grid item xs={6}>
                    <Typography
                        variant="body1"
                        className={`${styles['main-screen-label']}`}
                        sx={{
                            'color': '#565a68ff',
                            'fontSize': '14px',
                            'fontWeight': 'bold',
                        }}
                    >
                        {t('tool_settings_title_002', {
                            ns: packageName,
                        })}
                    </Typography>
                    <Grid
                        container
                        style={{
                            paddingBottom: '2vh',
                        }}
                        spacing={2}
                        sx={{
                            'marginTop': '10px',
                        }}
                    >
                        {/* Name */}
                        <Grid
                            item
                            xs={12}
                            style={{
                                flexGrow: 1,
                            }}
                        >
                            <TextField               
                                value={toolWeightName}
                                placeholder={weightPlaceholder}
                                onChange={onChangeToolWeightName}
                                onBlur={()=>onBlurWeightName()}
                                error={errorCase[TOOL_INDEX_WEIGHT] !== TOOL_NAME_ERROR_CASE.NO_ERROR && errorCase[TOOL_INDEX_WEIGHT] !== TOOL_NAME_ERROR_CASE.NO_NAME}
                                helperText={errorPrint(TOOL_INDEX_WEIGHT)}
                                fullWidth={true}
                                onFocus={() => {
                                    setFocusNameIndex(TOOL_INDEX_WEIGHT);
                                }}
                                InputProps={
                                    focusNameIndex === TOOL_INDEX_WEIGHT
                                        ? {
                                            'endAdornment': (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="delete"
                                                        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) =>
                                                            e.preventDefault()
                                                        }
                                                        onClick={() => {
                                                            onClickEraseName(TOOL_INDEX_WEIGHT);
                                                        }}
                                                    >
                                                        <Erase />
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }
                                        : {
                                            'endAdornment': <InputAdornment position="end"></InputAdornment>,
                                        }
                                }
                            />
                        </Grid>
                        {/* Weight */}
                        <Grid
                            item
                            xs={12}
                            style={{
                                flexGrow: 1,
                            }}
                        >
                            <TextField
                                value={toolWeight}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    onChangeToolWeight(e.target.value)
                                }
                                onBlur={() => onBlurToolWeight(toolWeightIndex)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">Weight</InputAdornment>,
                                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                                }}
                            />
                        </Grid>
                        {/* CX */}
                        <Grid
                            item
                            xs={4}
                            style={{
                                flexGrow: 1,
                            }}
                        >
                            <TextField
                                name={'0'}
                                value={toolWeightCog[0]}
                                onChange={onChangeCog}
                                onBlur={() => onBlurCog(toolWeightIndex)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{cogText[0]}</InputAdornment>,
                                    endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                                }}
                            />
                        </Grid>
                        {/* CY */}
                        <Grid
                            item
                            xs={4}
                            style={{
                                flexGrow: 1,
                            }}
                        >
                            <TextField
                                name={'1'}
                                value={toolWeightCog[1]}
                                onChange={onChangeCog}
                                onBlur={() => onBlurCog(toolWeightIndex)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{cogText[1]}</InputAdornment>,
                                    endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                                }}
                            />
                        </Grid>
                        {/* CZ */}
                        <Grid
                            item
                            xs={4}
                            style={{
                                flexGrow: 1,
                            }}
                        >
                            <TextField
                                name={'2'}
                                value={toolWeightCog[2]}
                                onChange={onChangeCog}
                                onBlur={() => onBlurCog(toolWeightIndex)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{cogText[2]}</InputAdornment>,
                                    endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid
                            item
                            xs={9}
                            style={{
                                flexGrow: 1,
                            }}
                        >
                            <Typography>The entered data must be synchronized with the robot.</Typography>
                        </Grid>
                        <Grid
                            item
                            xs={3}
                            style={{
                                alignSelf: 'flex-end',
                            }}
                            sx={{
                                'textAlign': 'right',
                            }}
                        >
                            <Button
                                style={{
                                    width: '134px',
                                }}
                                disabled={onCheckToolWeight(toolWeightIndex)}
                                onClick={() => handleClickWeight(toolWeightIndex)}
                                sx={{
                                    'fontSize': '14px',
                                    'justifyContent': 'center',
                                }}
                            >
                                {isPasswordLock ? <Lock /> : <></>}
                                {t('btn_apply_robot', {
                                    ns: packageName,
                                })}
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};
export default React.memo(ToolSettings);
