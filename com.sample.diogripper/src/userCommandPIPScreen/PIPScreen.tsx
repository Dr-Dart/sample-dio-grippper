/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import React from 'react';
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
    CircularProgress,
} from '@mui/material';

//UI Setting
import { ThemeProvider } from '@mui/material/styles';
import styles from '../assets/styles/styles.scss';

//Dart-api
import { ModuleScreen, IModuleChannel, Message, ModuleScreenProps, IToast, Toast, logger } from 'dart-api';

//Database manager
import DatabaseManager from '../utils/DatabaseManager';

//Import for Update Value
import { SignalWrite } from '../types';
import { USER_COMMAND_GRASP, USER_COMMAND_RELEASE } from '../constants';

/**
 * A data interface use for Gripper.
 **/
interface GripperUserCommandInfo {
    signalType: string;
    port: string[];
    signal: boolean[];
}


//PIP Screen class
export default class PipScreenForTaskEditor extends ModuleScreen {
    //Use for data change
    private channel = {} as IModuleChannel;
    private gripperUserCommandInfos = [] as GripperUserCommandInfo[]
    /*****
     * Main Life Cycle
     *
     * 1) First Initial
     * Constructor -> render -> ComponentDidMount -> componentDidUpdate -> OnBind
     *
     * 2) SetState occured
     * setstate -> render -> ComponentDidUpdate
     *
     *****/

    //Constructor. Initialize PIP Screen state.
    constructor(props: ModuleScreenProps) {
        super(props);
        this.state = {
            //Use for signal setting of DRL
            indexSelected : 0,
            gripperNames : [] as String[],
            userCommandInfos : {} as GripperUserCommandInfo,
            isDatabaseInitialized : false
        };
        this.handleChange = this.handleChange.bind(this);
        logger.debug(`Constructor Complete`);
    } // constructor

    //ComponentDidMount. Preload DB Data.
    async componentDidMount() {
        logger.debug(`componentDidMount: ${this.moduleContext.componentId}`);

        //get database from Digital IO module
        await this.UpdatePreloadData(() => {
            // Update data recieved from Task Editor
            // AS-IS. Currently, savedData is sent on onBind.
            // TO-BE. After that, saved data should be read at componentDidMount timing.
            if (this.message.data?.hasOwnProperty('savedData')) {
                const version = this.message.data['savedVersion'];
                const data = this.message.data['savedData'];
                if (data != null) {
                    logger.debug(`saved data detected : ${JSON.stringify(data)}`);

                    this.setState({
                        userCommandInfos : data.userCommandInfos,
                        indexSelected : data.indexSelected,
                    });
                }
            }
        });
    } //componentDidMount

    // OnBind. When Task Editor save Task, Send saved data.
    onBind(message: Message, channel: IModuleChannel): boolean {
        this.channel = channel;
        logger.debug(`PIP Screen onBind: ${this.moduleContext.componentId}`);

        //message.data?.hasOwnProperty('savedData')

        // AS-IS. Currently, savedData is sent on onBind.
        // 1. If savedData detected in message, Update PiP Screen value.
        if (message.data?.hasOwnProperty('savedData')) {
            const version = message.data['savedVersion'];
            const data = message.data['savedData'];
            if (data != null) {
                logger.debug(`saved data detected : ${JSON.stringify(data)}`);

                this.setState({
                    userCommandInfos : data.userCommandInfos,
                    indexSelected : data.indexSelected,
                });
            }
        } //if message && savedData

        // 2. Make event "get_current_data"
        channel.receive('get_current_data', () => {
            logger.debug(`channel receive : get_current_data`);
            const data: Record<string, any> = {};

            // 3. Update data in PiPScreen
            data['userCommandInfos'] = this.state.userCommandInfos;
            data['indexSelected'] = this.state.indexSelected;

            // 4. Send data to Task Editor
            logger.debug(`Send current data : ${JSON.stringify(data)}`);
            channel.send('get_current_data', data);
        });
        return true;
    } //OnBind

    // ComponentDidUpdate. Occured when state updated.
    componentDidUpdate(prevProps: any, prevState: any) {
        /**************
         * !!!Optional part!!!
         * If SignalData changed, send it to Task Editor
         * You can comment it when you don't want to use it.
         **************/
        if (JSON.stringify(this.state.userCommandInfos) !== JSON.stringify(prevState.userCommandInfos)) {
            logger.debug('componentDidUpdate. state update detected');
            this.dataChange();
        }
    } //ComponentDidUpdate

