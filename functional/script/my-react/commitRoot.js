import { updateNode } from "./updateNode";

const commitRemove = (fiber) => {
    if (fiber.node) {
        return fiber.node.remove();
    }

    commitRemove(fiber.child);
}

const commitWork = (fiber) => {
    if (!fiber) return;

    let parentFiber = fiber.parent;

    while (!parentFiber.node) {
        parentFiber = parentFiber.parent;
    }

    const parentNode = parentFiber.node;

    switch (fiber.action) {
        case "ADD":
            fiber.node && parentNode.append(fiber.node);
            break;
        case "UPDATE":
            fiber.node && updateNode(fiber.node, fiber.alternate.props, fiber.props)
            break;
        case "REMOVE":
            return commitRemove(fiber);
        default:
            return;
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

export const commitRoot = () => {
    MyReact.nodesToRemove.forEach(commitWork);

    commitWork(MyReact.workingRoot.child);

    MyReact.currentRoot = MyReact.workingRoot;

    MyReact.workingRoot = null;
}

