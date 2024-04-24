/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */

/*********
 * Dialog.tsx
 *********
 * - Dialog about gripper names setting.
 *********/

// style
import React, { useState, useEffect, useRef } from 'react';
import styles from '../assets/styles/dialog.scss';
import { ThemeProvider } from '@mui/material/styles';
import { Button, FormControl, IconButton, InputAdornment, InputLabel, TextField } from '@mui/material';
import Delete from '../assets/images/icon_trash.svg';
import Plus from '../assets/images/icon_plus.svg';
import Erase from '../assets/images/icon_delete.svg';
import Menu from '../assets/images/icon_menu.svg';

// constant
import { DB_ADD_TOOL, DB_ADD_WRITE, DB_ADD_READ, DB_MAX_LENGTH, SETTING_NAME_ERROR_CASE, SETTING_NAME_REG_EXP } from '../constants';

// component
import { ModuleContext, Toast, IToast } from 'dart-api';
import { useTranslation } from 'react-i18next';
import { IDBData } from '../utils/DatabaseManager';


/***********
 * Dialog Screen
 ***********/
export default function EditContent(props: {
    moduleContext: ModuleContext;
    database: IDBData[];
    setChange: (value: boolean) => void;
    currentIndex: number;
    setChangedIndex : (index : number) => void;
    tempStateCallback : (changedTempState: IDBData[]) => void;
}) {
    const { moduleContext, database, setChange, currentIndex, setChangedIndex, tempStateCallback} = props;

    /***********
     * State
     ***********/
    // Current gripper names
    const currentGripperNames = useRef([] as string[]);
    const tempState = useRef([{
        key: 0,
        name: 'string',
        tool: DB_ADD_TOOL,
        write: DB_ADD_WRITE,
        read: DB_ADD_READ,
    },] as IDBData[]);

    // Updated name
    const [gripperName, setGripperName] = useState(['', '', '']);
    const [errorCase, setErrorCase] = useState<SETTING_NAME_ERROR_CASE[]>([SETTING_NAME_ERROR_CASE.NO_ERROR, SETTING_NAME_ERROR_CASE.NO_ERROR, SETTING_NAME_ERROR_CASE.NO_ERROR]);
    const [focusNameIndex, setFocusNameIndex] = useState(null as number | null);
    const draggedItem = useRef(null as number | null);
    const UpdateIndex = useRef(0)

    // New name
    const [addName, setAddName] = useState('');
    const [errorCaseNew, setErrorCaseNew] = useState<SETTING_NAME_ERROR_CASE>(SETTING_NAME_ERROR_CASE.NO_ERROR);
    const [focusNewName, setFocusNewName] = useState(false);

    // translate
    const { t } = useTranslation();

    /***********
     * useEffect
     ***********/
    //Initial state
    useEffect(() => {
        setChange(false);

        // Save current state
        tempState.current = JSON.parse(JSON.stringify(database));
        tempStateCallback(tempState.current);

        UpdateIndex.current = currentIndex;
        setChangedIndex(currentIndex);

        // initial current error array

        // 1) get current name 
        let name = [] as string[];
        tempState.current.map((value: IDBData) => {
            name.push(value.name);
        });

        // 2) initial current name
        currentGripperNames.current = name;
        setGripperName(name);
    }, []);

    // check gripper name change
    useEffect(() => {
        // check error case
        let errors = checkError(gripperName);
        setErrorCase(errors);

        // If changed gripper name is empty or not changed, return false
        if (
            gripperName.some((name: string) => name === '') ||
            JSON.stringify(gripperName) === JSON.stringify(currentGripperNames.current) ||
            errors.some((error: number) => error !== 0)
        ) {
            setChange(false);
        } else {
            setChange(true);
        }
    }, [gripperName]);

    // check new gripper name change
    useEffect(() => {
        // check error case
        let error = checkErrorNew(addName);
        setErrorCaseNew(error);
    }, [addName]);

    /***************
     * Name array
     ***************/

    // change name
    const onChangeName = (value: string, index: number) => {
        let names = [...gripperName];
        names[index] = value;
        setGripperName(names);

        // change array
        tempState.current.map((array: IDBData) => {
            if (array.key === index) {
                tempState.current[index].name = value;
            }
        });

        tempStateCallback(tempState.current);
    };

    // check error state
    const checkError = (names: string[]) => {
        let errors = [] as number[];
        names.map((value: string) => {
            // If name is empty, return no error (Wait name enter...)
            if (value === '') {
                errors.push(SETTING_NAME_ERROR_CASE.NO_ERROR)
            }
            // length over 30
            else if (value.length > 30) {
                errors.push(SETTING_NAME_ERROR_CASE.OVER_LENGTH);
            }
            // value equal
            else if (names.filter((name) => name === value).length >= 2) {
                errors.push(SETTING_NAME_ERROR_CASE.DUPLICATE);
            }
            // check reg exp
            else if (!SETTING_NAME_REG_EXP.test(value)) {
                errors.push(SETTING_NAME_ERROR_CASE.ONLY_ENG);
            }
            // no error
            else {
                errors.push(SETTING_NAME_ERROR_CASE.NO_ERROR);
            }
        });

        setErrorCase(errors);

        return errors;
    };

    // print error state
    const errorPrint = (index: number) => {
        switch (errorCase[index]) {
            case SETTING_NAME_ERROR_CASE.DUPLICATE: // name duplicate
                return t('Dialog_error_message_001', {
                    ns: moduleContext.packageName,
                });
            case SETTING_NAME_ERROR_CASE.OVER_LENGTH: // length over
                return t('Dialog_error_message_002', {
                    ns: moduleContext.packageName,
                });
            case SETTING_NAME_ERROR_CASE.ONLY_ENG: // not eng, num, _
                return t('Dialog_error_message_003', {
                    ns: moduleContext.packageName,
                });
            default:
                return '';
        }
    };

    // erase current name
    const onClickEraseName = (index: number) => {
        let names = [...gripperName];
        names[index] = '';
        setGripperName(names);

        // change array
        tempState.current.map((array: IDBData) => {
            if (array.key === index) {
                tempState.current[index].name = '';
            }
        });
        tempStateCallback(tempState.current);

        // erase error message
        let errors = [...errorCase];
        errors[index] = 0;
        setErrorCase(errors);
    };

    // delete selected index
    const onClickDelete = (index: number) => {
        // If current selected setting delete, go to first page
        if (index === UpdateIndex.current) {
            UpdateIndex.current = 0;
            setChangedIndex(0);
        }

        // 1) get names and errors except deleted names
        let names = gripperName.filter((_: string, value_index: number) => index !== value_index);
        setGripperName(names);

        let errors = errorCase.filter((_: number, value_index: number) => index !== value_index);
        setErrorCase(errors);

        // 2) delete array and change curernt key
        let changedTempState = tempState.current.filter((_: IDBData, value_index: number) => index !== value_index);

        changedTempState.map((tempStateData: IDBData, tempStateindex: number) => {
            // If current selected setting moved, go to there.
            if (tempStateData.key === currentIndex) {
                UpdateIndex.current = tempStateindex;
                setChangedIndex(tempStateindex);
            }

            changedTempState[tempStateindex].key = tempStateindex;
        });

        tempState.current = changedTempState;
        tempStateCallback(tempState.current);
    };

    /***************
     * New name
     ***************/

    // change new name
    const onChangeNewName = (value: string) => {
        setAddName(value);
    };

    // add new name
    const onClickAddName = (value: string) => {
        let names = [...gripperName];

        // If database limit, return it.
        if (names.length === DB_MAX_LENGTH) {
            Toast.show(IToast.TYPE_INFO, `Maximum Length`, `You can not add more.`, false);
            return;
        }

        // 1) add name and error array
        names.push(value);
        setGripperName(names);

        let errors = [...errorCase];
        errors.push(0);
        setErrorCase(errors);

        // add new array
        const data = {
            key: gripperName.length,
            name: names[gripperName.length],
            tool: DB_ADD_TOOL,
            write: DB_ADD_WRITE,
            read: DB_ADD_READ,
        };
        tempState.current.push(data);
        tempStateCallback(tempState.current);
        
        setAddName('');
    };

    // erase new name
    const onClickEraseNewName = () => {
        setAddName('');
    };

    // check error state
    const checkErrorNew = (name: string) => {
        // If name is empty, return no error (Wait name enter...)
        if (name === '') {
            return SETTING_NAME_ERROR_CASE.NO_ERROR
        }

        // length over 30
        if (name.length > 30) {
            return SETTING_NAME_ERROR_CASE.OVER_LENGTH
        }
        // value equal
        else if (gripperName.filter((existName: string) => existName === name).length >= 1) {
            return SETTING_NAME_ERROR_CASE.DUPLICATE
        }
        // check reg exp
        else if (!SETTING_NAME_REG_EXP.test(name)) {
            return SETTING_NAME_ERROR_CASE.ONLY_ENG
        }
        // no error
        else {
            return SETTING_NAME_ERROR_CASE.NO_ERROR
        }
    };

    // print error state
    const errorPrintNew = () => {
        switch (errorCaseNew) {
            case SETTING_NAME_ERROR_CASE.DUPLICATE: // name duplicate
                return t('Dialog_error_message_001', {
                    ns: moduleContext.packageName,
                });
            case SETTING_NAME_ERROR_CASE.OVER_LENGTH: // length over
                return t('Dialog_error_message_002', {
                    ns: moduleContext.packageName,
                });
            case SETTING_NAME_ERROR_CASE.ONLY_ENG: // length over
                return t('Dialog_error_message_003', {
                    ns: moduleContext.packageName,
                });
            default:
                return '';
        }
    };

    /***************
     * Drag Event
     ***************/
    const handleDragStart = (e: React.DragEvent, index: number) => {
        draggedItem.current = index;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItem.current !== null) {
            //Change name
            let names = [...gripperName];
            names.splice(draggedItem.current, 1);
            names.splice(index, 0, gripperName[draggedItem.current]);
            setGripperName(names);

            // Change db array
            let changedState = [...tempState.current];
            changedState.splice(draggedItem.current, 1);
            changedState.splice(index, 0, tempState.current[draggedItem.current]);
            tempState.current = changedState;
            tempStateCallback(tempState.current);

            // Change current index
            draggedItem.current = index;
        }
    };

    const handleDragEnd = () => {
        draggedItem.current = null;
    };

    /***************
     * render
     ***************/
    return (
        <ThemeProvider theme={moduleContext.systemTheme}>
            <div className={styles['dialog-container']}>
                <ul className={styles['dialog-item-list']}>
                    {/* Gripper names */}
                    {gripperName.map((name: string, index: number) => (
                        <li
                            className={styles['dialog-item']}
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            <Menu />
                            <FormControl
                                className={styles['inputbox']}
                                fullWidth={true}
                                sx={{
                                    'width': '100%',
                                }}
                            >
                                <InputLabel
                                    shrink={false}
                                    sx={{
                                        'fontSize': '14px',
                                        'textAlign': 'center',
                                        'textOverflow': 'clip',
                                        'overflow': 'hidden',
                                    }}
                                >
                                    {t('Dialog_message_003', {
                                        ns: moduleContext.packageName,
                                    })}
                                </InputLabel>
                                <TextField
                                    size={'medium'}
                                    value={name}
                                    placeholder={currentGripperNames.current[index]}
                                    onFocus={() => {
                                        setFocusNameIndex(index);
                                    }}
                                    onBlur={() => {
                                        setFocusNameIndex(null);
                                    }}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                        onChangeName(event.target.value, index)
                                    }
                                    error={errorCase[index] !== SETTING_NAME_ERROR_CASE.NO_ERROR}
                                    helperText={errorPrint(index)}
                                    sx={
                                        name === ''
                                            ? {
                                                '.MuiInputBase-root': {
                                                    'width': '517px',
                                                },
                                            }
                                            : {
                                                '& .Mui-focused': {
                                                    'fontWeight': 'bold',
                                                },
                                                '.MuiInputBase-root': {
                                                    'width': '517px',
                                                },
                                            }
                                    }
                                    InputProps={
                                        focusNameIndex === index
                                            ? {
                                                'endAdornment': (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="delete"
                                                            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) =>
                                                                e.preventDefault()
                                                            }
                                                            onClick={() => {
                                                                onClickEraseName(index);
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
                            </FormControl>
                            <Button
                                className={styles['button']}
                                onClick={() => onClickDelete(index)}
                                disabled={gripperName.length === 1 ? true : false}
                                variant="outlined"
                                sx={{
                                    'border': '1',
                                    'borderColor': '#8498A899',
                                    '&.Mui-disabled': {
                                        background: '#e9e9e9ff',
                                    },
                                }}
                            >
                                <Delete />
                            </Button>
                        </li>
                    ))}
                    {/* New Gripper names */}
                    <li className={`${styles['dialog-item']} ${styles['new']}`}>
                        <FormControl
                            className={styles['inputbox']}
                            fullWidth={true}
                            sx={{
                                'marginLeft': '8px',
                            }}
                        >
                            <InputLabel
                                shrink={false}
                                sx={{
                                    'fontSize': '14px',
                                    'textAlign': 'center',
                                    'textOverflow': 'clip',
                                    'overflow': 'hidden',
                                }}
                            >
                                {t('Dialog_message_004', {
                                    ns: moduleContext.packageName,
                                })}
                            </InputLabel>
                            <TextField
                                size={'medium'}
                                placeholder={t('Dialog_message_002', {
                                    ns: moduleContext.packageName,
                                })}
                                value={addName}
                                onFocus={() => {
                                    setFocusNewName(true);
                                }}
                                onBlur={() => {
                                    setFocusNewName(false);
                                }}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    onChangeNewName(event.target.value)
                                }
                                error={errorCaseNew !== SETTING_NAME_ERROR_CASE.NO_ERROR}
                                helperText={errorPrintNew()}
                                sx={
                                    addName === ''
                                        ? {
                                            '.MuiInputBase-root': {
                                                'width': '554px',
                                            },
                                        }
                                        : {
                                            '& .Mui-focused': {
                                                'fontWeight': 'bold',
                                            },
                                            '.MuiInputBase-root': {
                                                'width': '554px',
                                            },
                                        }
                                }
                                InputProps={
                                    focusNewName
                                        ? {
                                            'endAdornment': (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="delete"
                                                        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) =>
                                                            e.preventDefault()
                                                        }
                                                        onClick={() => {
                                                            onClickEraseNewName();
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
                        </FormControl>
                        <Button
                            className={styles['button']}
                            onClick={() => onClickAddName(addName)}
                            disabled={ (addName === '' || errorCaseNew !== SETTING_NAME_ERROR_CASE.NO_ERROR) ? true : false}
                            variant="outlined"
                            sx={{
                                'border': '1',
                                'borderColor': '#8498A899',
                                '&.Mui-disabled': {
                                    background: '#e9e9e9ff',
                                },
                            }}
                        >
                            <Plus />
                        </Button>
                    </li>
                </ul>
            </div>
        </ThemeProvider>
    );
}
