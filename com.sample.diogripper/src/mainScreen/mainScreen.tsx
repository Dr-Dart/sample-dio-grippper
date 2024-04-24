/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */

/*********
 * mainScreen.tsx
 *********
 * Module's main screen.
 * Manage and update database of DIO Gripper
 * - If you want to see select tab, go to './selectTab.tsx'
 * - If you want to see Tool setting(tcp, tool weight), go to './toolSettings.tsx'
 * - If you want to see Digital IO Settings, go to './WriteSignal.tsx'
 * - If you want to see Dialog about gripper name, go to './Dialog.tsx'
 * - If you want to see Loading Screen go to './loading.tsx'
 *********/

// style
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../assets/styles/styles.scss';
import { Container, Grid, Typography } from '@mui/material';

// constant
import { SignalWrite, ToolType } from '../types';
import { DEFAULT_WRITE_SIGNAL, DEFAULT_READ_SIGNAL, INIT_TOOL_VALUE, RESET_TEMPLATE } from '../constants';
import DatabaseManager, { IDBData } from '../utils/DatabaseManager';

// component
import { IToast, ModuleContext, Toast } from 'dart-api';
import SelectSettings from './selectTab';
import ToolSettings from './toolSettings';
import WriteSignal from './WriteSignal';
import Loading from './loading';

// translate
import { useTranslation } from 'react-i18next';

