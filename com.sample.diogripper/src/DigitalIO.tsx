/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable sonarjs/no-unused-collection */
/* eslint-disable no-magic-numbers */
import React from 'react';
import styles from './assets/styles/styles.scss';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    SvgIcon,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Replay, Save } from '@mui/icons-material';
import { SignalWrite, SignalRead, SignalChild, GripperInfo, ToolType } from './types';
import {
    CONTROLLER_DIGITAL_IN,
    CONTROLLER_DIGITAL_OUT,
    DEFAULT_CHILD_SIGNAL,
    DEFAULT_READ_SIGNAL,
    DEFAULT_WRITE_SIGNAL,
    FLANGE_DIGITAL_IN,
    FLANGE_DIGITAL_OUT,
    INIT_TOOL_VALUE,
    SignalNameRegex,
} from './constants';
import CommonAddIcon from './assets/images/add-icon.svg';
import SuccessIcon from './assets/images/success-icon.svg';
import ErrorIcon from './assets/images/error-icon.svg';
import CloseIcon from '@mui/icons-material/Close';
import WriteSignal from './WriteSignal';
import ReadSignal from './ReadSignal';
import {
    Context,
    GpioControlBoxDigitalIndex,
    GpioFlangeDigitalIndex,
    ICommunicationManager,
    IToast,
    IRobotParameterManager,
    logger,
    ModuleContext,
    Toast,
} from 'dart-api';
import { errorMessages } from './errorMessage';
import DatabaseManager from './utils/DatabaseManager';
import ShowTCP from './ShowTCP';
import ShowToolWeight from './ShowToolWeight';
import { ToolCenterPoint, ToolWeight } from '../libs/dart-api/dart-api';
interface DeviceState {
    writeSignals: SignalWrite[];
    readSignals: SignalRead[];
    selectedTool: ToolType;
    dialog: {
        title: string;
        content: string;
        isStatus: statusDialog;
    }
    isOpenDialog: boolean;
    robotModel: string;
}
export enum statusDialog {
    success,
    error,
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DeviceProps {
    readonly moduleContext: ModuleContext;
    readonly indexSelected:number;
}
// eslint-disable-next-line @typescript-eslint/ban-types
class DigitalIO extends React.Component<DeviceProps, DeviceState> {
    readonly robotPramManger?: IRobotParameterManager;
    readonly communicationManager?: ICommunicationManager;

    constructor(props: DeviceProps) {
        super(props)
        this.state = {
            writeSignals: [],
            readSignals: [],
            selectedTool: INIT_TOOL_VALUE,
            dialog: {
                title: '',
                content: '',
                isStatus: statusDialog.error,
            },
            robotModel: '',
            isOpenDialog: false,
        } as DeviceState
        
        this.robotPramManger = props.moduleContext.getSystemManager(Context.ROBOT_PARAMETER_MANAGER) as IRobotParameterManager
    }

    async componentDidMount() {
        const loadingBodyStyle = document.body.style;
        loadingBodyStyle.cursor = 'progress';
        loadingBodyStyle.opacity = '0.5';
        await this.updateData(this.props.indexSelected)
        loadingBodyStyle.cursor = '';
        loadingBodyStyle.opacity = '';
        this.updateReadSignalValues()
    }

    componentWillUnmount() {
        this.communicationManager?.dio.flangeInput.unregister(this.props.moduleContext, this.flangeInputChange);
        this.communicationManager?.dio?.input.unregister(this.props.moduleContext, this.controllerInputChange);
    }
    
    async componentDidUpdate(prevProps: Readonly<DeviceProps>, prevState: Readonly<DeviceState>) {
        if (prevProps.indexSelected !== this.props.indexSelected){
            this.updateData(this.props.indexSelected)
        }
    }

    updateData = async(index : number) => {
        await DatabaseManager.getData(index, (data) =>
        {
            this.setState({
                ...data,
                isOpenDialog: false,
            })
        })
    }

    updateReadSignalValues = () => {
        setTimeout(() => {
            if (this.communicationManager?.dio) {
                const flangeInputValue = this.communicationManager?.dio?.flangeInput.value;
                this.flangeInputChange(flangeInputValue)
                const inputValue = this.communicationManager?.dio?.input.value;
                this.controllerInputChange(inputValue)
            }
        }, 100)
    }

