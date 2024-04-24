# [Digital I/O Gripper Sample Module]
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)


## *Overview*
This sample is a user command sample module that modified Digital I/O module provided from the Device Module UI templates in Dr.Dart-IDE.

|File|Description|
|---|---|
|Manifest.json<br>(In user-module-sample-dio-gripper/com.sample.diogripper)|To use 3 screens(1 module's main screen, and 2 User Commands's property screens) and 3 user commands services are declared.|
|index.tsx |Index of module. Show main, property screens and provide service.|
|mainScreen/mainScreen.tsx |Main screen shows logo and title text, tool select box and DigitalIO component.|
|mainScreen/selectTab.tsx |Show the tab and menu bar to select and save gripper setting.|
|mainScreen/toolSettings.tsx |Show the TCP, Tool Weight screen and make the Add TCP, Tool Weight button work.|
|mainScreen/WriteSignal.tsx |Show the components to write Digital IO Signal.|
|mainScreen/Dialog.tsx |Show the dialog for change gripper setting's name, sequence, and number.|
|mainScreen/loadig.tsx |Show the loading screen when loading database.|
|userCommand/userCommandPIPScreen/PIPScreen.tsx |PIP Screen shows User Command Property screen and set user command data in Task Editor Module|
|userCommand/userCommandPIPScreen/PIPScreenComponent.tsx |PIP Screen components to show User Command Property screen in Task Editor Module|
|userCommand/userCommandService/UserCommandService.ts |	Includes interfaces that must be implemented in User Commands|
|userCommand/userCommandService/mainDRL.drl|DRL file to run user command.<br>|
|utils/DatabaseManager.ts |Includes functions to read and write data using DB functions in Dart-API|
|utils/util.ts |Includes util function like round value.|


## *Changes*
### 1.3.0
#### 1. Change main screen's UI/UX.
#### 2. Add `Gripper setting dialog` to change gripper setting's name, sequence, and number.
#### 3. Add `Select template data` button in main screen to reset data to last saved data or default three templete.
#### 4. Add `Wait time` setting after digital IO signal write.
#### 5. Add `reload` button in property screen to reload gripper setting.
#### 6. Fixed problem that allows writing non-numerical letter in tcp/tool weight.

### 1.2.1
#### 1. `TCP(Tool Center Point)` & `Tool Weight` Robot Parameters are added.
#### 2. `User Command` is available in Task Editor Module.


## *Usage*
#### In this Module, you can
* Select the preset gripper setting in order to input values.

* Change and add `TCP(Tool Center Point)` and `Tool Weight` Robot Parameters. Also you can set these parameters in the robot with tool button of the topbar in Dr.Dart-Platform.

* Change the Digital I/O signal types, ports, values and wait time of the `Grasp` and `Release`.

#### In Task Editor Module(former Task Builder/Task Writer),
* `Grasp` and `Release` User Command block will be displayed in the User Command block list. 

* You can add this command block to your task list and select the preset gripper setting.

* When the task is executed, the gripper's `Grasp` and `Release` motion will operate in robot.
