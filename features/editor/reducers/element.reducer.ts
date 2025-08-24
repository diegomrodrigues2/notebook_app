
import { EditorState, EditorAction } from '../editor.types';
import { CanvasElement, TextElement, RectangleElement, LineElement, ArrowElement } from '../../../types/elements';
import { findPage, updatePageInNotebooks, commitHistory } from '../editor.helpers';
import { measureText } from '../../../utils/text';
import { generateId } from '../../../utils/id';

export function elementReducer(state: EditorState, action: EditorAction): EditorState {
  const { present } = state.history;

  switch (action.type) {
    case 'CREATE_BOUND_TEXT': {
      const { pageId, containerId } = action.payload;
      const pageResult = findPage(present, pageId);
      if (!pageResult) return state;
      const container = pageResult.page.elements.find(e => e.id === containerId);
      if (!container || (container.type !== 'RECTANGLE' && container.type !== 'ELLIPSE')) return state;

      const fontSize = state.currentStyle.fontSize;
      const fontFamily = state.currentStyle.fontFamily;
      const { width: tw, height: th } = measureText('', fontSize, fontFamily);
      const padding = 12;
      // center text block inside container by default
      const x = container.x + (container.width - tw) / 2;
      const y = container.y + (container.height - th) / 2;

      const id = generateId();
      const textEl: TextElement = {
        id, type: 'TEXT',
        x, y, width: Math.max(1, tw), height: Math.max(1, th),
        text: '',
        fontSize, fontFamily,
        seed: Math.random() * 1_000_000,
        stroke: state.currentStyle.stroke,
        fill: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 0,
        strokeStyle: 'solid',
        zIndex: (container.zIndex ?? 0) + 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        wrap: true,
        containerId: container.id,
        padding,
        backgroundColor: 'transparent',
      };

      const updatedPage = { ...pageResult.page, elements: [...pageResult.page.elements, textEl] };
      const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
      return {
        ...state,
        history: { ...state.history, present: newPresent },
        historySnapshot: present, // make the whole editing undoable at once
        interactionState: 'EDITING_TEXT',
        currentElementId: id,
        selectedElement: { pageId, elementId: id },
      };
    }

    case 'CREATE_EDGE_LABEL': {
      const { pageId, edgeId } = action.payload;
      const pageResult = findPage(present, pageId);
      if (!pageResult) return state;
      const edge = pageResult.page.elements.find(e => e.id === edgeId) as LineElement | ArrowElement | undefined;
      if (!edge || (edge.type !== 'LINE' && edge.type !== 'ARROW')) return state;

      const [a, b] = edge.points;
      const midX = (a[0] + b[0]) / 2;
      const midY = (a[1] + b[1]) / 2;

      const fontSize = state.currentStyle.fontSize;
      const fontFamily = state.currentStyle.fontFamily;
      const m = measureText('', fontSize, fontFamily);
      const pad = 6;
      const id = generateId();
      const textEl: TextElement = {
        id, type: 'TEXT',
        x: midX - m.width / 2, // top-left of text block so it’s centered on midpoint
        y: midY - m.height / 2,
        width: Math.max(1, m.width), height: Math.max(1, m.height),
        text: '',
        fontSize, fontFamily,
        seed: Math.random() * 1_000_000,
        stroke: state.currentStyle.stroke,
        fill: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 0,
        strokeStyle: 'solid',
        zIndex: (edge.zIndex ?? 0) + 1,
        textAlign: 'center',
        attachedToId: edge.id,
        padding: pad,
        backgroundColor: 'white', // key for visibility on strokes
      };

      const updatedPage = { ...pageResult.page, elements: [...pageResult.page.elements, textEl] };
      const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
      return {
        ...state,
        history: { ...state.history, present: newPresent },
        historySnapshot: present,
        interactionState: 'EDITING_TEXT',
        currentElementId: id,
        selectedElement: { pageId, elementId: id },
      };
    }

    case 'UPDATE_ELEMENT_PROPERTIES': {
      if (!state.selectedElement) return state;
      const { pageId, elementId } = state.selectedElement;
      const pageResult = findPage(present, pageId);
      if (!pageResult) return state;

      const page = pageResult.page;
      const updatedElements = page.elements.map(el => {
        if (el.id !== elementId) return el;
        
        const newProperties = action.payload.properties;
        let updatedElement = { ...el, ...newProperties } as CanvasElement;

        if (updatedElement.type === 'TEXT') {
          const te = updatedElement as TextElement;
          const wrapWidth = te.wrap ? Math.max(10, te.width) : undefined;
          const nextFontSize =
            ('fontSize' in newProperties && typeof newProperties.fontSize === 'number')
              ? newProperties.fontSize
              : te.fontSize;
          const nextFontFamily =
            ('fontFamily' in newProperties && typeof newProperties.fontFamily === 'string')
              ? newProperties.fontFamily
              : te.fontFamily;

          const measured = measureText(te.text, nextFontSize, nextFontFamily, wrapWidth);
          // For unbound text, update size to content.
          // For bound text, keep inner height (t.height) stable; only width matters if not wrapping.
          if (!te.containerId) {
            updatedElement = {
                ...te,
                fontSize: nextFontSize,
                fontFamily: nextFontFamily,
                height: measured.height,
                width: te.wrap ? Math.max(10, te.width) : measured.width,
            };
          }
        }
        return updatedElement as CanvasElement;
      });
      
      const updatedPage = { ...page, elements: updatedElements };
      const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
      
      return { ...commitHistory(state, newPresent), currentStyle: { ...state.currentStyle, ...action.payload.properties } };
    }
    
    case 'FIT_CONTAINER_TO_TEXT': {
        if (!state.selectedElement) return state;
        const { pageId, elementId } = state.selectedElement;
        const pageResult = findPage(present, pageId);
        if (!pageResult) return state;
        
        const container = pageResult.page.elements.find(el => el.id === elementId);
        if (!container || (container.type !== 'RECTANGLE' && container.type !== 'ELLIPSE')) {
            return state;
        }

        const boundText = pageResult.page.elements.find(el => el.type === 'TEXT' && (el as TextElement).containerId === container.id) as TextElement | undefined;
        if (!boundText) return state;

        const padding = boundText.padding ?? 12;
        // measure with current inner width (so we respect existing wrapping)
        const innerW = Math.max(1, boundText.width);
        const m = measureText(boundText.text, boundText.fontSize, boundText.fontFamily, innerW);
        const newInnerW = Math.max(m.width, innerW); // don't shrink width below current wrap by default
        const newContainerWidth = Math.max(40, newInnerW + padding * 2);
        const newContainerHeight = Math.max(40, m.height + padding * 2);

        const updatedElements = pageResult.page.elements.map(el => {
            if (el.id === container.id) {
                return {
                    ...el,
                    width: newContainerWidth,
                    height: newContainerHeight,
                };
            }
            if (el.id === boundText.id) {
                return {
                    ...el,
                    x: container.x + padding,
                    y: container.y + padding,
                    width: newContainerWidth - padding * 2,
                    height: newContainerHeight - padding * 2,
                };
            }
            return el;
        });

        const updatedPage = { ...pageResult.page, elements: updatedElements as CanvasElement[] };
        const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
        return commitHistory(state, newPresent);
    }

    case 'WRAP_TEXT_IN_CONTAINER': {
        if (!state.selectedElement) return state;
        const { pageId, elementId } = state.selectedElement;
        const pageResult = findPage(present, pageId);
        if (!pageResult) return state;

        const textElement = pageResult.page.elements.find(el => el.id === elementId) as TextElement | undefined;
        if (!textElement || textElement.type !== 'TEXT' || textElement.containerId) return state;

        const padding = textElement.padding ?? 12;
        const containerId = generateId();
        const m = measureText(textElement.text, textElement.fontSize, textElement.fontFamily);
        const maxZ = pageResult.page.elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);

        const newContainer: RectangleElement = {
            id: containerId,
            type: 'RECTANGLE',
            x: textElement.x - padding,
            y: textElement.y - padding,
            width: Math.max(40, m.width + padding * 2),
            height: Math.max(40, m.height + padding * 2),
            stroke: '#495057',
            fill: '#ffffff',
            fillStyle: 'solid',
            strokeWidth: 2,
            strokeStyle: 'solid',
            roundness: 'sharp',
            seed: Math.random() * 1_000_000,
            zIndex: maxZ + 1,
        };

        const updatedText: TextElement = {
            ...textElement,
            containerId: containerId,
            wrap: true,
            textAlign: 'center',
            verticalAlign: 'middle',
            padding,
            x: newContainer.x + padding,
            y: newContainer.y + padding,
            width: newContainer.width - padding * 2,
            height: newContainer.height - padding * 2,
            zIndex: maxZ + 2,
        };
        
        const elementsWithoutText = pageResult.page.elements.filter(el => el.id !== elementId);
        const updatedElements = [...elementsWithoutText, newContainer, updatedText];

        const updatedPage = { ...pageResult.page, elements: updatedElements };
        const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
        
        return {
            ...commitHistory(state, newPresent),
            selectedElement: { pageId, elementId: containerId },
        };
    }

    case 'BRING_TO_FRONT':
    case 'SEND_TO_BACK':
    case 'BRING_FORWARD':
    case 'SEND_BACKWARD': {
        if (!state.selectedElement) return state;
        const { pageId, elementId } = state.selectedElement;
        const pageResult = findPage(present, pageId);
        if (!pageResult) return state;

        const sortedElements = [...pageResult.page.elements].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sortedElements.findIndex(el => el.id === elementId);
        if (currentIndex === -1) return state;

        let updatedElements: CanvasElement[] = [];

        if (action.type === 'BRING_TO_FRONT') {
            if (sortedElements.length < 2) return state;
            const maxZIndex = sortedElements[sortedElements.length - 1].zIndex;
            updatedElements = pageResult.page.elements.map(el => 
                el.id === elementId ? { ...el, zIndex: maxZIndex + 1 } : el
            );
        } else if (action.type === 'SEND_TO_BACK') {
            if (sortedElements.length < 2) return state;
            const minZIndex = sortedElements[0].zIndex;
            updatedElements = pageResult.page.elements.map(el => 
                el.id === elementId ? { ...el, zIndex: minZIndex - 1 } : el
            );
        } else if (action.type === 'BRING_FORWARD') {
            if (currentIndex >= sortedElements.length - 1) return state; // Already at front
            const nextElement = sortedElements[currentIndex + 1];
            const currentZIndex = sortedElements[currentIndex].zIndex;
            const nextZIndex = nextElement.zIndex;
            updatedElements = pageResult.page.elements.map(el => {
                if (el.id === elementId) return { ...el, zIndex: nextZIndex };
                if (el.id === nextElement.id) return { ...el, zIndex: currentZIndex };
                return el;
            });
        } else if (action.type === 'SEND_BACKWARD') {
            if (currentIndex <= 0) return state; // Already at back
            const prevElement = sortedElements[currentIndex - 1];
            const currentZIndex = sortedElements[currentIndex].zIndex;
            const prevZIndex = prevElement.zIndex;
            updatedElements = pageResult.page.elements.map(el => {
                if (el.id === elementId) return { ...el, zIndex: prevZIndex };
                if (el.id === prevElement.id) return { ...el, zIndex: currentZIndex };
                return el;
            });
        }
        
        if (updatedElements.length > 0) {
            const updatedPage = { ...pageResult.page, elements: updatedElements };
            const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
            return commitHistory(state, newPresent);
        }

        return state;
    }
    
    default:
        return state;
  }
}