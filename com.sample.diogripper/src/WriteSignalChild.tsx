/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */
import React, { Component } from 'react';
import { SignalChild, SignalWrite } from './types';
import {
  Typography,
  Button,
  TableCell,
  TableRow,
  IconButton,
  SvgIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import DeleteIcon from './assets/images/delete-icon.svg';

interface SignalChildRowProps {
  rowChild: SignalChild;
  idx: number;
  row: SignalWrite;
  index: number;
  onChangeSelectPort: (value: string | unknown, index: number, indexParent: number) => void;
  onClickButton: (value: boolean, index: number, indexParent: number) => void;
  deleteChildRow: (indexParent: number, index: number) => void;
}

interface Option {
  label: string;
  value: string;
}

export default class WriteSignalsChild extends Component<SignalChildRowProps> {
  render(): React.ReactNode {
    const { rowChild, idx, row, index, onChangeSelectPort, onClickButton, deleteChildRow } = this.props;
    return (
      <>
      <TableRow
        sx={{
          '&:last-child td, &:last-child th': { border: 0 },
          backgroundColor: '#FAFAFB',
        }}
        key={index}
      >
        <>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell component="th" scope="row">
            <Select
              value={rowChild.portNo}
              onChange={(e: SelectChangeEvent<unknown>) => onChangeSelectPort(e.target.value, idx, index)}
              sx={{
                width: '100%',
                height: '32px',
              }}
            >
              {row.optionPortNo.map((opt: Option, index: number) => {
                const isValue = opt.value !== '(Empty)';
                return (
                  <MenuItem selected={!isValue} key={index} value={opt.value}>
                    {isValue ? opt.label : <Typography sx={{ color: '#959595;' }}> {opt.label} </Typography>}
                  </MenuItem>
                );
              })}
            </Select>
          </TableCell>

          <TableCell component="th" scope="row">
            <Button
              className="button-test"
              sx={{
                width: '45%',
                color: rowChild.test ? '#007FF5' : '#2E3745',
                borderColor: rowChild.test ? '#007FF5' : '#D7DCE0',
                height: '32px',
                marginRight: '10%',
              }}
              variant="outlined"
              onClick={() => onClickButton(true, idx, index)}
            >
              On
            </Button>
            <Button
              className="button-test"
              sx={{
                width: '45%',
                color: !rowChild.test ? '#007FF5' : '#2E3745',
                borderColor: !rowChild.test ? '#007FF5' : '#D7DCE0',
                height: '32px',
              }}
              variant="outlined"
              onClick={() => onClickButton(false, idx, index)}
            >
              Off
            </Button>
          </TableCell>
        </>
      </TableRow>
      </>
    );
  }
}
