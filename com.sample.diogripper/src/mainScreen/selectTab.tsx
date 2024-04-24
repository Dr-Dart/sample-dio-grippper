/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */

/*********
 * selectTab.tsx
 *********
 * Select, save, and load gripper setting.
 * - If you want to see Dialog about gripper name, go to './Dialog.tsx'
 *********/

// style
import React, { useState, useEffect, useRef } from 'react';
import {
    Grid,
    Tab,
    Tabs,
    IconButton,
    Typography,
    MenuItem,
    Select,
    SelectChangeEvent,
    FormControl,
    Divider,
    Button,
} from '@mui/material';
import Edit from '../assets/images/icon_edit.svg';

// constant
import { RESET_TEMPLATE } from '../constants';

// component
import {
    ModuleContext,
    IBoardDialog,
    SafetyMode,
    DialogInterface,
    IDialog,
    Context,
    IRobotManager,
    IToast,
    Toast,
    BoardDialogBuilder
} from 'dart-api';
import EditContent from './Dialog';
import DatabaseManager, { IDBData } from '../utils/DatabaseManager';

// translate
import { t } from 'i18next';

export interface selectProps {
    moduleContext: ModuleContext;
    database: IDBData[];
    currentGripperData: IDBData;
    isDataChange: boolean;
    saveDatabase: () => Promise<void>;
    selectedIndex: number;
    onChangeSelectTool: (value: number) => void;
    selectData: (index: number) => Promise<void>;
    onChangeResetTemplete: (index: RESET_TEMPLATE) => void;
}
const SelectSettings = (props: selectProps) => {
    const {
        moduleContext,
        database,
        currentGripperData,
        isDataChange,
        saveDatabase,
        selectedIndex,
        onChangeSelectTool,
        selectData,
        onChangeResetTemplete,
    } = props;

    /***********
     * State
     ***********/
    // Common
    const { packageName } = moduleContext;
    const safetyMode = useRef(SafetyMode.AUTO as SafetyMode);
    const robotManger = moduleContext.getSystemManager(Context.ROBOT_MANAGER) as IRobotManager;

    // Tab
    const [settingNames, setSettingsNames] = useState(['a', 'b', 'c'] as string[]);

    // Dialog
    const [isChangeDialog, setChangeDialog] = useState(false as boolean);
    const dialog = useRef(null as IBoardDialog | null);
    const changedIndex = useRef(0)
    const tempState = useRef([] as IDBData[])

    // Reset Templete
    const [templateIndex, setTemplateIndex] = useState(RESET_TEMPLATE.NOT_SELECTED as RESET_TEMPLATE);

    /***********
     * useEffect
     ***********/
    // Initial
    useEffect(() => {
        // 1) Make auto/manual callback
        const safetyModeCallback = (mode: SafetyMode) => {
            if (mode === SafetyMode.AUTO && dialog.current !== (null || undefined)) {
                // If mode is auto and dialog show, dismiss it.
                dialog.current?.dismiss();
            }

            safetyMode.current = mode;
        };

        // 2) register callback and get current mode
        safetyMode.current = robotManger.safetyMode.value;
        robotManger.safetyMode.register(moduleContext, safetyModeCallback);

        return () => {
            // When unmount screen, unregister callback and dismiss popup
            robotManger.safetyMode.unregister(moduleContext, safetyModeCallback);
            dialog.current?.dismiss();
        };
    }, []);

    // Check database to change name
    useEffect(() => {
        // If database change, set name
        if (JSON.stringify(database) !== '[]') {
            // Get setting name
            let name = [] as string[];
            database.map((value: IDBData) => {
                name.push(value.name);
            });
            setSettingsNames(name);
        }
    }, [database]);

    // If dialog's data change, update data to dialog (dialog's save button enable)
    useEffect(() => {
        dialog.current?.setButton(
            DialogInterface.BUTTON_POSITIVE,
            t('btn_save', { ns: moduleContext.packageName }),
            isChangeDialog,
            {
                onClick: (dialog: IDialog) => {
                    onClickDialogSave(dialog);
                },
            },
        );
    }, [isChangeDialog]);

    // Check data change occured
    useEffect(() => {
        // 1) If templete index selected,
        if (templateIndex !== RESET_TEMPLATE.NOT_SELECTED) {
            // 1-1) get templete data and change key and name.
            let templateData = DatabaseManager.getInitData(templateIndex);
            templateData.key = database[selectedIndex].key;
            templateData.name = database[selectedIndex].name;

            // 1-2) Check different
            if (JSON.stringify(templateData) !== JSON.stringify(currentGripperData)) {
                // If data is not equal to templete, reset index
                setTemplateIndex(RESET_TEMPLATE.NOT_SELECTED);
            }
        }
    }, [templateIndex, currentGripperData]);

    /***********
     * Common
     ***********/
    // check current robot mode
    const checkCurrentMode = () => {
        if (safetyMode.current === SafetyMode.MANUAL) {
            // Manual, return true
            return true;
        } else if (safetyMode.current === SafetyMode.AUTO) {
            // Auto, return false
            Toast.show(
                IToast.TYPE_INFO,
                null,
                t('toast_message_007', {
                    ns: packageName,
                }),
                true,
            );
            return false;
        }
    };

    /***********
     * Gripper Select Tab
     ***********/
    // onChange event
    const onChangeTab = (event: React.SyntheticEvent, value: number) => {
        setTemplateIndex(RESET_TEMPLATE.NOT_SELECTED);
        onChangeSelectTool(value);
    };

    // Show gripper name tab
    function ShowTabList(gripperNames: string[]) {
        // If gripperNames is {} (Only IDE), Show test tab
        if (JSON.stringify(gripperNames) === '{}') {
            return <Tab label={'name'} value={0} />;
        }

        // If not, Show current name
        return gripperNames.map((name: string, index: number) => <Tab label={name} value={index} />);
    }

    /***********
     * Go to Edit Dialog
     ***********/
    // check dialog state change
    const setChangeCallback = (value: boolean) => {
        setChangeDialog(value);
    };

    const changedIndexCallback = (index: number) => {
        changedIndex.current = index;
    }

    const tempStateCallback = (changedTempState: IDBData[]) => {
        tempState.current = [...changedTempState];
    }

    // Show dialog
    const onClickEditDialog = () => {
        // 1) If mode is auto, return false
        const modeCheck = checkCurrentMode();
        if (!modeCheck) {
            return false;
        }

        // 2) If mode is manual, show dialog
        dialog.current = new BoardDialogBuilder(moduleContext)
            .setSize(DialogInterface.SIZE_NORMAL)
            .setTitle(
                t('Dialog_title_001', {
                    ns: moduleContext.packageName,
                }),
            )
            .setContentView(
                <EditContent
                    moduleContext={moduleContext}
                    database={database}
                    setChange={setChangeCallback}
                    currentIndex={selectedIndex}
                    setChangedIndex={changedIndexCallback}
                    tempStateCallback={tempStateCallback}
                />,
            )
            .setCloseButton(true)
            .setButton(
                DialogInterface.BUTTON_NEGATIVE,
                t('btn_cancel', {
                    ns: moduleContext.packageName,
                }),
                true,
                {
                    onClick: (dialog: IDialog) => {
                        // cancel edit
                        dialog.dismiss();
                    },
                },
            )
            .setButton(
                DialogInterface.BUTTON_POSITIVE,
                t('btn_save', {
                    ns: moduleContext.packageName,
                }),
                false,
                {
                    onClick: (dialog: IDialog) => {
                    },
                },
            )
            .build();

        dialog.current?.show();
    };

    // save dialog change
    const onClickDialogSave = async (dialog: IDialog) => {
        // 1) Update changed db
        let result = await DatabaseManager.updateDatabase(database, tempState.current);

        // 2) If db update success, update name
        if (result) {
            // 3) get name from db
            let name = [] as string[];
            tempState.current.map((value: IDBData) => {
                name.push(value.name);
            });
            setSettingsNames(name);

            // 4) change data
            if (changedIndex.current !== selectedIndex) {
                // If index changed, change it.
                onChangeSelectTool(changedIndex.current);
            } else {
                await selectData(selectedIndex);
            }
        }

        dialog.dismiss();

        setTemplateIndex(RESET_TEMPLATE.NOT_SELECTED);

        return true;
    };

    /***********
     * Reset Templete
     ***********/
    //Reset Data to Default
    const onChangeTempleteIndex = (event: SelectChangeEvent) => {
        // 1) update data to select index
        onChangeResetTemplete(event.target.value as RESET_TEMPLATE);

        // 2) update index
        setTemplateIndex(event.target.value as RESET_TEMPLATE);
    };

    /***********
     * Save Data
     ***********/
    const onClickSave = () => {
        // 1) If mode is auto, return false
        const modeCheck = checkCurrentMode();
        if (!modeCheck) {
            return false;
        }

        // 2) If mode is manual, save data and reset template index
        saveDatabase().then(() => {
            setTemplateIndex(RESET_TEMPLATE.NOT_SELECTED);
        });

        return true;
    };

    /***********
     * Render
     ***********/
    return (
        <div>
            {/* Select Tab */}
            <Grid justifyContent="space-between" id="grid_c02f" container={true} alignItems="center" direction="row">
                <Grid id="grid_9d53" item={true}>
                    <Tabs
                        value={JSON.stringify(settingNames) === '{}' ? 0 : selectedIndex}
                        onChange={onChangeTab}
                        id="tabs_b51a"
                        TabIndicatorProps={{
                            style: {
                                background: '#2E3745',
                            },
                        }}
                        variant="scrollable"
                        sx={{
                            'opacity': 1,
                        }}
                    >
                        {ShowTabList(settingNames)}
                    </Tabs>
                </Grid>
                <Grid id="grid_e2c6" item={true}>
                    <IconButton onClick={onClickEditDialog}>
                        <Edit />
                    </IconButton>
                </Grid>
            </Grid>
            {/* Save, Load */}
            <Grid
                container={true}
                maxWidth={'100%'}
                sx={{
                    'backgroundColor': '#fafafbff',
                    marginTop: 1,
                }}
                direction="row"
                justifyContent="flex-end"
                alignItems="center"
            >
                {/* Reset Template */}
                <Typography
                    id="typography_6498"
                    sx={{
                        'fontSize': '12px',
                        'marginRight': '5px',
                    }}
                >
                    {t('reset_menu_label', {
                        ns: packageName,
                    })}
                </Typography>
                <FormControl
                    id="formcontrol_ccd4"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Select
                        id="select_43ef"
                        value={templateIndex}
                        defaultValue={RESET_TEMPLATE.NOT_SELECTED}
                        onChange={onChangeTempleteIndex}
                    >
                        <MenuItem value={RESET_TEMPLATE.NOT_SELECTED} id="menuitem_4617" disabled>
                            <Typography
                                sx={{
                                    color: '#959595;',
                                }}
                            >
                                {t('reset_menu_placeholder', {
                                    ns: packageName,
                                })}
                            </Typography>
                        </MenuItem>
                        <MenuItem value={RESET_TEMPLATE.LAST_DATA} id="menuitem_46a7">
                            {t('reset_menu_item_001', {
                                ns: packageName,
                            })}
                        </MenuItem>
                        <MenuItem value={RESET_TEMPLATE.TEMPLATE_A} id="menuitem_95e2">
                            {t('reset_menu_item_002', {
                                ns: packageName,
                            })}
                        </MenuItem>
                        <MenuItem value={RESET_TEMPLATE.TEMPLATE_B} id="menuitem_60ff">
                            {t('reset_menu_item_003', {
                                ns: packageName,
                            })}
                        </MenuItem>
                        <MenuItem value={RESET_TEMPLATE.TEMPLATE_C} id="menuitem_46a9">
                            {t('reset_menu_item_004', {
                                ns: packageName,
                            })}
                        </MenuItem>
                    </Select>
                </FormControl>
                <Divider
                    id="divider_0f60"
                    sx={{
                        'marginLeft': '20px',
                        'marginRight': '20px',
                    }}
                    orientation="vertical"
                    flexItem={true}
                    variant="middle"
                ></Divider>
                {/* Save Data */}
                <Button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    disabled={!isDataChange}
                    onClick={onClickSave}
                >
                    {t('btn_save', {
                        ns: packageName,
                    })}
                </Button>
            </Grid>
        </div>
    );
};

export default SelectSettings;