interface DIOGripperProps {
    readonly moduleContext: ModuleContext;
}
export default function DIOGripper(props: DIOGripperProps) {
    const { t } = useTranslation();
    const { moduleContext } = props;
    const { packageName, packageInfo } = moduleContext;

    /************
     * State
     ************/
    // check initial complete
    const [init, setInit] = useState(true as boolean);

    // Module Database (local)
    const moduleDatabase = useRef([] as IDBData[]);

    // current selected data
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [currentGripperData, setCurrentGripperData] = useState({
        key: 0,
        name: 'a',
        tool: INIT_TOOL_VALUE,
        write: [...DEFAULT_WRITE_SIGNAL],
        read: [...DEFAULT_READ_SIGNAL],
    } as IDBData);

    // check data changed
    const [isChange, setIsChange] = useState(false as boolean);

    /************
     * useEffect
     ************/
    // Initial
    useEffect(() => {
        // initial start
        setInit(false);

        const initial = async () => {
            // Set Database Data
            await DatabaseManager.initDatabase(moduleContext);

            // select data
            await selectData(selectedIndex);
        };

        initial().then(() => {
            // initial complete
            setInit(true);
        });
    }, []);

    // change gripper setting when index change
    useEffect(() => {
        selectData(selectedIndex);
    }, [selectedIndex]);

    // Check data change occured
    useEffect(() => {
        if (JSON.stringify(moduleDatabase.current) !== '[]') {
            // If data is not empty, check data changed
            if (JSON.stringify(moduleDatabase.current[selectedIndex]) !== JSON.stringify(currentGripperData)) {
                // If data change, set true
                setIsChange(true);
            } else {
                // If not, set false
                setIsChange(false);
            }
        }
    }, [currentGripperData]);

    /************
     * Sub Function
     * - Database
     ************/
    // Get selected index's Database
    const selectData = async (index: number) => {
        // get all data from DB and save it to ref
        let data = await DatabaseManager.getDataAll();
        moduleDatabase.current = [...data];

        // If data is not null, set data
        if (JSON.stringify(moduleDatabase.current) !== '[]') {
            // deep copy
            let data = JSON.parse(JSON.stringify(moduleDatabase.current[index]));
            setCurrentGripperData(data);
        }

        return;
    };

    // Save Data to database
    const saveDatabase = useCallback(async () => {
        // 1) update database and show toast
        moduleDatabase.current[selectedIndex] = JSON.parse(JSON.stringify(currentGripperData));

        await DatabaseManager.saveData(moduleDatabase.current[selectedIndex], selectedIndex);

        Toast.show(
            IToast.TYPE_SUCCESS,
            t('toast_title_001', {
                ns: packageName,
            }),
            t('toast_message_001', {
                ns: packageName,
            }),
            true,
        );

        // 2) When update finish, set ischange to false
        setIsChange(false);

        return;
    }, [currentGripperData]);

    /************
     * Sub Function
     * - Select Tool
     ************/
    // Select Gripper Setting
    const onChangeSelectTool = (index: number) => {
        setSelectedIndex(index);
    };

    //Reset Data to Default
    const onChangeResetTemplete = (index: RESET_TEMPLATE) => {
        let data = null;

        // 1) get data and update template index
        if (index === RESET_TEMPLATE.LAST_DATA) {
            data = JSON.parse(JSON.stringify(moduleDatabase.current[selectedIndex]));
        } else {
            // get initial data from database
            data = DatabaseManager.getInitData(index);
            data.key = moduleDatabase.current[selectedIndex].key;
            data.name = moduleDatabase.current[selectedIndex].name;
        }

        // 2) reset tool state
        setCurrentGripperData(data);
    }

    /************
     * Sub Function
     * - Tool Setting
     ************/
    const updateTool = useCallback(
        (changedTool: ToolType) => {
            let changedData = JSON.parse(JSON.stringify(currentGripperData));
            changedData.tool = changedTool;
            setCurrentGripperData(changedData);
        },
        [currentGripperData],
    );

    /************
     * Sub Function
     * - Write Signal
     ************/
    const updateWriteSignal = useCallback(
        (changedWriteSignals: SignalWrite[]) => {
            let changedData = JSON.parse(JSON.stringify(currentGripperData));
            changedData.write = changedWriteSignals;
            setCurrentGripperData(changedData);
        },
        [currentGripperData],
    );

    /************
     * Render
     ************/
    return (
        <Container
            className={`${styles['main-container']}`}
            sx={{
                'marginTop': '20px',
            }}
        >
            <div>
                {/* Title */}
                <Grid
                    sx={{
                        '&.MuiGrid-root:empty': {
                            'min-height': '50px',
                        },
                    }}
                    id="grid_bb57"
                    style={{
                        'justifyContent': 'space-between',
                    }}
                    container={true}
                >
                    <Typography
                        id="typography_ba80"
                        sx={{
                            'fontSize': '19px',
                            'fontWeight': 'bold',
                        }}
                    >
                        {t('mainscreen_title_001', {
                            ns: packageName,
                        })}
                    </Typography>
                    <Typography
                        id="typography_f1c9"
                        sx={{
                            'color': '#b9b9b9ff',
                            'fontSize': '12px',
                            'textAlign': 'right',
                        }}
                    >
                        {`ver${packageInfo?.version}`}
                    </Typography>
                </Grid>
                {/* Select Gripper Setitngs */}
                <SelectSettings
                    moduleContext={moduleContext}
                    database={moduleDatabase.current}
                    currentGripperData={currentGripperData}
                    isDataChange={isChange}
                    saveDatabase={saveDatabase}
                    selectedIndex={selectedIndex}
                    onChangeSelectTool={onChangeSelectTool}
                    selectData={selectData}
                    onChangeResetTemplete={onChangeResetTemplete}
                />
                {/* Tool Settings*/}
                <ToolSettings
                    moduleContext={moduleContext}
                    selectedTool={currentGripperData.tool}
                    updateTool={updateTool}
                    saveDatabase={saveDatabase}
                    database={moduleDatabase.current[selectedIndex]}
                />
                {/* Digital IO Settings*/}
                <WriteSignal
                    moduleContext={moduleContext}
                    writeSignals={currentGripperData.write}
                    updateSignal={updateWriteSignal}
                />
            </div>
            <Loading hidden={init} />
        </Container>
    );
}