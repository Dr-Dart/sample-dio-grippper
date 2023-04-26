/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { ModuleContext } from 'dart-api';
import { Button, Grid, TextField, Typography } from '@mui/material';
import React from 'react';
import styles from './assets/styles/styles.scss';
import { ToolType } from './types';

const ShowToolWeight = (props: { selectedTool: ToolType; onClickSetToolWeight: Function; updateToolWeight : Function }) => {
    const { selectedTool } = props;
    const handleClick = () => {
        props.onClickSetToolWeight();
    };
    const cogText = ['Cx','Cy','Cz']
    const onChangeCog = (event: React.ChangeEvent<HTMLInputElement>) => {
        const index = event.target.name;
        const value = event.target.value == undefined || null ? 0 : event.target.value;
        let newCog = [...selectedTool.toolWeightParam.tool.cog]
        newCog[Number(index)] = value

        props.updateToolWeight({
            ...selectedTool.toolWeightParam,
            tool: {
                ...selectedTool.toolWeightParam.tool,
                cog : newCog
            }
        })
    };

    return (
        <>
            <Typography variant="body1" className={`${styles['main-screen-label']}`}>
                Set Tool Weight
            </Typography>
            <Grid
                container
                style={{
                    flexWrap: 'nowrap',
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
                        label={'tool weight name'}
                        value={selectedTool.toolWeightParam.symbol}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            props.updateToolWeight({
                                ...selectedTool.toolWeightParam,
                                symbol : event.target.value
                            })
                        }}
                    />
                </Grid>
                <Grid
                    item
                    xs={4}
                    style={{
                        flexGrow: 1,
                    }}
                >
                    <TextField
                        label={'tool weight'}
                        value={selectedTool.toolWeightParam.tool.weight}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            props.updateToolWeight({
                                ...selectedTool.toolWeightParam,
                                tool:{
                                    ...selectedTool.toolWeightParam.tool,
                                    weight : event.target.value
                                }
                            })
                        }}
                    />
                </Grid>
                {selectedTool.toolWeightParam.tool.cog.map((cog:Number, index:number) => (
                    <Grid
                        item
                        xs={4}
                        style={{
                            flexGrow: 1,
                        }}
                    >
                        <TextField
                            label={cogText[index]}
                            name={index}
                            value={cog}
                            onChange={onChangeCog}
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
                        Add TOOL Weight
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};
export default ShowToolWeight;