    handleFlangeInput = (readSignal: SignalRead, data: number[]) => {
        const index = Number(readSignal.portNo) - 1;
        if (isNaN(index)) {
            return;
        }
        if (data[index] === 1) {
            if (!readSignal.statusConnect) {
                readSignal.statusConnect = true;
            }
        } else {
            if (readSignal.statusConnect) {
                readSignal.statusConnect = false;
            }
        }
        logger.info(
            'API Name: ' +
                'flangeInput ' +
                'Param: ' +
                ' PortNo: ' +
                readSignal.portNo +
                ' Status: ' +
                data[Number(readSignal.portNo) - 1],
        )
    }

    flangeInputChange = (data: number[]) => {
        const readSignals: SignalRead[] = JSON.parse(JSON.stringify(this.state.readSignals))
        readSignals.map((readSignal: SignalRead) => {
            if (readSignal.signalType === FLANGE_DIGITAL_IN) {
                this.handleFlangeInput(readSignal, data)
            }
        })
        this.setState({
            readSignals: readSignals,
        })
    }

    controllerInputChange = (data: number[]) => {
        const readSignals: SignalRead[] = JSON.parse(JSON.stringify(this.state.readSignals))
        readSignals.map((readSignal: SignalRead) => {
            if (readSignal.signalType === CONTROLLER_DIGITAL_IN) {
                const index = Number(readSignal.portNo) - 1;
                if (isNaN(index)) {
                    return;
                }
                if (data[index] === 1) {
                    if (!readSignal.statusConnect) {
                        readSignal.statusConnect = true;
                    }
                } else {
                    if (readSignal.statusConnect) {
                        readSignal.statusConnect = false;
                    }
                }
                logger.info(
                    'API Name: ' +
                        'input ' +
                        'Param: ' +
                        'PortNo: ' +
                        readSignal.portNo +
                        ' Status: ' +
                        data[Number(readSignal.portNo) - 1],
                )
            }
        })
        this.setState({
            readSignals: readSignals,
        })
    }

    addWriteSignal = () => {
        const writeSignals: SignalWrite[] = [
            ...this.state.writeSignals,
            {
                ...DEFAULT_WRITE_SIGNAL,
                writeSignalsChild: [
                    {
                        portNo: '(Empty)',
                        test: false,
                    },
                ],
                optionPortNo: this.handleOptionPortNo(CONTROLLER_DIGITAL_OUT),
            },
        ];
        this.setState({
            writeSignals: writeSignals,
        })
    }

    addReadSignal = () => {
        const readSignals: SignalRead[] = [
            ...this.state.readSignals,
            {
                ...DEFAULT_READ_SIGNAL,
                optionPortNo: this.handleOptionPortNo(CONTROLLER_DIGITAL_IN),
            },
        ];
        this.setState({
            readSignals: readSignals,
        })
    }

    deleteReadSignal = (id: number) => {
        this.state.readSignals.splice(id, 1)
        this.setState({
            readSignals: this.state.readSignals,
        })
    }

    deleteWriteSignal = (id: number) => {
        this.state.writeSignals.splice(id, 1)
        this.setState({
            writeSignals: this.state.writeSignals,
        })
    }

    updateDevice = (
        index: number,
        key: 'name' | 'signalType' | 'portNo',
        signal: 'SignalWrite' | 'SignalRead',
        value: string,
    ) => {
        if (signal === 'SignalWrite' && key !== 'portNo') {
            const writeSignals: SignalWrite[] = [...this.state.writeSignals];
            writeSignals[index][key] = value;
            this.setState({
                writeSignals,
            })
        } else {
            const readSignals: SignalRead[] = [...this.state.readSignals];
            readSignals[index][key] = value;
            this.setState({
                readSignals,
            })
        }
    }

    updateErrorMsg = (value: string[], index: number, signal: 'SignalWrite' | 'SignalRead') => {
        if (signal === 'SignalWrite') {
            const writeSignals: SignalWrite[] = [...this.state.writeSignals];
            writeSignals[index].errors = value;
            this.setState({
                writeSignals,
            })
        } else {
            const readSignals: SignalRead[] = [...this.state.readSignals];
            readSignals[index].errors = value;
            this.setState({
                readSignals,
            })
        }
    }

