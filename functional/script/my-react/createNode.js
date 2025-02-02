import { updateNode } from "./updateNode";

export const createNode = (fiber) => {
    const node =
        fiber.type === "TEXT_ELEMENT"
            ? document.createTextNode('')
            : document.createElement(fiber.type)

    updateNode(node, {}, fiber.props);

    return node;
}