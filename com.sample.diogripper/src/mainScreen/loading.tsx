/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */

/*********
 * loading.tsx
 *********
 * - Show circular progress when loading
 *********/
import React from 'react';
import { CircularProgress } from '@mui/material';

interface LoadingPorps {
    hidden: boolean;
}

function Loading(props: LoadingPorps) {
    const { hidden } = props;

    return (
        <div hidden={hidden}>
            <CircularProgress
                sx={{
                    'opacity': 0.9,
                    'position': 'absolute',
                    'right': '50%',
                    'top': '50%',
                }}
                size="100px"
            />
        </div>
    );
}

export default React.memo(Loading);