    updateWriteSignalChildRow = (index: number, value: SignalChild[]) => {
        const writeSignals: SignalWrite[] = [...this.state.writeSignals];
        writeSignals[index].writeSignalsChild = value;
        this.setState({
            writeSignals,
        })
    }

    setDigitalOutput = async (portNo: string, test: boolean, index: number) => {
        try {
            const { signalType } = this.state.writeSignals[index];
            const type = signalType === CONTROLLER_DIGITAL_OUT ? 0 : 1;
            const pN = (Number(portNo) - 1) as GpioControlBoxDigitalIndex | GpioFlangeDigitalIndex;
            const data = await this.communicationManager?.dio.setDigitalOutput(type, pN, test)
            logger.info(
                'API Name: ' +
                    'setDigitalOutput ' +
                    'Param:' +
                    ' TypeSignal: ' +
                    type +
                    ' PortNo: ' +
                    portNo +
                    ' Test: ' +
                    test +
                    ' Status: ' +
                    data,
            )
            return data;
        } catch (error) {
            return false;
        }
    }

    onValidate = (name: string, type: string) => {
        const errorMessage = [];
        if (name) {
            const regex = new RegExp(SignalNameRegex)
            if ((name as string).length > 30) {
                errorMessage.push(errorMessages.E0003(type + ' Signal Name', 30))
            }
            if (!regex.test(name as string)) {
                errorMessage.push(errorMessages.E0002(type + ' Signal Name', 'English alphabet, number, "-"'))
            }
        }
        return errorMessage;
    }

    onBlur = (index: number, type: 'SignalWrite' | 'SignalRead') => {
        const { writeSignals, readSignals } = this.state;
        if (type === 'SignalWrite') {
            const errors = this.onValidate(writeSignals[index].name, 'Write')
            this.updateErrorMsg(errors, index, type)
        } else {
            const errors = this.onValidate(readSignals[index].name, 'Read')
            this.updateErrorMsg(errors, index, type)
        }
    }

    addChildRow = (index: number) => {
        const writeChildSignals = [
            ...this.state.writeSignals[index].writeSignalsChild,
            {
                ...DEFAULT_CHILD_SIGNAL,
            },
        ];
        this.updateWriteSignalChildRow(index, writeChildSignals)
    }

    deleteChildRow = (indexParent: number, index: number) => {
        this.state.writeSignals[indexParent].writeSignalsChild.splice(index, 1)
        this.updateWriteSignalChildRow(indexParent, this.state.writeSignals[indexParent].writeSignalsChild)
    }

    onChangeInput = (value: string, index: number, signal: 'SignalWrite' | 'SignalRead') => {
        this.updateDevice(index, 'name', signal, value)
    }

    onChangeSelect = (value: string | unknown, index: number, signal: 'SignalWrite' | 'SignalRead') => {
        const option = this.handleOptionPortNo(value as string)
        if (signal === 'SignalWrite') {
            const writeSignals: SignalWrite[] = [...this.state.writeSignals];
            writeSignals[index].optionPortNo = option;
            this.setState({
                writeSignals,
            })
        } else {
            const readSignals: SignalRead[] = [...this.state.readSignals];
            readSignals[index].optionPortNo = option;
            this.setState({
                readSignals,
            })
        }
        this.updateDevice(index, 'signalType', signal, value as string)
        if (signal === 'SignalRead') {
            this.updateReadSignalValues()
        }
    }

    handleOptionPortNo = (value: string) => {
        const option: {
            label: string;
            value: string;
        }[] = [
            {
                label: '(Empty)',
                value: '(Empty)',
            },
        ];
        let startPort: number;
        let EndPort: number;
        const robotModel = this.state.robotModel;
        if (
            (value === FLANGE_DIGITAL_IN || value === FLANGE_DIGITAL_OUT) &&
            (robotModel.includes('M') || robotModel.includes('H'))
        ) {
            startPort = 1;
            EndPort = 6;
        } else if (
            (value === FLANGE_DIGITAL_IN || value === FLANGE_DIGITAL_OUT) &&
            (robotModel.includes('A') || robotModel.includes('E'))
        ) {
            startPort = 1;
            EndPort = 2;
        } else {
            startPort = 1;
            EndPort = 20;
        }
        for (let i = startPort; i <= EndPort; i++) {
            option.push({
                label: i.toString(),
                value: i.toString(),
            })
        }
        return option;
    }

