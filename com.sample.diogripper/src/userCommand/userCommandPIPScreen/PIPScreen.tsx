/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-magic-numbers */

/*********
 * PIPScreen.tsx
 *********
 * User command in module's property screen.
 * Get database from module and set user command
 * - If you want to see Property screen, go to './PIPScreenComponent.tsx'
 * - If you want to set return value, go to './SetGlobalValue.tsx'
 * - If you want to see about user command DRL, go to 'userCommandService/mainDRL.drl'
 * - If you want to see user command DRL setting, go to 'userCommandService/userCommandService.ts'
 *********/

// style
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';

// component
import { ModuleScreen, IModuleChannel, Message, ModuleScreenProps } from 'dart-api';
import PropertyScreen from './PIPScreenComponent';
import SetGlobalValue from './SetGlobalValue';

interface PIPScreenState {
    // DRL Value
    indexSelected: number;

    // Global Value
    selectedValue: string;
    globalValues: string[];
}

//PIP Screen class
export default class PipScreenForTaskEditor extends ModuleScreen {
    //Use for data change
    private channel = {} as IModuleChannel;

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

    /****
     * Constructor.
     * Initialize PIP Screen state.
     *****/
    constructor(props: ModuleScreenProps) {
        super(props);
        this.state = {
            // DRL Value
            indexSelected: 0,

            // Global Value
            selectedValue: '',
            globalValues: [],
        } as PIPScreenState;
    } // constructor

    /****
     * ComponentDidMount.
     * Preload DB Data.
     *****/
    async componentDidMount() {
        //get database from Digital IO module
        if (this.message.data?.hasOwnProperty('savedData')) {
            const version = this.message.data['savedVersion'];
            const data = this.message.data['savedData'];

            if (data != null) {
                this.setState({
                    // DRL Value
                    indexSelected: data.indexSelected,

                    //Global Value
                    globalValues: data.globalValues,
                    selectedValue: data.selectedValue,
                });
            }
        }
    } //componentDidMountEditor

    /****
     * OnBind.
     * When Task Editor save Task, Send saved data.
     *****/
    onBind(message: Message, channel: IModuleChannel): boolean {
        this.channel = channel;

        // Make event "get_current_data"
        channel.receive('get_current_data', () => {
            const data: Record<string, any> = {};

            // 3. Update data in PiPScreen
            data['indexSelected'] = this.state.indexSelected;
            data['selectedValue'] = this.state.selectedValue;
            data['globalValues'] = this.state.globalValues;

            // 4. Send data to Task Editor
            channel.send('get_current_data', data);
        });

        // get global variables
        channel.receive('get_variables', (data) => {
            if (data) {
                this.setState({ globalValues: data });
            }
        });

        setTimeout(() => {
            channel.send('get_variables');
        }, 100);

        channel.receive('changed_variables', (data) => {
            if (data) {
                this.setState({ globalValues: data });
            }
        });

        return true;
    } //OnBind

    /*****
     * dataChange
     * Send changed data to Task Editor.
     *****/
    dataChange = () => {
        if (this.channel.send !== undefined) {
            const data: Record<string, any> = {};

            // 3. Update data in PiPScreen
            data['indexSelected'] = this.state.indexSelected;
            data['selectedValue'] = this.state.selectedValue;
            data['globalValues'] = this.state.globalValues;

            // 4. Send data to Task Editor
            this.channel.send('data_changed', data);
        }
    };

    /*****
     * Render Screen UI
     * Please make PiP Screen interface in the ThemeProvider. It'll make default design of PiP Screen.
     *****/
    render() {
        const { indexSelected, selectedValue, globalValues } = this.state;

        // on Change Global Value
        const onChangeGlobalValue = (selectedValue: string) => {
            this.setState(
                {
                    selectedValue: selectedValue,
                },
                () => {
                    this.dataChange();
                },
            );
        };

        const onChangeDRLValue = (index: number) => {
            this.setState(
                {
                    indexSelected: index,
                },
                () => {
                    this.dataChange();
                },
            );
        };

        //Screen
        return (
            <ThemeProvider theme={this.systemTheme}>
                {/* Property Screen */}
                <PropertyScreen
                    moduleContext={this.moduleContext}
                    currentDBIndex={indexSelected}
                    updateDRLValue={onChangeDRLValue}
                />
                {/* Select Return Value */}
                <SetGlobalValue
                    isUse={false}
                    globalValues={globalValues}
                    selectedValue={selectedValue}
                    ChangeGlobalValue={onChangeGlobalValue}
                />
            </ThemeProvider>
        );
    }
}
