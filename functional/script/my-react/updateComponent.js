import { reconcileChildren } from "./reconcileChildren";
import { createNode } from "./createNode";

export const updateFunctionComponent = (fiber) => {
    MyReact.workingFiber = fiber;
    MyReact.hookIndex = 0;
    MyReact.workingFiber.hooks = [];

    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
}

export const updateHostComponent = (fiber) => {
    if (!fiber.node) {
        fiber.node = createNode(fiber);
    }

    const children = fiber.props.children;
    reconcileChildren(fiber, children);
}