/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
//Sub Program DRL

export const DRL_Sub =
`def grasp(io_type, io_port1, io_port2, io_signal1, io_signal2):
  #wait_time[sec]
  wait_time = 0.15

  #Set IO
  if io_type == 'Controller Digital Out' :
    set_digital_output(io_port1, 0)
    set_digital_output(io_port2, 0)
    wait(wait_time)
    set_digital_output(io_port1, io_signal1)
    wait(wait_time)
    set_digital_output(io_port2, io_signal2)

  elif io_type == 'Flange Digital Out' :
    set_tool_digital_output(io_port1, 0)
    set_tool_digital_output(io_port2, 0)
    wait(wait_time)
    set_tool_digital_output(io_port1, io_signal1)
    wait(wait_time)
    set_tool_digital_output(io_port2, io_signal2)

  wait(wait_time)

def release(io_type, io_port1, io_port2, io_signal1, io_signal2):
  #wait_time[sec]
  wait_time = 0.15

  #Set IO
  if io_type == 'Controller Digital Out' :
    set_digital_output(io_port1, 0)
    set_digital_output(io_port2, 0)
    wait(wait_time)
    set_digital_output(io_port1, io_signal1)
    wait(wait_time)
    set_digital_output(io_port2, io_signal2)

  elif io_type == 'Flange Digital Out' :
    set_tool_digital_output(io_port1, 0)
    set_tool_digital_output(io_port2, 0)
    wait(wait_time)
    set_tool_digital_output(io_port1, io_signal1)
    wait(wait_time)
    set_tool_digital_output(io_port2, io_signal2)

  wait(wait_time)`