import { isEvent } from './isEvent';

export const isProperty = (key) => key !== "children" && !isEvent(key);