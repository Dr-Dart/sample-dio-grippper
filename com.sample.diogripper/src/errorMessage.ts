/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
export const errorMessages = {
  E0002: (itemName: string, formatType: string) => `Please input ${formatType} character on item ${itemName}.`,
  E0003: (itemName: string, maxValue: number) => `${itemName} value cannot greater than ${maxValue} characters.`,
};
