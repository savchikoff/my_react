function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.flat().map(child =>
                typeof child === "object"
                    ? child
                    : createTextElement(child)
            )
        }
    }
}

function createTextElement(nodeValue) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue,
            children: []
        }
    }
}

function createNode(fiber) {
    const node =
        fiber.type === "TEXT_ELEMENT"
            ? document.createTextNode("")
            : document.createElement(fiber.type);

    const isProperty = key => key !== "children";
    Object.keys(fiber.props)
        .filter(isProperty)
        .forEach(key => {
            node[key] = fiber.props[key];
        })

    return node;
}

window.requestIdleCallback =
    window.requestIdleCallback || function (handler) {
        const start = Date.now();

        return setTimeout(() => {
            handler({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
            })
        }, 1)
    }

function performUnitOfWork(fiber) {
    const isFunctionalComponent = fiber.type instanceof Function;

    if (isFunctionalComponent) {
        updateFunctionalComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }

    if (!fiber.node) {
        fiber.node = createNode(fiber);
    }

    if (fiber.parent) {
        fiber.parent.node.append(fiber.node);
    }

    const elements = fiber.props.children;

    reconcileChildren(fiber, elements);

    if (fiber.child) {
        return fiber.child;
    }

    let nextFiber = fiber;

    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }

        nextFiber = nextFiber.parent;
    }
}

let workingFiber = null;
let hookIndex = null;

function updateFunctionalComponent(fiber) {
    workingFiber = fiber;
    hookIndex = 0;
    workingFiber.hooks = [];

    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }

    reconcileChildren(fiber, fiber.props.children);
}


let nextUnitOfWork = null;
let currentRoot = null;
let workingRoot = null;
let nodesToRemove = null;

function workLoop(deadline) {
    while (nextUnitOfWork && deadline.timeRemaining() > 0) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }

    if (!nextUnitOfWork && workingRoot) {
        requestAnimationFrame(commitRoot);
    }

    requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function commitRoot() {
    nodesToRemove.forEach(commitWork);
    commitWork(workingRoot.child);
    currentRoot = workingRoot;
    workingRoot = null;
}

function commitWork(fiber) {
    if (!fiber) {
        return
    }

    let parentFiber = fiber.parent;

    while (!parentFiber.node) {
        parentFiber = parentFiber.parent;
    }

    const parentNode = parentFiber.node;

    switch (fiber.action) {
        case "ADD":
            fiber.node && parentNode.append(fiber.node);
            break;
        case "REMOVE":
            return commitRemove(fiber);
        case "UPDATE":
            fiber.node && updateNode(fiber.node, fiber.alternate.props, fiber.props);
            break;
        default:
            return;
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function commitRemove(fiber) {
    if (fiber.node) {
        return fiber.node.remove();
    }

    commitRemove(fiber.child);
}

const isEvent = key => key.startsWith("on");
const isProperty = key => key !== "children";
const wasAdded = (prev, next) => key => prev[key] !== next[key];
const wasRemoved = (_, next) => key => !(key in next);

function updateNode(node, prevProps, nextProps) {
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(wasRemoved(prevProps, nextProps))
        .forEach(key => {
            node[key] = "";
        });

    Object.keys(nextProps)
        .filter(isProperty)
        .filter(wasAdded(prevProps, nextProps))
        .forEach(key => {
            if (key === 'style' && typeof nextProps[key] === 'object') {
                Object.assign(node.style, nextProps[key])
            } else {
                node[key] = nextProps[key]
            }
        });

    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            key =>
                !(key in nextProps) ||
                wasAdded(prevProps, nextProps)(key)
        )
        .forEach(key => {
            const eventType = key.toLowerCase().substring(2);

            node.removeEventListener(
                eventType,
                prevProps[key]
            )
        });

    Object.keys(nextProps)
        .filter(isEvent)
        .filter(wasAdded(prevProps, nextProps))
        .forEach(key => {
            const eventType = key.toLowerCase().substring(2);

            node.addEventListener(
                eventType,
                nextProps[key]
            )
        })
}


function render(element, container) {
    workingRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    }

    nodesToRemove = [];
    nextUnitOfWork = workingRoot;
}

function reconcileChildren(workingFiber, elements) {
    let index = 0;
    let oldFiber = workingFiber.alternate && workingFiber.alternate.child;
    let prevSibling = null;

    while (index < elements.length || oldFiber !== null) {
        const element = elements[index];
        let newFiber = null;

        const sameType = oldFiber && element && element.type == oldFiber.type;

        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                node: oldFiber.node,
                parent: workingFiber,
                alternate: oldFiber,
                action: "UPDATE"
            }
        }

        if (element && !sameType) {
            newFiber = {
                type: element.type,
                props: element.props,
                node: null,
                parent: workingFiber,
                alternate: null,
                action: "ADD"
            }
        }

        if (oldFiber && !sameType) {
            oldFiber.action = "REMOVE";
            nodesToRemove.push(oldFiber);
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        if (index === 0) {
            workingFiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }

        prevSibling = newFiber;
        index++;
    }
}

function render(element, container) {
    const node = element.type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(element.type);

    const isProperty = key => key !== "children";
    Object.keys(element.props)
        .filter(isProperty)
        .forEach(key => {
            node[key] = element.props[key];
        })

    element.props.children.forEach(child =>
        render(child, node)
    );

    container.append(node);
}

function useState(initialState) {
    const oldHook = workingFiber.alternate && workingFiber.alternate.hooks && workingFiber.alternate.hooks[hookIndex];

    const hook = {
        state: oldHook ? oldHook.state : initialState instanceof Function ? initialState() : initialState,
        queue: []
    }

    const actions = oldHook ? oldHook.queue : [];

    actions.forEach(action => {
        hook.state = action instanceof Function ? action(hook.state) : action;
    })

    const setState = action => {
        hook.queue.push(action);

        workingRoot = {
            node: currentRoot.node,
            props: currentRoot.props,
            alternate: currentRoot
        }

        nextUnitOfWork = workingRoot;
        nodesToRemove = [];
    }

    workingFiber.hooks.push(hook);
    hookIndex++

    return [hook.state, setState]
}

const MyReact = {
    createElement,
    render
}

/** @jsx MyReact.createElement */
const element = MyReact.createElement(
    "section",
    { id: "welcome" },
    MyReact.createElement(
        "h1",
        { title: "hello", className: "title" },
        "Hello from MyReact!"
    ),
    MyReact.createElement(
        "p",
        { style: "color: green;" },
        MyReact.createElement(
            "span",
            null,
            "React"
        ),
        "from scratch"
    )
)

const container = document.getElementById("root");
MyReact.render(element, container);