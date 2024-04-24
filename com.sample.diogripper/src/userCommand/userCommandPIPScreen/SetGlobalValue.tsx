/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */

/*********
 * SetGlobalValue.tsx
 *********
 * - Select global value for user command return value.
 *********/

// style
import React, { useState, useEffect } from 'react';
import {
    MenuItem,
    Select,
    SelectChangeEvent,
    FormControl,
    FormLabel,
    FormGroup,
    Typography,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Container,
} from '@mui/material';

// component
import { MonitoringVariable, IToast, Toast } from 'dart-api';


const divisionName = ['system', 'global'];
const typeName = ['bool', 'int', 'float', 'string', 'posj', 'posx', 'array', 'unknown'];

const noSelectName = 'Unselected';
export const noSelectData = {
    name: noSelectName,
    division: 0,
    type: 0,
    data: '',
} as MonitoringVariable;

interface setReturnValueProps {
    isUse: boolean;
    globalValues: MonitoringVariable[];
    selectedValue: string;
    ChangeGlobalValue: (GlobalValue: string) => void;
}

function SetGlobalValue (props: setReturnValueProps) {
    const { isUse, globalValues, selectedValue, ChangeGlobalValue } = props;

    const [editorValueList, setEditorValueList] = useState([] as MonitoringVariable[]);
    const [editorValue, setEditorValue] = useState('');

    const [valueList, setValueList] = useState([{ ...noSelectData }] as MonitoringVariable[]);
    const [valueData, setValueData] = useState({ ...noSelectData } as MonitoringVariable);

    const [isInitialed, setInitial] = useState(false);

    // select type that use return value
    //bool: 0, int: 1, flaot: 2, string: 3, posj: 4, posx: 5, list: 6, unknonwn: 7
    const selectedType = [0, 1, 2, 3, 7] as Number[];

    useEffect(() => {
        if (JSON.stringify(globalValues) !== JSON.stringify(editorValueList)) {
            setEditorValueList(globalValues);
        }

        if (JSON.stringify(selectedValue) !== JSON.stringify(editorValue)) {
            setEditorValue(selectedValue);
        }
    }, [globalValues, selectedValue]);

    // check globalValues change
    useEffect(() => {
        if (isInitialed) {
            // If global values not empty, change it.
            let valueArray = [] as MonitoringVariable[];
            globalValues.map((globalValue: MonitoringVariable) => {
                if (selectedType.includes(globalValue.type)) {
                    valueArray.push(globalValue);
                }
            });
            setValueList(valueArray);
        } else {
            // If first start, not updated
            setInitial(true);
        }
    }, [editorValueList]);

    // Check Current selected Value
    useEffect(() => {
        // Check valueList is initial value
        if (JSON.stringify(valueList) !== JSON.stringify([noSelectData])) {
            let find = false;

            if (editorValue !== '') {
                valueList.map((value: MonitoringVariable) => {
                    if (value.name === editorValue && !find) {
                        // If selected value's name is in value list, set data.
                        setValueData(value);
                        find = true;
                    }
                });
            }

            // If there is no global value, set empty data
            if (!find) {
                setValueData(noSelectData);
                ChangeGlobalValue('');
            }
        }
    }, [editorValue, valueList]);

    // Select Global Value
    const handleChangeGlobalValue = (e: SelectChangeEvent) => {
        if (e.target.value === noSelectName) {
            ChangeGlobalValue('');
        } else {
            ChangeGlobalValue(e.target.value);
        }
        Toast.show(IToast.TYPE_SUCCESS, 'Success', 'Global Value Selected', false);
    };

    return (
        <Container style={{ paddingLeft: '10px', paddingRight: '10px' }}>
            <FormControl sx={isUse ? { display: 'flex' } : { display: 'none' }}>
                <FormLabel>
                    <Typography
                        id="typography_8aee"
                        sx={{
                            'fontSize': '26px',
                            'fontWeight': 'bold',
                            'marginBottom': '10px',
                            'marginLeft': '10px',
                            'marginTop': '10px',
                            'textAlign': 'center',
                        }}
                    >
                        Select Return Value
                    </Typography>
                </FormLabel>
                <FormGroup
                    sx={{
                        'width': '100%',
                    }}
                >
                    <Select
                        value={valueData.name}
                        onChange={handleChangeGlobalValue}
                        label="Select Global Value.."
                        sx={{
                            'width': '100%',
                        }}
                    >
                        <MenuItem value={noSelectName}>{noSelectName}</MenuItem>
                        {valueList.map((globalvalue: MonitoringVariable, index: Number) => (
                            <MenuItem key={index} value={globalvalue.name}>
                                {globalvalue.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormGroup>
                <TableContainer component={Paper}>
                    <Table sx={{}} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ textAlign: 'center' }}>Division</TableCell>
                                <TableCell style={{ textAlign: 'center' }}>Type</TableCell>
                                <TableCell style={{ textAlign: 'center' }}>Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {valueData.name === noSelectName ? (
                                <TableRow>
                                    <TableCell style={{ textAlign: 'center' }}>No data available</TableCell>
                                </TableRow>
                            ) : (
                                <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell style={{ textAlign: 'center' }}>
                                        {divisionName[valueData.division]}
                                    </TableCell>
                                    <TableCell style={{ textAlign: 'center' }}>{typeName[valueData.type]}</TableCell>
                                    <TableCell style={{ textAlign: 'center' }}>{valueData.data}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </FormControl>
        </Container>
    );
}

export default SetGlobalValue;