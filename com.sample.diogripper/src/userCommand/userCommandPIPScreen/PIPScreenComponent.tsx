/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */

/*********
 * PIPScreenComponent.tsx
 *********
 * - Property screen.
 *********/

// style
import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    SelectChangeEvent,
    IconButton,
} from '@mui/material';
import styles from '../../assets/styles/styles.scss';
import Replay from '../../assets/images/icon_reset.svg';

// constant
import { GripperUserCommandInfo } from '../../types';
import { EMPTY_PORT } from '../../constants';

// component
import { ModuleContext } from 'dart-api';
import DatabaseManager, { DB_COLUMN_NAME } from '../../utils/DatabaseManager';

const InitialData = {
    name : '',
    signalType: '',
    port: [''],
    signal: [0],
    timeout: [''],
} as GripperUserCommandInfo;

// translate
import { useTranslation } from 'react-i18next';

/**
 * A data interface use for Gripper.
 **/
export interface ComponentProps {
    moduleContext: ModuleContext;
    currentDBIndex: number;
    updateDRLValue: (index: number) => void;
}

function PropertyScreen(props: ComponentProps) {
    const { moduleContext, currentDBIndex, updateDRLValue } = props;

    // Database State
    const [dataBaseName, setDataBaseName] = useState([''] as string[]);
    const [dataBase, setDataBase] = useState([
        {
            ...InitialData,
        },
    ] as GripperUserCommandInfo[]);

    // Selected DB
    const [selectedDB, setSelectedDB] = useState({
        ...InitialData,
    } as GripperUserCommandInfo);
    const [selectedDBIndex, setSelectedDBIndex] = useState(0);

    // translate
    const { t } = useTranslation();
    const { packageName } = moduleContext;

    // When Start, get DB Data
    useEffect(() => {
        if (typeof currentDBIndex === 'number') {
            setSelectedDBIndex(currentDBIndex);
        }
        
        UpdatePreloadData((success: boolean) => {
            if (success) {
            } else {
                DatabaseManager.initDatabase(moduleContext).then(() => {
                    onClickRefresh();
                });
            }
        });
    }, []);

    // Check drl state change
    useEffect(() => {
        if (currentDBIndex !== selectedDBIndex && typeof currentDBIndex === 'number') {
            setSelectedDBIndex(currentDBIndex);
        }
    }, [currentDBIndex]);

    // If Index or database changed, change DB
    useEffect(() => {
        if (JSON.stringify([InitialData]) !== JSON.stringify(dataBase)) {
            if (dataBase[selectedDBIndex] !== undefined) {
                setSelectedDB(dataBase[selectedDBIndex]);
                updateDRLValue(selectedDBIndex);
            } else {
                // DB Not Exist.
            }
        }
    }, [selectedDBIndex, dataBase]);

    /**
     * Get data from database
     **/
    const UpdatePreloadData = async (onComplete?: (success: boolean) => void) => {
        // 1) Init database
        let result = await DatabaseManager.initDatabase(moduleContext);

        // 2) Get user command data in database
        const dataList = await DatabaseManager.getUserCommandData();

        let infos = [] as GripperUserCommandInfo[];
        if (moduleContext.componentId == 'pip_grasp') {
            infos = [...dataList[0]];
        } else if (moduleContext.componentId == 'pip_release') {
            infos = [...dataList[1]];
        }

        // 3) get gripper names
        const nameArray = await DatabaseManager.getData(DB_COLUMN_NAME);

        let names = [] as string[];
        nameArray.map((nameData) => {
            names.push(JSON.parse(nameData.data.name));
        });

        // 4) set state
        if (infos.toString() !== [].toString()) {
            setDataBase(infos);
            setDataBaseName(names);
            onComplete?.(true);
        } else {
            onComplete?.(false);
        }

        return true;
    };

    //Refresh DB
    const onClickRefresh = () => {
        UpdatePreloadData();
    };

    //Select Tool setting list event. Use in render(select.onchange)
    const handleChange = (e: SelectChangeEvent) => {
        let index = e.target.value;

        //Update DB and change index
        setSelectedDBIndex(Number(index));
    }; //handlechange

    return (
        <Container
            style={{
                paddingLeft: '15px',
                paddingRight: '15px',
            }}
        >
            {/* Title */}
            <Grid
                container
                justifyContent="space-between"
                sx={{
                    '&.MuiGrid-root:empty': {
                        'min-height': '50px',
                    },
                }}
                id="grid_5f5f"
            >
                <Typography
                    id="typography_8aee"
                    sx={{
                        'fontSize': '26px',
                        'fontWeight': 'bold',
                        'marginTop': '10px',
                        'textAlign': 'center',
                    }}
                >
                    {`${moduleContext.componentInfo?.name}`}
                </Typography>
            </Grid>
            <Typography
                id="typography_8aee"
                sx={{
                    'color': '#b9b9b9ff',
                    'fontSize': '14px',
                }}
            >
                {`Module Info : ${moduleContext.packageInfo?.name}, ver${moduleContext.packageInfo?.version}`}
            </Typography>
            {/* Select Gripper */}
            <Grid container justifyContent="space-between">
                <Grid item xs={10.5}>
                    <Select
                        value={String(selectedDBIndex)}
                        onChange={handleChange}
                        sx={{
                            'marginBottom': '15px',
                            'width': '100%',
                        }}
                    >
                        {dataBaseName.map((name: string, index: number) => (
                            <MenuItem value={index}>{name}</MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={1}>
                    <IconButton
                        onClick={() => onClickRefresh()}
                        sx={{
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        size="large"
                    >
                        <Replay />
                    </IconButton>
                </Grid>
            </Grid>
            {/* Signal Type */}
            <TableContainer className={`${styles['table-container']}`}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell width="100%" className={`${styles['first-thead-cell']}`}>
                                {t('DIO_settings_title_002', { ns: packageName })}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell width="100%">{selectedDB?.signalType}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            {/* Port, Signal, timeout */}
            <TableContainer className={`${styles['table-container']}`}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell width="30%" className={`${styles['first-thead-cell']}`}>
                                {t('DIO_settings_title_003', { ns: packageName })}
                            </TableCell>
                            <TableCell width="30%" className={`${styles['first-thead-cell']}`}>
                                {t('DIO_settings_title_004', { ns: packageName })}
                            </TableCell>
                            <TableCell width="40%" className={`${styles['first-thead-cell']}`}>
                                {t('DIO_settings_title_005', { ns: packageName })}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedDB.port.map((port: string, index: number) =>
                            port === EMPTY_PORT ? null : (
                                <TableRow>
                                    <TableCell width="30%">{port}</TableCell>
                                    <TableCell width="30%">
                                        {JSON.stringify(Boolean(selectedDB.signal[index]))}
                                    </TableCell>
                                    <TableCell width="40%">{selectedDB.timeout[index]}</TableCell>
                                </TableRow>
                            ),
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* Preparation */}
            <TableContainer
                className={`${styles['table-container']}`}
                sx={{
                    'marginTop': '15px',
                }}
            >
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell width="100%" className={`${styles['first-thead-cell']}`}>
                                {t('usercommandscreen_title_002', { ns: packageName })}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell width="100%">
                                <Typography
                                    id="typography_8aee"
                                    sx={{
                                        'fontSize': '14px',
                                        'height': '80px',
                                        'marginLeft': '20px',
                                        'marginTop': '20px',
                                        'textAlign': 'center',
                                    }}
                                >
                                    {t('usercommandscreen_info_001', { ns: packageName })}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell width="100%">
                                <Typography
                                    id="typography_8aee"
                                    sx={{
                                        'fontSize': '13px',
                                        'height': '80px',
                                        'marginLeft': '20px',
                                        'marginTop': '20px',
                                        'textAlign': 'center',
                                    }}
                                >
                                    {t('usercommandscreen_info_002', { ns: packageName })}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell width="100%">
                                <Typography
                                    id="typography_8aee"
                                    sx={{
                                        'fontSize': '13px',
                                        'height': '80px',
                                        'marginLeft': '20px',
                                        'marginTop': '20px',
                                        'textAlign': 'center',
                                    }}
                                >
                                    {t('usercommandscreen_info_003', { ns: packageName })}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow></TableRow>
                        <TableRow></TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}

export default PropertyScreen;
