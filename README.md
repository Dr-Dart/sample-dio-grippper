# [Digital I/O Gripper Sample Module]
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)


## *Precautions*
#### Note
> __This sample code is currently private  for developers participating in the Early Access Program and only works in the Dr.Dart Ecosystem.__ 

## *Overview*
This sample is a modified Digital I/O module provided from the Device Module UI templates in Dr.Dart-IDE.

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
