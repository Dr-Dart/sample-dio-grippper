/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

class Utils {
  constructor() {
    // window.positionManage = SystemData.getPositionManager();
    // this.motionManager = SystemData.getMotionManager();
    // this.mathLib = SystemData.getSystemLibrary(SystemData.MATH_LIBRARY);
  }

  /**
   * Is 2 objects different?
   * @param base object
   * @param target object
   * @returns boolean
   */
  public deepCompareObject<T>(base: T, target: T): boolean {
    for (const k in base) {
      if (base[k] !== null && typeof base[k] === 'object') {
        return this.deepCompareObject(base[k], target[k]);
      } else {
        if (base[k] !== target[k]) {
          return true;
        }
      }
    }
    return false;
  }
}

  // round util
export const roundDownValue = (value : string, round : number) => {
  let stringValue = value

  // If zero exist in int value, convert it to erase 00
  if (value.indexOf('.') != -1 && value.indexOf('0') != -1 && value.indexOf('.') - value.indexOf('0') != 1 ) {
      // check number length and string length. (If 00.xxx or -00.xxxx, length difference will over 1)

      if ( value.indexOf('-00') == 0 || value.indexOf('00') == 0) {
          stringValue = String(Number(stringValue))
      }
      else if ( value.length - String(Number(value)).length > 1){
          stringValue = String(Number(stringValue))
      }
  }
  // If zero exist in float value, convert it to erase 00
  else if (value.indexOf('.') == -1 && value.indexOf('0') != -1) {
      stringValue = String(Number(stringValue))
  }

  // If . exist, cut it to round 2.
  if (value.indexOf('.') != -1 && value.length - value.indexOf('.') -1 > 2){
      let splitValue = stringValue.split('.')
      return splitValue[0] + '.' + splitValue[1].substring(0,round)
  }

  return stringValue
}

const UTILS = new Utils();
