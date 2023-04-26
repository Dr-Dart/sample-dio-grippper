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

const UTILS = new Utils();
export default UTILS;
