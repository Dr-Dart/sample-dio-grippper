/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { System, BaseModule, ModuleScreen, ModuleScreenProps, ModuleService } from 'dart-api';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import DigitalIO from './DigitalIO';
import DatabaseManager from './utils/DatabaseManager';
import IconImg from './assets/images/image-20230327-014420.png';
import styles from './assets/styles/styles.scss';
import { Container, CircularProgress, Box, FormControl, Select, MenuItem, Chip } from '@mui/material';

//User Command Screen, Service
import PipScreenForTaskEditor from './userCommandPIPScreen/PIPScreen';
import { ServiceForTaskEditor } from './userCommandService/UserCommandService';

// iffy for register a function to create an instance of main class which is inherited BaseModule.
(() => {
    System.registerModuleMainClassCreator((packageInfo) => new Module(packageInfo));
})();
class Module extends BaseModule {
    /*********
     * getModuleScreen
     * Select screen according to Screen componentId
     * Return Main Screen or PIP Screen
     *********/
    getModuleScreen(componentId: string) {
        console.log(`getModuleScreen: ${this.packageInfo.packageName}, ${componentId}`);
        if (componentId === 'MainScreen') {
            return MainScreen;
        } else if (componentId === 'pip_grasp') {
            return PipScreenForTaskEditor;
        } else if (componentId === 'pip_release') {
            return PipScreenForTaskEditor;
        }
        return null;
    }

    /*********
     * getModuleService
     * Select Service according to Service componentId
     * Return User Command Service
     *********/
    getModuleService(componentId: string): typeof ModuleService | null {
        console.log(`getModuleService: ${this.packageInfo.packageName}, ${componentId}`);
        return ServiceForTaskEditor;
    }
}
class MainScreen extends ModuleScreen {
    readonly context = this.moduleContext;
    constructor(props: ModuleScreenProps) {
        super(props);
        this.state = {
            indexSelected: 0,
            isDatabaseInitialized: false,
        };
        this.handleChange = this.handleChange.bind(this);
    }
    async componentDidMount() {
        try {
            await DatabaseManager.initDatabase(this.moduleContext);
            this.setState({
                isDatabaseInitialized: true,
            });
        } catch (error) {
            console.error(error);
            // handle error
        }
    }

    handleChange(event: any) {
        this.setState({
            indexSelected: event.target.value,
        });
    }
    render() {
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
                    <Container className={`${styles['main-container']}`}>
                        <Box
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                            }}
                        >
                            <img
                                alt={'alternative'}
                                id="img_bdb5"
                                src={IconImg}
                                style={{
                                    'width': '45%',
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    fontSize: '4rem',
                                    height: '100%',
                                    paddingLeft: '10px',
                                    textAlign: 'center',
                                }}
                            >
                                COMPANY NAME
                            </div>
                        </Box>
                        <Chip
                            label="Select Tool"
                            sx={{
                                marginTop: 3,
                            }}
                        />
                        <FormControl 
                            fullWidth
                            sx={{
                                marginTop: 1,
                            }}
                        >
                            <Select
                                labelId="select-label"
                                id="select"
                                value={this.state.indexSelected}
                                onChange={this.handleChange}
                            >
                                <MenuItem value={0}>Gripper1</MenuItem>
                                <MenuItem value={1}>Gripper2</MenuItem>
                                <MenuItem value={2}>Gripper3</MenuItem>
                            </Select>
                        </FormControl>
                        <DigitalIO moduleContext={this.moduleContext} indexSelected={this.state.indexSelected}></DigitalIO>
                    </Container>
                </ThemeProvider>
            );
        }
    }
}