    handleCallApi = async (index: number) => {
        let statusConnect = true;
        const { writeSignalsChild } = this.state.writeSignals[index];
        document.body.style.cursor = 'progress';
        for (let idx = 0; idx < writeSignalsChild.length; idx++) {
            const element = writeSignalsChild[idx];
            const data = await this.setDigitalOutput(element.portNo, element.test, index)
            if (!data) {
                statusConnect = false;
                break;
            }
        }
        document.body.style.cursor = '';
        if (statusConnect) {
            this.setState({
                dialog: {
                    title: 'Success',
                    content: 'Data sent successfully.',
                    isStatus: statusDialog.success,
                },
                isOpenDialog: true,
            })
        } else {
            this.setState({
                dialog: {
                    title: 'Error',
                    content: 'An error has occurred.',
                    isStatus: statusDialog.error,
                },
                isOpenDialog: true,
            })
        }
    }

    handleCloseDialog = () => {
        this.setState({
            isOpenDialog: !this.state.isOpenDialog,
        })
    }

    onChangeSelectPort = (value: string | unknown, index: number, indexParent: number) => {
        const writeChildSignals: SignalChild[] = [...this.state.writeSignals[indexParent].writeSignalsChild];
        if (typeof value === 'string') {
            writeChildSignals[index].portNo = value;
        }
        this.updateWriteSignalChildRow(indexParent, this.state.writeSignals[indexParent].writeSignalsChild)
    }

    onClickButton = (value: boolean, index: number, indexParent: number) => {
        const writeChildSignals: SignalChild[] = [...this.state.writeSignals[indexParent].writeSignalsChild];
        writeChildSignals[index].test = value;
        this.updateWriteSignalChildRow(indexParent, this.state.writeSignals[indexParent].writeSignalsChild)
    }

    onChangeSelectPortRead = (value: string | unknown, index: number) => {
        const readSignals: SignalRead[] = [...this.state.readSignals];
        readSignals[index].portNo = value as string;
        this.setState({
            readSignals,
        })
        this.updateReadSignalValues()
    }

    handleResetButtonClick = async () => {
        //reset Data
        let data = DatabaseManager.getInitData(this.props.indexSelected)
        if (data !== null){
            this.setState({
                ...data,
                writeSignals: data.writeSignals,
            })
        }
    }

    onClickSave = async () => {
        await DatabaseManager.saveData(this.props.indexSelected, this.state as GripperInfo)
    }

    findSameNamesTCP = (objects: any) => {
        return objects.symbol === this.state.selectedTool.tcpParam.symbol;
    }
    onClickSetTCP = async () => {
        const tcplist = this.robotPramManger?.tcp.get()
        const count = tcplist?.find(this.findSameNamesTCP)
        let res;
        if (count === undefined) {
            //똑같은거 없으면 add
            res = await this.robotPramManger?.tcp.add(this.state.selectedTool.tcpParam)
        } else {
            //똑같은거 있으면 set
            res = await this.robotPramManger?.tcp.set(this.state.selectedTool.tcpParam)
        }
        if (res) {
            Toast.show(IToast.TYPE_SUCCESS, 'Success', 'tcp setting success', false)
        } else {
            Toast.show(IToast.TYPE_ERROR, 'Fail', 'tcp setting fail', false)
        }
    }

    updateTcp = (tcp : ToolCenterPoint)=>{
        this.setState({
            selectedTool :{
                ...this.state.selectedTool,
                tcpParam : tcp
            }
        })
    }

    updateToolWeight = (toolWeight : ToolWeight)=>{
        this.setState({
            selectedTool :{
                ...this.state.selectedTool,
                toolWeightParam : toolWeight
            }
        })
        }

