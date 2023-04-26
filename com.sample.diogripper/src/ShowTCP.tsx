/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { ModuleContext } from 'dart-api';
import { Button, Grid, TextField, Typography } from '@mui/material';
import React from 'react';
import styles from './assets/styles/styles.scss';
import { SixNumArray } from '../libs/dart-api/dart-api';
import { ToolType } from './types';

const ShowTCP = (props: {selectedTool: ToolType; onClickSetTCP: Function; updateTcp: Function }) => {
    const { selectedTool } = props;
    const handleClick = () => {
        props.onClickSetTCP();
    };
    const poseText = ['X','Y','Z','A','B','C']
    const onChangePose = (event: React.ChangeEvent<HTMLInputElement>) => {
        const index = event.target.name;
        const value = event.target.value == undefined || null ? 0 : event.target.value;
        let newPose = [...selectedTool.tcpParam.tcp.targetPose]
        newPose[Number(index)] = value
        
        props.updateTcp({
            ...selectedTool.tcpParam,
            tcp: {
                targetPose : newPose
            }
        })
    };

    return (
        <>
            <Typography variant="body1" className={`${styles['main-screen-label']}`}>
                Set TCP
            </Typography>

            <Grid
                container
                style={{
                    flexWrap: 'nowrap',
                    paddingBottom: '5vh',
                }}
                spacing={2}
            >
                <Grid
                    item
                    xs={4}
                    style={{
                        flexGrow: 1,
                    }}
                >
                    <TextField
                        label={'tool name'}
                        value={selectedTool.tcpParam.symbol}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            props.updateTcp({
                                ...selectedTool.tcpParam,
                                symbol: event.target.value
                            })
                        }}
                    />
                </Grid>
                {selectedTool.tcpParam.tcp.targetPose.map((pos:Number, index:number) => (
                    <Grid
                        item
                        xs={4}
                        style={{
                            flexGrow: 1,
                        }}
                    >
                        <TextField
                            label={poseText[index]}
                            name={index}
                            value={pos}
                            onChange={onChangePose}
                        />
                    </Grid>
                ))}
                <Grid
                    item
                    xs={4}
                    style={{
                        alignSelf: 'flex-end',
                        textAlign: 'right',
                    }}
                >
                    <Button
                        style={{
                            width: '10em',
                        }}
                        onClick={handleClick}
                    >
                        Add TCP
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};
export default ShowTCP;
