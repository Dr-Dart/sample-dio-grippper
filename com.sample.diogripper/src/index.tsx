/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

/*********
 * index.tsx
 *********
 * If you run this module, this file runs first.
 * It will load module screen like module's main screen or property screen.
 * - If you want to see main screen, go to './mainScreen/mainScreen.tsx' in this project.
 * - If you want to see user command's property screen, go to './userCommand/userCommandPIPScreen/PIPScreen.tsx' in this project.
 * - If you want to see utils like database, go to './utils' in this project.
 *********/
import { System, BaseModule, ModuleScreen, ModuleScreenProps, ModuleService } from 'dart-api';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';

// Main Screen
import DIOGripper from './mainScreen/mainScreen';

// User Command Screen, Service
import PipScreenForTaskEditor from './userCommand/userCommandPIPScreen/PIPScreen';
import { ServiceForTaskEditor } from './userCommand/userCommandService/UserCommandService';

// iffy for register a function to create an instance of main class which is inherited BaseModule.
(() => {
    System.registerModuleMainClassCreator((packageInfo) => new Module(packageInfo));
})();

class Module extends BaseModule {
    /*********
     * getModuleScreen
     * - Select screen according to Screen componentId
     * - Return Main Module Screen or Command Property(PIP) Screen
     *********/
    getModuleScreen(componentId: string) {
        if (componentId === 'MainScreen') {
            // Main Module Screen
            return MainScreen;
        } else if (componentId === 'pip_grasp') {
            // Command Property Screen
            return PipScreenForTaskEditor;
        } else if (componentId === 'pip_release') {
            // Command Property Screen
            return PipScreenForTaskEditor;
        }
        return null;
    }

    /*********
     * getModuleService
     * - Return User Command Service
     *********/
    getModuleService(componentId: string): typeof ModuleService | null {
        return ServiceForTaskEditor;
    }
}

/*********
 * MainScreen
 * - Render main screen of module
 *********/
class MainScreen extends ModuleScreen {
    constructor(props: ModuleScreenProps) {
        super(props);
    }

    render() {
        return (
            <ThemeProvider theme={this.systemTheme}>
                <DIOGripper moduleContext={this.moduleContext}></DIOGripper>
            </ThemeProvider>
        );
    }
}