    findSameNamesTW = (objects: any) => {
        return objects.symbol === this.state.selectedTool.toolWeightParam.symbol;
    }
    onClickSetToolWeight = async () => {
        //get() -> 있으면 set() 없으면 add()
        const toolWeightlist = this.robotPramManger?.toolWeight.get()
        const count = toolWeightlist?.find(this.findSameNamesTW)
        let res;
        if (count === undefined) {
            res = await this.robotPramManger?.toolWeight.add(this.state.selectedTool.toolWeightParam)
        } else {
            res = await this.robotPramManger?.toolWeight.set(this.state.selectedTool.toolWeightParam)
        }
        if (res) {
            Toast.show(IToast.TYPE_SUCCESS, 'Success', 'tool weight setting success', false)
        } else {
            Toast.show(IToast.TYPE_ERROR, 'Fail', 'tool weight setting fail', false)
        }
    }
    render() {
        const { writeSignals, readSignals, isOpenDialog, dialog } = this.state;
        const { selectedTool} = this.state;
        return (
            <Box
                component="fieldset"
                sx={{
                    p: 2,
                    border: `1px solid`,
                    borderColor: 'primary.main',
                    marginTop: 1,
                    borderRadius: '1em',
                    backgroundColor: '#FFFFFF',
                }}
            >
                <Grid container maxWidth={'100%'}>
                    <Grid item xs={8}>
                    </Grid>
                    <Grid
                        item
                        xs={4}
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Button
                            style={{
                                marginRight: '1em',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            id="button_6303"
                            onClick={this.handleResetButtonClick}
                        >
                            <Replay />
                            Reset
                        </Button>
                        <Button
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            onClick={this.onClickSave}
                        >
                            <Save />
                            Save
                        </Button>
                    </Grid>
                </Grid>
                <Chip
                    label="Tool Settings"
                    sx={{
                        marginTop: 3,
                    }}
                />
                <Box
                    component="fieldset"
                    sx={{
                        p: 2,
                        border: `1px solid`,
                        borderColor: 'primary.main',
                        marginTop: 1,
                        borderRadius: '1em',
                        backgroundColor: '#FFFFFF',
                    }}
                >
                    <ShowTCP 
                        selectedTool={this.state.selectedTool} 
                        onClickSetTCP={this.onClickSetTCP} 
                        updateTcp={this.updateTcp}
                    />
                    <ShowToolWeight
                        selectedTool={this.state.selectedTool}
                        onClickSetToolWeight={this.onClickSetToolWeight}
                        updateToolWeight={this.updateToolWeight}
                    />
                </Box>
                <Chip
                    label="DigitalIO Settings"
                    sx={{
                        marginTop: 3,
                    }}
                />
                <Box
                    component="fieldset"
                    sx={{
                        p: 2,
                        border: `1px solid blue`,
                        borderColor: 'primary.main',
                        marginTop: 1,
                        marginBottom: 3,
                        borderRadius: '1em',
                    }}
                >
                    <Grid className={`${styles['grid-add-device-form']}`}>
                        <Typography variant="body1" className={`${styles['main-screen-label']}`}>
                            DIO Gripper
                        </Typography>
                    </Grid>
                    <Grid
                        className={`${styles['grid-signals']}`}
                        container
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography className={`${styles['typo-signals-label']}`}>Write Signals</Typography>

                        <TableContainer className={`${styles['table-container']}`}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="40%" className={`${styles['first-thead-cell']}`}>
                                            Write Signal Name
                                        </TableCell>
                                        <TableCell width="30%">Signal Type</TableCell>
                                        <TableCell width="15%">Port No.</TableCell>
                                        <TableCell width="15%">Test</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {writeSignals.length ? (
                                        writeSignals.map((row: SignalWrite, index: number) => (
                                            <WriteSignal
                                                key={index}
                                                row={row}
                                                index={index}
                                                deleteWriteSignal={this.deleteWriteSignal}
                                                onChangeInput={this.onChangeInput}
                                                onBlur={this.onBlur}
                                                onChangeSelect={this.onChangeSelect}
                                                addChildRow={this.addChildRow}
                                                handleCallApi={this.handleCallApi}
                                                deleteChildRow={this.deleteChildRow}
                                                onChangeSelectPort={this.onChangeSelectPort}
                                                onClickButton={this.onClickButton}
                                            />
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className={`${styles['no-signal-row']}`}>
                                                <Typography className={`${styles['no-signal-row-label']}`}>
                                                    There are no signals added.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <Button
                                disabled = {true}
                                variant="outlined"
                                className={`${styles['button-add-signal-disable']}`}
                                //className={`${styles['button-add-signal']}`}
                                onClick={this.addWriteSignal}
                            >
                                <SvgIcon component={CommonAddIcon} />
                                <Typography
                                    sx={{
                                        marginLeft: '8px',
                                    }}
                                >
                                    {' '}
                                    Add Write Signal
                                </Typography>
                            </Button>
                        </TableContainer>
                    </Grid>
                    <Grid className={`${styles['grid-signals']}`}>
                        <Typography className={`${styles['typo-signals-label']}`}>Read Signals</Typography>
                        <TableContainer className={`${styles['table-container']}`}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="40%" className={`${styles['first-thead-cell']}`}>
                                            Read Signal Name
                                        </TableCell>
                                        <TableCell width="30%">Signal Type</TableCell>
                                        <TableCell width="15%">Port No.</TableCell>
                                        <TableCell width="15%">Test</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {readSignals.length ? (
                                        readSignals.map((row: SignalRead, index: number) => (
                                            <ReadSignal
                                                key={index}
                                                row={row}
                                                index={index}
                                                onChangeInput={this.onChangeInput}
                                                onBlur={this.onBlur}
                                                onChangeSelect={this.onChangeSelect}
                                                onChangeSelectPortRead={this.onChangeSelectPortRead}
                                                deleteReadSignal={this.deleteReadSignal}
                                            />
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className={`${styles['no-signal-row']}`}>
                                                <Typography className={`${styles['no-signal-row-label']}`}>
                                                    There are no signals added.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <Button
                                variant="outlined"
                                className={`${styles['button-add-signal']}`}
                                onClick={this.addReadSignal}
                            >
                                <SvgIcon component={CommonAddIcon} />
                                <Typography
                                    sx={{
                                        marginLeft: '8px',
                                    }}
                                >
                                    {' '}
                                    Add Read Signal
                                </Typography>
                            </Button>
                            <TableRow className={`${styles['footer-signal']}`}> </TableRow>
                        </TableContainer>
                    </Grid>
                    {isOpenDialog && (
                        <div id="dialog-container" data-gjs-type="dialog-container" className="gjs-dialog-container">
                            <Dialog
                                open={true}
                                onClose={this.handleCloseDialog}
                                aria-labelledby="alert-dialog-title"
                                aria-describedby="alert-dialog-description"
                            >
                                <DialogTitle
                                    id="alert-dialog-title"
                                    sx={{
                                        width: '600px',
                                        padding: '16px 24px 4px !important',
                                    }}
                                >
                                    {dialog.isStatus === statusDialog.success ? (
                                        <SvgIcon
                                            component={SuccessIcon}
                                            sx={{
                                                position: 'absolute',
                                                fontSize: '28px',
                                                left: '19px',
                                                top: '19px',
                                            }}
                                        />
                                    ) : (
                                        <SvgIcon
                                            component={ErrorIcon}
                                            sx={{
                                                position: 'absolute',
                                                fontSize: '28px',
                                                left: '19px',
                                                top: '19px',
                                            }}
                                        />
                                    )}
                                    <Typography
                                        sx={{
                                            paddingLeft: '26px',
                                            fontSize: '14px',
                                            color: '#2E3745;',
                                        }}
                                    >
                                        {dialog.title}
                                    </Typography>
                                    <CloseIcon
                                        sx={{
                                            position: 'absolute',
                                            left: '94%',
                                            top: '10%',
                                            fontSize: '22px',
                                            opacity: '0.5',
                                        }}
                                        onClick={this.handleCloseDialog}
                                    />
                                </DialogTitle>
                                <DialogContent
                                    sx={{
                                        marginLeft: '36px',
                                    }}
                                >
                                    <DialogContentText id="alert-dialog-description">
                                        {dialog.content}
                                    </DialogContentText>
                                </DialogContent>

                                <DialogActions
                                    sx={{
                                        backgroundColor: '#FFFFFF',
                                    }}
                                >
                                    <Button
                                        sx={{
                                            width: '120px',
                                        }}
                                        onClick={this.handleCloseDialog}
                                    >
                                        OK
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </div>
                    )}
                    <div id="dialog-container" data-gjs-type="dialog-container" className="gjs-dialog-container"></div>
                </Box>
            </Box>
        )
    }
}
export default DigitalIO;
