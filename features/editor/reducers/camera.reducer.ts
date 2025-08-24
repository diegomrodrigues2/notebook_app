import { EditorState, EditorAction } from '../editor.types';

export function cameraReducer(state: EditorState, action: EditorAction): EditorState {
    switch (action.type) {
        case 'START_PANNING': return { ...state, interactionState: 'PANNING', startPoint: action.payload, cameraSnapshot: { x: state.camera.x, y: state.camera.y } };
        case 'PANNING': {
            if (state.interactionState !== 'PANNING' || !state.startPoint || !state.cameraSnapshot) return state;
            const { x: currentX, y: currentY } = action.payload;
            const { x: startX, y: startY } = state.startPoint;
            return { ...state, camera: { ...state.camera, x: state.cameraSnapshot.x + (currentX - startX), y: state.cameraSnapshot.y + (currentY - startY) } };
        }
        case 'ZOOM': {
            const { x, y, deltaY } = action.payload;
            const { camera } = state;
            const zoomFactor = 1 - deltaY * 0.005;
            const newZoom = Math.max(0.1, Math.min(5.0, camera.zoom * zoomFactor));
            const worldX = (x - camera.x) / camera.zoom;
            const worldY = (y - camera.y) / camera.zoom;
            return { ...state, camera: { x: x - worldX * newZoom, y: y - worldY * newZoom, zoom: newZoom } };
        }
        case 'ZOOM_IN': return { ...state, camera: { ...state.camera, zoom: Math.min(5.0, state.camera.zoom * 1.1) } };
        case 'ZOOM_OUT': return { ...state, camera: { ...state.camera, zoom: Math.max(0.1, state.camera.zoom / 1.1) } };
        case 'RESET_ZOOM': return { ...state, camera: { x: 50, y: 50, zoom: 0.8 } };
        case 'WHEEL_PAN': {
            const { deltaX, deltaY } = action.payload;
            const k = 1;
            return {
                ...state,
                camera: {
                    ...state.camera,
                    x: state.camera.x - deltaX * k,
                    y: state.camera.y - deltaY * k,
                },
            };
        }
        default:
            return state;
    }
}