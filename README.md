# [Digital I/O Gripper Sample Module]
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)


## *Precautions*
#### Note
> __This sample code is currently private  for developers participating in the Early Access Program and only works in the Dr.Dart Ecosystem.__ 

## *Overview*
This sample is a modified Digital I/O module provided from the Device Module UI templates in Dr.Dart-IDE.

|File|Description|
|---|---|
|Manifest.json<br>(In sample-dio-grippper/<br>com.sample.diogripper)|To use 1 basic module screen and 2 User Commands, 3 screens and 3 services are declared.<br> (*Note. However, in the case of the service, it will be changed so that User Command can operate even if there is only the User Command Service service in the released version.)</br>|
|Index.tsx |Main screen shows logo and title text, tool select box and DigitalIO component.|
|DigitalIO.tsx |Show the TCP, Tool Weight, and Write/Read Signal components|
|ShowTCP.tsx |Show the TCP screen and make the Add TCP button work<br>(Actual Dart-API Function is in the DigitalIO class)|
|ShowToolWeight.tsx |Show the Tool Weight screen and make the Add Tool Weight button work<br>(The actual function is in the DigitalIO class)|
|utils/DatabaseManager.ts |Includes functions to read and write data using DB functions in Dart-API|
|userCommandPIPScreen/PIPScreen.tsx |PIP Screen shows User Command Property screen in Task Editor Module|
|userCommandService/UserCommandService.ts |	Includes interfaces that must be implemented in User Commands|
|userCommandService/constDRL.ts|DRL text file.<br>(*Note. Currently the 2nd version of EAP has a problem with not being able to find and read DRL files, so DRL must be saved in the form of a const string))|


## *Changes*

#### 1. `TCP(Tool Center Point)` & `Tool Weight` Robot Parameters are added.
#### 2. `User Command` is available in Task Editor Module.


## *Usage*
#### In this Module, you can
* Select the preset gripper setting in order to input values.

* Change and add `TCP(Tool Center Point)` and `Tool Weight` Robot Parameters. Also you can set these parameters in the robot with tool button of the topbar in Dr.Dart-Platform.

* Change the Digital I/O signal types, ports and values of the `Grasp` and `Release`.

#### In Task Editor Module(former Task Builder/Task Writer),
* `Grasp` and `Release` User Command block will be displayed in the User Command block list. 

* You can add this command block to your task list and select the preset gripper setting.

* When the task is executed, the gripper's `Grasp` and `Release` motion will operate in robot.
