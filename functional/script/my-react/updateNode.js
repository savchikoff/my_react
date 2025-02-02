import { formatEvent } from './utils/formatEvent';
import { isEvent } from './utils/isEvent';
import { isProperty } from './utils/isProperty';
import { wasAdded } from './utils/wasAdded';
import { wasRemoved } from './utils/wasRemoved';

export const updateNode = (node, prevProps, nextProps) => {
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => !(key in nextProps) || wasAdded(prevProps, nextProps)(key))
        .forEach(key => {
            const eventType = formatEvent(key);

            node.removeEventListener(eventType, prevProps[key]);
        });

    Object.keys(prevProps)
        .filter(isProperty)
        .filter(wasRemoved(nextProps))
        .forEach(key => {
            node[key] = ''
        });


    Object.keys(nextProps)
        .filter(isEvent)
        .filter(wasAdded(prevProps, nextProps))
        .forEach(key => {
            const eventType = formatEvent(key);

            node.addEventListener(eventType, nextProps[key]);
        });

    Object.keys(nextProps)
        .filter(isProperty)
        .filter(wasAdded(prevProps, nextProps))
        .forEach(key => {
            if (key === 'style' && typeof nextProps[key] === "object") {
                Object.assign(node.style, nextProps[key]);
            } else {
                node[key] = nextProps[key];
            }
        })

}