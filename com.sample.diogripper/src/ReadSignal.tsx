/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import React, { Component } from 'react';
import styles from './assets/styles/styles.scss';
import { SignalRead } from './types';
import {
  Typography,
  TableCell,
  TableRow,
  IconButton,
  TextField,
  SvgIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
  Container,
} from '@mui/material';
import DeleteIcon from './assets/images/delete-icon.svg';
import ConnectIcon from './assets/images/connect-icon.svg';
import DisconnectIcon from './assets/images/disconnect-icon.svg';
import { SIGNAL_READ_TYPE } from './constants';
interface SignalRowProps {
  row: SignalRead;
  index: number;
  onChangeInput: (value: string, index: number, signal: 'SignalWrite' | 'SignalRead') => void;
  onBlur: (index: number, type: 'SignalWrite' | 'SignalRead') => void;
  onChangeSelect: (value: string | unknown, index: number, signal: 'SignalWrite' | 'SignalRead') => void;
  onChangeSelectPortRead: (value: string | unknown, index: number) => void;
  deleteReadSignal: (id: number) => void;
}

interface Option {
  label: string;
  value: string;
}

export default class ReadSignal extends Component<SignalRowProps> {
  render(): React.ReactNode {
    const { row, index, onChangeInput, onBlur, onChangeSelect, onChangeSelectPortRead, deleteReadSignal } = this.props;
    return (
      <>
        <TableRow className={`${styles['table-row']}`}>
          <TableCell component="th" scope="row">
            <IconButton onClick={() => deleteReadSignal(index)}>
              <SvgIcon sx={{ fontSize: '24px' }} component={DeleteIcon} inheritViewBox></SvgIcon>
            </IconButton>
            <TextField
              className="text-field"
              value={row.name}
              onChange={(e) => onChangeInput(e.target.value, index, 'SignalRead')}
              onBlur={() => onBlur(index, 'SignalRead')}
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
              onChange={(e: SelectChangeEvent<unknown>) => onChangeSelect(e.target.value, index, 'SignalRead')}
              value={row.signalType}
              sx={{
                width: '80%',
                height: '32px',
              }}
            >
              {SIGNAL_READ_TYPE.map((opt: Option, index: number) => {
                return (
                  <MenuItem key={index} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                );
              })}
            </Select>
          </TableCell>
          <TableCell component="th" scope="row">
            <Select
              value={row.portNo}
              onChange={(e: SelectChangeEvent<unknown>) => onChangeSelectPortRead(e.target.value, index)}
              sx={{
                width: '80%',
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
            <Container className={`${styles['status-container']}`}>
              {row.statusConnect ? <SvgIcon component={ConnectIcon} /> : <SvgIcon component={DisconnectIcon} />}
              <Typography>{row.statusConnect ? 'On' : 'Off'}</Typography>
            </Container>
          </TableCell>
        </TableRow>
      </>
    );
  }
}