    //Get State from Database. Use in ComponentDidMount
    UpdatePreloadData = async (onComplete: () => void) => {
        //get database from main screen module
        let infos = [] as GripperUserCommandInfo[];
        let names = [] as String[];
        await DatabaseManager.getDataAll((dataList) => {
            this.gripperUserCommandInfos = dataList.map(data => {
                let signals = data.writeSignals as SignalWrite[]
                logger.debug("getData data:", signals)
                if (signals === null || undefined)
                    return;
                
                //Get Value from Database
                if (this.moduleContext.componentId == 'pip_grasp') {
                    return this.getGripperInfo(signals.find((v: SignalWrite) => v.name === USER_COMMAND_GRASP))
                } else if (this.moduleContext.componentId == 'pip_release') {
                    return this.getGripperInfo(signals.find((v: SignalWrite) => v.name === USER_COMMAND_RELEASE));
                }
            }) as GripperUserCommandInfo[];

            names = dataList.map(v => v.selectedTool.toolName)
        })
        .then(() => {
            this.setState({
                gripperNames : names,
                userCommandInfos : this.gripperUserCommandInfos[this.state.indexSelected],
                isDatabaseInitialized : true,
            }) 
            onComplete();
        });
    };

    //Select Tool setting list event. Use in render(select.onchange)
    handleChange = (e: any) => {
        let index = e.target.value;
        this.setState({
            indexSelected : index,
            userCommandInfos : this.gripperUserCommandInfos[index],
        }, () =>{
            Toast.show(IToast.TYPE_SUCCESS, 'Success', 'Data Load Success', false);
        });
        
        this.dataChange()
    }; //handlechange

    //Send changed data to Task Editor. Use in ComponentDidUpdate
    //This function is OPTINAL !!!
    dataChange = () => {
        if (this.channel.send !== undefined) {
            logger.debug('data_changed');
            const data: Record<string, any> = {};

            // 3. Update data in PiPScreen
            data['userCommandInfos'] = this.state.userCommandInfos;
            data['indexSelected'] = this.state.indexSelected;

            // 4. Send data to Task Editor
            logger.debug(`Send current data : ${JSON.stringify(data)}`);
            this.channel.send('data_changed', data);
        }
    };

     /**
     * A function use to get Gripper value
     **/
    getGripperInfo = (writeSignals: SignalWrite) => {
        return {
            signalType: writeSignals.signalType,
            port: writeSignals.writeSignalsChild.map(v => v.portNo),
            signal: writeSignals.writeSignalsChild.map(v => v.test),
        } as GripperUserCommandInfo;
    }

    /*****
     * Render Screen UI
     * Please make PiP Screen interface in the ThemeProvider. It'll make default design of PiP Screen.
     *****/
    render() {
        const { indexSelected , gripperNames, userCommandInfos } = this.state;
        if (!this.state.isDatabaseInitialized) {
            return (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                    }}
                >
                    <CircularProgress />
                </div>
            );
        } else {
            return (
                <ThemeProvider theme={this.systemTheme}>
                    <Container>
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
                                    'marginBottom': '10px',
                                    'marginLeft': '20px',
                                    'marginTop': '10px',
                                    'textAlign': 'center',
                                }}
                            >
                                Select DIO Gripper
                            </Typography>
                        </Grid>
                        <Grid
                            item
                            sx={{
                                'width': '100%',
                            }}
                        >
                            <Select
                                value={this.state.indexSelected}
                                onChange={(e) => this.handleChange(e)}
                                sx={{
                                    'width': '100%',
                                }}
                            >
                                {gripperNames.map((name: string, index: number) => (
                                    <MenuItem name={name} value={index}>
                                        {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <TableContainer className={`${styles['table-container']}`}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="100%" className={`${styles['first-thead-cell']}`}>
                                            {' '}
                                            Preparation
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
                                                Before you start, You have to set 'tool weight' and 'TCP(Tool Center
                                                Position).
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
                                                {' '}
                                                - Case 1. Use Tool setting in the upper right corner. You have to change
                                                level to 'Manual Level'.
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
                                                {' '}
                                                - Case 2. Use 'set' command in the Command list. You can find it in the
                                                'Other' category.{' '}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow></TableRow>
                                    <TableRow></TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TableContainer className={`${styles['table-container']}`}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="100%" className={`${styles['first-thead-cell']}`}>
                                            Signal Type
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell width="100%">{userCommandInfos?.signalType}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TableContainer className={`${styles['table-container']}`}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="25%" className={`${styles['first-thead-cell']}`}>
                                            Port No.
                                        </TableCell>
                                        <TableCell width="25%" className={`${styles['first-thead-cell']}`}>
                                            Signal
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {userCommandInfos?.port.map((port : string, index : number) =>(
                                        <TableRow>
                                            <TableCell width="25%">{port}</TableCell>
                                            <TableCell width="25%">{JSON.stringify(userCommandInfos.signal[index])}</TableCell>
                                        </TableRow>
                                    ))}                                  
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Container>
                </ThemeProvider>
            );
        }
    }
}
