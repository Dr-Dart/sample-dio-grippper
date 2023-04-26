/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */
import React, { Component } from 'react';
import styles from './assets/styles/styles.scss';
import { SignalChild, SignalWrite } from './types';
import {
  Typography,
  Button,
  TableCell,
  TableRow,
  IconButton,
  TextField,
  SvgIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import DeleteIcon from './assets/images/delete-icon.svg';
import NextIcon from './assets/images/next-icon.svg';
import CommonAddIcon from './assets/images/add-icon.svg';
import { CONTROLLER_DIGITAL_OUT, SIGNAL_WRITE_TYPE } from './constants';
import WriteSignalsChild from './WriteSignalChild';

interface SignalRowProps {
  row: SignalWrite;
  index: number;
  deleteWriteSignal: (index: number) => void;
  onChangeInput: (value: string, index: number, signal: 'SignalWrite' | 'SignalRead') => void;
  onBlur: (index: number, type: 'SignalWrite' | 'SignalRead') => void;
  onChangeSelect: (value: string | unknown, index: number, signal: 'SignalWrite' | 'SignalRead') => void;
  addChildRow: (index: number) => void;
  handleCallApi: (index: number) => void;
  deleteChildRow: (indexParent: number, index: number) => void;
  onChangeSelectPort: (value: string | unknown, index: number, indexParent: number) => void;
  onClickButton: (value: boolean, index: number, indexParent: number) => void;
}

interface Option {
  label: string;
  value: string;
}

export default class WriteSignal extends Component<SignalRowProps> {
  render(): React.ReactNode {
    const {
      row,
      index,
      deleteWriteSignal,
      onChangeInput,
      onBlur,
      onChangeSelect,
      addChildRow,
      handleCallApi,
      deleteChildRow,
      onChangeSelectPort,
      onClickButton,
    } = this.props;
    return (
      <>
        <TableRow className={`${styles['table-row']}`}>
          <TableCell component="th" scope="row">
            <IconButton sx={{ display : 'none' }} onClick={() => deleteWriteSignal(index)}>
              <SvgIcon sx={{ fontSize: '24px' }} component={DeleteIcon} inheritViewBox></SvgIcon>
            </IconButton>
            <TextField
              value={row.name}
              onChange={(e) => onChangeInput(e.target.value, index, 'SignalWrite')}
              onBlur={() => onBlur(index, 'SignalWrite')}
              error={!!row.errors.length}
              helperText={row.errors.map((e: string) => {
                return (
                  <>
                    <Typography display="block">{e}</Typography>
                  </>
                );
              })}
              sx={{
                maxWidth: '464px',
                marginLeft: '19px',
                width: '80%',
              }}
              inputProps={{
                height: '32px',
              }}
            />
          </TableCell>
          <TableCell component="th" scope="row">
            <Select
              onChange={(e: SelectChangeEvent<unknown>) => onChangeSelect(e.target.value, index, 'SignalWrite')}
              value={row.signalType}
              sx={{
                width: '80%',
                height: '32px',
              }}
            >
              {SIGNAL_WRITE_TYPE.map((opt: Option, index: number) => {
                const isValue = opt.value !== CONTROLLER_DIGITAL_OUT;
                return (
                  <MenuItem selected={!isValue} key={index} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                );
              })}
            </Select>
          </TableCell>
          <TableCell component="th" scope="row">
            <Button sx = {{display : 'none'}} variant="outlined" className={`${styles['button-add-child']}`} onClick={() => addChildRow(index)}>
              <SvgIcon component={CommonAddIcon} />
              <Typography>Add</Typography>
            </Button>
          </TableCell>
          <TableCell component="th" scope="row">
            <Button
              variant="outlined"
              className={
                !(!row.name || row.errors.length ? true : false)
                  ? `${styles['button-add-child']}`
                  : `${styles['button-add-child-disable']}`
              }
              onClick={() => handleCallApi(index)}
              disabled={!row.name || row.errors.length ? true : false}
            >
              <SvgIcon component={NextIcon} /> <Typography>Send</Typography>
            </Button>
          </TableCell>
        </TableRow>
        {row.writeSignalsChild.map((rowChild: SignalChild, idx: number) => (
          <WriteSignalsChild
            key={idx}
            rowChild={rowChild}
            idx={idx}
            row={row}
            index={index}
            onChangeSelectPort={onChangeSelectPort}
            onClickButton={onClickButton}
            deleteChildRow={deleteChildRow}
          />
        ))}
      </>
    );
  }
}
